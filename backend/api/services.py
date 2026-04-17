import os
import json
import requests
from pathlib import Path
from datetime import datetime

BASE_DIR = Path(__file__).resolve().parent.parent

class AriaTutorService:
    def __init__(self):
        # Configuración para Ollama local
        # Usamos host.docker.internal para conectar el contenedor a tu red de Windows local
        self.ollama_url = "http://host.docker.internal:11434/api/chat"
        # Ajusta el nombre si usaras qwen2.5 u otro.
        self.model_name = "llama3.1"
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

    def _parse_and_execute_action(self, text):
        import re
        from .models import Task
        from datetime import datetime, date, time
        
        # Buscar estructuras JSON (con o sin markdown ```json)
        json_match = re.search(r'\{.*\}', text, re.DOTALL)
        if not json_match:
            return text 
            
        try:
            data = json.loads(json_match.group(0))

            # ACCIÓN A: Crear Tarea
            if data.get("accion") == "crear_tarea" and "tarea" in data:
                tarea = data["tarea"]
                # Control de tolerancia a fallos en la IA para fechas
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
                    title=tarea.get("titulo", "Nueva Tarea de ARIA"),
                    description=tarea.get("descripcion", ""),
                    date=fecha_obj,
                    time=hora_obj,
                    priority=prioridad,
                    category=tarea.get("categoria", "otro")[:50]
                )
                
                # Devolvemos estrictamente el texto puro para que Text-to-Speech funcione bonito
                return data.get("mensaje_ui", data.get("mensaje_voz", "He creado la tarea exitosamente."))
        except json.JSONDecodeError:
            pass # Si el json es inválido o no existe, simplemente devolvemos todo el texto.
        except Exception as e:
            print(f"Error interno procesando acción: {e}")
            
        return text

    def generate_chat_response(self, user_message, chat_history=None, file_context=""):
        from .models import Task
        now = datetime.now()
        
        # Obtenemos las tareas pendientes ordenadas
        pending_tasks = Task.objects.filter(completed=False).order_by('priority', 'date', 'time')
        if pending_tasks.exists():
            lista_tareas = "\n".join([f"- {t.title} (Prioridad: {t.priority}) el {t.date} a las {t.time.strftime('%I:%M %p')}" for t in pending_tasks])
        else:
            lista_tareas = "No hay tareas pendientes en este momento."
        
        # Enriquecer todas las variables
        system_instructions = self.get_formatted_prompt(
            "chat_libre",
            nombre_usuario="Alex",
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
                {"role": "user", "content": user_message + file_context}
            ],
            "stream": False
        }

        try:
            response = requests.post(self.ollama_url, json=payload, timeout=90)
            if response.status_code == 200:
                data = response.json()
                raw_text = data.get("message", {}).get("content", "")
                return self._parse_and_execute_action(raw_text)
            else:
                return f"[Modo Degradado] Ollama falló con código {response.status_code}. ¿Seguro que descargaste el modelo {self.model_name}?"
        except requests.exceptions.RequestException as e:
            return f"[Modo Degradado] Error fatal: No logré ver tu servidor local de Ollama. Asegúrate que la aplicación de Ollama (con el ícono del Llama) está abierta ejecutándose en tu PC en Windows."
