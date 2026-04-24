import os
import json
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

    def _parse_and_execute_action(self, text, user=None):
        import re
        from .models import Task
        from datetime import datetime, date, time

        json_match = re.search(r'\{.*\}', text, re.DOTALL)
        if not json_match:
            return text

        try:
            data = json.loads(json_match.group(0))

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

                Task.objects.create(
                    user=user,
                    title=tarea.get("titulo", "Nueva Tarea de ARIA"),
                    description=tarea.get("descripcion", ""),
                    date=fecha_obj,
                    time=hora_obj,
                    priority=prioridad,
                    category=tarea.get("categoria", "otro")[:50]
                )

                return data.get("mensaje_ui", data.get("mensaje_voz", "He creado la tarea exitosamente."))
        except json.JSONDecodeError:
            pass
        except Exception as e:
            print(f"Error interno procesando accion: {e}")

        return text

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
                return f"[Modo Degradado] Ollama fallo con codigo {response.status_code}."
        except requests.exceptions.RequestException:
            return "[Modo Degradado] No logre conectarme a Ollama. Asegurate que la aplicacion de Ollama este abierta en Windows."

    def generate_evaluation(self, topic, user=None):
        import re
        system_instructions = self.get_formatted_prompt(
            "generar_evaluacion",
            topic=topic
        )

        payload = {
            "model": self.model_name,
            "messages": [
                {"role": "system", "content": system_instructions},
                {"role": "user",   "content": f"Por favor genera el examen sobre: {topic}"}
            ],
            "stream": False
        }

        try:
            response = requests.post(self.ollama_url, json=payload, timeout=90)
            if response.status_code == 200:
                data = response.json()
                raw_text = data.get("message", {}).get("content", "")
                
                # Extraer JSON del raw_text
                json_match = re.search(r'\{.*\}', raw_text, re.DOTALL)
                if json_match:
                    try:
                        return json.loads(json_match.group(0))
                    except json.JSONDecodeError:
                        return {"error": "El modelo no generó un JSON válido."}
                return {"error": "No se encontró un JSON en la respuesta del modelo.", "raw": raw_text}
            else:
                return {"error": f"Ollama falló con código {response.status_code}."}
        except requests.exceptions.RequestException:
            return {"error": "No logré conectarme a Ollama."}
