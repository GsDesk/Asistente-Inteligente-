import os
import json
import re
import requests
from pathlib import Path
from datetime import datetime

BASE_DIR = Path(__file__).resolve().parent.parent

class AriaTutorService:
    def __init__(self):
        self.ollama_url = "http://host.docker.internal:11434/api/chat"
        self.model_name = "llama3.2:3b"  # RTX 2080 6GB — llama3.1:8b requiere ~4.4GB VRAM (OOM)
        self.prompts = self._load_prompts()

    def _load_prompts(self):
        try:
            prompt_path = BASE_DIR / 'config' / 'prompts.json'
            with open(prompt_path, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            print(f"Error cargando prompts: {e}")
            return {}

    def get_formatted_prompt(self, prompt_key, **kwargs):
        prompt = self.prompts.get(prompt_key, "")
        for key, value in kwargs.items():
            prompt = prompt.replace(f"{{{key}}}", str(value))
        return prompt

    def _clean_json_string(self, json_str):
        """
        Limpia un string JSON que puede tener comentarios u otros artefactos
        que el modelo LLM agregó y que hacen que json.loads falle.
        """
        # Remover comentarios de tipo // ... hasta fin de línea
        json_str = re.sub(r'//[^\n]*', '', json_str)
        # Remover comentarios de tipo /* ... */
        json_str = re.sub(r'/\*.*?\*/', '', json_str, flags=re.DOTALL)
        # Remover comas antes de } o ]
        json_str = re.sub(r',\s*([}\]])', r'\1', json_str)
        return json_str.strip()

    def _extract_human_message(self, text, fallback="He procesado tu solicitud."):
        """
        Extrae el mensaje legible para humanos de un texto que puede contener JSON.
        Elimina cualquier bloque JSON y devuelve solo el texto natural.
        """
        # Primero intentar extraer texto que está FUERA del JSON
        # Buscar todo el texto antes y después del bloque JSON
        json_pattern = re.compile(r'\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}', re.DOTALL)
        
        # Obtener texto sin JSON
        clean_text = json_pattern.sub('', text).strip()
        
        # Limpiar artefactos de formato
        clean_text = re.sub(r'```(?:json)?', '', clean_text)
        clean_text = re.sub(r'\n{3,}', '\n\n', clean_text)
        clean_text = clean_text.strip()
        
        # Si queda texto legible después de quitar el JSON, devolverlo
        if clean_text and len(clean_text) > 10:
            return clean_text
        
        return fallback

    def _parse_and_execute_action(self, text, user=None):
        from .models import Task
        from datetime import datetime, date, time

        # Intentar encontrar JSON en el texto
        json_match = re.search(r'\{.*\}', text, re.DOTALL)
        if not json_match:
            # No hay JSON, devolver texto limpio (sin artefactos de formato)
            return self._clean_response_text(text)

        raw_json = json_match.group(0)
        
        try:
            # Limpiar el JSON (remover comentarios, etc.)
            cleaned_json = self._clean_json_string(raw_json)
            data = json.loads(cleaned_json)

            if data.get("accion") == "crear_tarea" and "tarea" in data:
                tarea = data["tarea"]
                try:
                    fecha_obj = datetime.strptime(tarea.get("fecha", ""), "%Y-%m-%d").date()
                except ValueError:
                    fecha_obj = date.today()

                try:
                    hora_obj = datetime.strptime(tarea.get("hora", ""), "%H:%M").time()
                except ValueError:
                    hora_obj = time(12, 0)

                prioridad = tarea.get("prioridad", "media").lower()
                if prioridad not in ['alta', 'media', 'baja']:
                    prioridad = 'media'

                titulo = tarea.get("titulo", "Nueva Tarea")
                
                Task.objects.create(
                    user=user,
                    title=titulo,
                    description=tarea.get("descripcion", ""),
                    date=fecha_obj,
                    time=hora_obj,
                    priority=prioridad,
                    category=tarea.get("categoria", "otro")[:50]
                )

                # Devolver el mensaje para la UI, nunca el JSON
                ui_msg = data.get("mensaje_ui", data.get("mensaje_voz", ""))
                if ui_msg:
                    return ui_msg
                
                # Construir un mensaje amigable si no hay mensaje_ui
                hora_str = hora_obj.strftime('%I:%M %p')
                fecha_str = fecha_obj.strftime('%d/%m/%Y')
                return f'✅ Listo. He agendado "{titulo}" para el {fecha_str} a las {hora_str} con prioridad {prioridad}.'

            # Si hay JSON pero no es crear_tarea, buscar mensaje_ui o devolver texto humano
            if "mensaje_ui" in data:
                return data["mensaje_ui"]
            if "mensaje_voz" in data:
                return data["mensaje_voz"]
            if "mensaje_usuario" in data:
                return data["mensaje_usuario"]
                
        except json.JSONDecodeError:
            # JSON malformado — extraer lo que se pueda del texto
            pass
        except Exception as e:
            print(f"Error interno procesando accion: {e}")

        # Si no se pudo parsear el JSON o no es una acción,
        # devolver el texto SIN el JSON (solo la parte legible)
        human_text = self._extract_human_message(text, fallback="")
        if human_text:
            return human_text
        
        # Último recurso: limpiar todo el texto
        return self._clean_response_text(text)

    def _clean_response_text(self, text):
        """
        Limpia el texto de respuesta eliminando JSON, bloques de código
        y otros artefactos que no deberían verse en la interfaz.
        """
        # Remover bloques de código con backticks
        text = re.sub(r'```(?:json|python|javascript|bash)?[\s\S]*?```', '', text)
        
        # Remover bloques JSON sueltos (entre { })
        text = re.sub(r'\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}', '', text, flags=re.DOTALL)
        
        # Limpiar saltos de línea excesivos
        text = re.sub(r'\n{3,}', '\n\n', text)
        
        # Limpiar espacios excesivos
        text = re.sub(r' {2,}', ' ', text)
        
        result = text.strip()
        
        # Si después de limpiar no queda nada útil
        if not result or len(result) < 5:
            return "He procesado tu solicitud. ¿Hay algo más en lo que pueda ayudarte?"
        
        return result

    def generate_chat_response(self, user_message, chat_history=None, file_context="", user=None):
        from .models import Task
        now = datetime.now()

        # Solo tareas del usuario autenticado
        task_filter = {'completed': False}
        if user and user.is_authenticated:
            task_filter['user'] = user

        pending_tasks = Task.objects.filter(**task_filter).order_by('priority', 'date', 'time')
        if pending_tasks.exists():
            lista_tareas = "\n".join([
                f"- {t.title} (Prioridad: {t.priority}) el {t.date} a las {t.time.strftime('%I:%M %p')}"
                for t in pending_tasks
            ])
        else:
            lista_tareas = "No hay tareas pendientes en este momento."

        nombre_usuario = "Usuario"
        if user and user.is_authenticated:
            nombre_usuario = user.first_name or user.username

        system_instructions = self.get_formatted_prompt(
            "chat_libre",
            nombre_usuario=nombre_usuario,
            historial_conversacion=str(chat_history) if chat_history else "",
            resumen_tareas=lista_tareas,
            hora_actual=now.strftime("%H:%M"),
            fecha_actual=now.strftime("%Y-%m-%d"),
            sistema_operativo="Windows 11"
        )

        payload = {
            "model": self.model_name,
            "messages": [
                {"role": "system", "content": system_instructions},
                {"role": "user",   "content": user_message + file_context}
            ],
            "stream": False
        }

        try:
            response = requests.post(self.ollama_url, json=payload, timeout=90)
            if response.status_code == 200:
                data = response.json()
                raw_text = data.get("message", {}).get("content", "")
                return self._parse_and_execute_action(raw_text, user=user)
            else:
                return f"Lo siento, hubo un problema con el modelo. Código: {response.status_code}. Por favor intenta de nuevo."
        except requests.exceptions.RequestException:
            return "No logré conectarme a Ollama. Asegúrate de que la aplicación de Ollama esté abierta en Windows."

    def generate_evaluation(self, topic, user=None, document_content=""):
        system_instructions = self.get_formatted_prompt(
            "generar_evaluacion",
            topic=topic
        )

        # Construir el mensaje del usuario
        user_content = f"Por favor genera el examen sobre: {topic}"
        
        # Si hay contenido de documento, truncar a un tamaño manejable para el modelo
        if document_content:
            # Limitar a 2000 caracteres para dejar espacio al modelo para generar
            doc_truncated = document_content[:2000]
            if len(document_content) > 2000:
                doc_truncated += "\n[... documento truncado ...]"
            
            user_content += (
                f"\n\n--- CONTENIDO DEL DOCUMENTO ---\n"
                f"{doc_truncated}\n"
                f"--- FIN DEL DOCUMENTO ---\n\n"
                f"IMPORTANTE: Genera 3 preguntas basadas en el documento. "
                f"Cada opción debe ser CORTA (máximo 15 palabras por opción). "
                f"NO copies párrafos completos como opciones. "
                f"Responde ÚNICAMENTE con el JSON."
            )

        payload = {
            "model": self.model_name,
            "messages": [
                {"role": "system", "content": system_instructions},
                {"role": "user",   "content": user_content}
            ],
            "stream": False,
            "options": {
                "temperature": 0.3,
                "num_predict": 2048  # Suficiente para 3 preguntas completas en JSON
            }
        }

        try:
            response = requests.post(self.ollama_url, json=payload, timeout=180)
            if response.status_code == 200:
                data = response.json()
                raw_text = data.get("message", {}).get("content", "")
                
                print(f"[AMY Evaluación] Respuesta cruda del modelo ({len(raw_text)} chars):")
                print(raw_text[:500])
                
                # Intentar extraer JSON del texto
                result = self._try_parse_evaluation_json(raw_text)
                if result:
                    return result
                
                return {
                    "error": "El modelo no generó un formato válido. Intenta de nuevo o usa un tema más específico."
                }
            else:
                return {"error": f"Ollama falló con código {response.status_code}."}
        except requests.exceptions.Timeout:
            return {"error": "El análisis del documento tomó demasiado tiempo. Intenta con un documento más corto."}
        except requests.exceptions.RequestException as e:
            print(f"[AMY Evaluación] Error de conexión: {e}")
            return {"error": "No logré conectarme a Ollama. Asegúrate que esté abierto."}

    def _try_parse_evaluation_json(self, raw_text):
        """
        Intenta múltiples estrategias para extraer un JSON de evaluación válido
        del texto del modelo.
        """
        # Estrategia 1: Buscar JSON directamente
        json_match = re.search(r'\{.*\}', raw_text, re.DOTALL)
        if json_match:
            raw_json = json_match.group(0)
            
            # 1a: Intentar parsear directamente
            try:
                return json.loads(raw_json)
            except json.JSONDecodeError:
                pass
            
            # 1b: Limpiar comentarios y reintentar
            try:
                cleaned = self._clean_json_string(raw_json)
                return json.loads(cleaned)
            except json.JSONDecodeError:
                pass
            
            # 1c: Intentar reparar JSON línea por línea
            try:
                repaired = self._repair_json(raw_json)
                return json.loads(repaired)
            except (json.JSONDecodeError, Exception):
                pass

        # Estrategia 2: Buscar dentro de bloques de código ```json ... ```
        code_match = re.search(r'```(?:json)?\s*(\{.*?\})\s*```', raw_text, re.DOTALL)
        if code_match:
            try:
                cleaned = self._clean_json_string(code_match.group(1))
                return json.loads(cleaned)
            except json.JSONDecodeError:
                pass

        print(f"[AMY Evaluación] No se pudo parsear JSON de: {raw_text[:300]}")
        return None

    def _repair_json(self, json_str):
        """
        Intenta reparar JSON malformado eliminando líneas problemáticas.
        """
        # Remover comentarios
        json_str = re.sub(r'//[^\n]*', '', json_str)
        json_str = re.sub(r'/\*.*?\*/', '', json_str, flags=re.DOTALL)
        
        # Remover comas finales antes de } o ]
        json_str = re.sub(r',\s*([}\]])', r'\1', json_str)
        
        # Remover caracteres de control
        json_str = re.sub(r'[\x00-\x1f\x7f]', ' ', json_str)
        json_str = json_str.replace('\t', ' ')
        
        # Asegurar que las strings estén cerradas (reparación básica)
        # Reemplazar saltos de línea dentro de strings
        lines = json_str.split('\n')
        cleaned_lines = []
        for line in lines:
            line = line.strip()
            if line:
                cleaned_lines.append(line)
        
        return ' '.join(cleaned_lines)
