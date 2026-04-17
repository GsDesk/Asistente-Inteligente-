from rest_framework.decorators import api_view, parser_classes
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.response import Response
from rest_framework import viewsets
from .services import AriaTutorService
from .models import Task
from .serializers import TaskSerializer
import io

aria_service = AriaTutorService()

class TaskViewSet(viewsets.ModelViewSet):
    queryset = Task.objects.all().order_by('date', 'time')
    serializer_class = TaskSerializer

def extract_text_from_file(uploaded_file):
    """Extrae texto de .txt, .md o .pdf"""
    filename = uploaded_file.name.lower()
    content = uploaded_file.read()

    if filename.endswith('.pdf'):
        try:
            import PyPDF2
            reader = PyPDF2.PdfReader(io.BytesIO(content))
            text = ""
            for page in reader.pages:
                text += page.extract_text() or ""
            return text[:6000]  # Limitar para no saturar contexto de Ollama
        except Exception as e:
            return f"[No pude leer el PDF: {e}]"
    else:
        # .txt, .md u otros archivos de texto plano
        try:
            return content.decode('utf-8', errors='ignore')[:6000]
        except:
            return "[No pude leer el archivo]"


@api_view(['POST'])
@parser_classes([MultiPartParser, FormParser, JSONParser])
def chat_with_aria(request):
    # Mensaje de texto del usuario
    user_message = request.data.get('message', '').strip()
    
    # Archivo adjunto (opcional)
    uploaded_file = request.FILES.get('file')
    
    file_context = ""
    if uploaded_file:
        file_text = extract_text_from_file(uploaded_file)
        file_context = f"\n\n[El usuario adjuntó el archivo '{uploaded_file.name}'. Contenido extraído:]\n{file_text}"
    
    if not user_message and not uploaded_file:
        return Response({"error": "No message or file provided"}, status=400)

    # Si solo hay archivo sin mensaje, pedir a ARIA que lo analice
    if not user_message and uploaded_file:
        user_message = f"Analiza y resúmeme el contenido del documento adjunto."

    response_text = aria_service.generate_chat_response(
        user_message=user_message,
        file_context=file_context
    )

    return Response({"response": response_text})
