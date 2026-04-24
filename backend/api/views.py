from rest_framework.decorators import api_view, parser_classes, permission_classes
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.response import Response
from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.tokens import RefreshToken

from .services import AriaTutorService
from .models import Task
from .serializers import TaskSerializer, RegisterSerializer, UserSerializer
import io

aria_service = AriaTutorService()


# ─── Tareas (privadas por usuario) ────────────────────────────────────────────
class TaskViewSet(viewsets.ModelViewSet):
    serializer_class   = TaskSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Task.objects.filter(user=self.request.user).order_by('date', 'time')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


# ─── Utilidad: extraer texto de archivos ──────────────────────────────────────
def extract_text_from_file(uploaded_file):
    """Extrae texto de .txt, .md o .pdf"""
    filename = uploaded_file.name.lower()
    content  = uploaded_file.read()

    if filename.endswith('.pdf'):
        try:
            import PyPDF2
            reader = PyPDF2.PdfReader(io.BytesIO(content))
            text = ""
            for page in reader.pages:
                text += page.extract_text() or ""
            return text[:6000]
        except Exception as e:
            return f"[No pude leer el PDF: {e}]"
    else:
        try:
            return content.decode('utf-8', errors='ignore')[:6000]
        except:
            return "[No pude leer el archivo]"


# ─── Chat con ARIA ────────────────────────────────────────────────────────────
@api_view(['POST'])
@parser_classes([MultiPartParser, FormParser, JSONParser])
@permission_classes([IsAuthenticated])
def chat_with_aria(request):
    user_message  = request.data.get('message', '').strip()
    uploaded_file = request.FILES.get('file')

    file_context = ""
    if uploaded_file:
        file_text    = extract_text_from_file(uploaded_file)
        file_context = f"\n\n[El usuario adjunto el archivo '{uploaded_file.name}'. Contenido extraido:]\n{file_text}"

    if not user_message and not uploaded_file:
        return Response({"error": "No message or file provided"}, status=400)

    if not user_message and uploaded_file:
        user_message = "Analiza y resumeme el contenido del documento adjunto."

    response_text = aria_service.generate_chat_response(
        user_message=user_message,
        file_context=file_context,
        user=request.user
    )

    return Response({"response": response_text})


# ─── Auth: Registro ───────────────────────────────────────────────────────────
@api_view(['POST'])
@permission_classes([AllowAny])
def register_user(request):
    serializer = RegisterSerializer(data=request.data)
    if serializer.is_valid():
        user    = serializer.save()
        refresh = RefreshToken.for_user(user)
        return Response({
            'access':  str(refresh.access_token),
            'refresh': str(refresh),
            'user':    UserSerializer(user).data
        }, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ─── Auth: Datos del usuario actual ───────────────────────────────────────────
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def me(request):
    return Response(UserSerializer(request.user).data)


# ─── Evaluaciones ─────────────────────────────────────────────────────────────
@api_view(['POST'])
@parser_classes([MultiPartParser, FormParser, JSONParser])
@permission_classes([IsAuthenticated])
def generate_evaluation_view(request):
    try:
        topic = request.data.get('topic', '').strip()
        uploaded_file = request.FILES.get('file')

        # Extraer contenido del documento si se subió
        document_content = ""
        if uploaded_file:
            print(f"[AMY Evaluación] Archivo recibido: {uploaded_file.name} ({uploaded_file.size} bytes)")
            document_content = extract_text_from_file(uploaded_file)
            print(f"[AMY Evaluación] Texto extraído: {len(document_content)} caracteres")

        # Se necesita al menos un tema o un documento
        if not topic and not document_content:
            return Response({"error": "Debes proporcionar un tema o un documento."}, status=400)

        # Si solo hay documento sin tema, usar nombre del archivo como referencia
        if not topic and document_content:
            topic = f"Contenido del documento: {uploaded_file.name}"

        result = aria_service.generate_evaluation(
            topic=topic,
            user=request.user,
            document_content=document_content
        )
        
        if "error" in result:
            return Response(result, status=500)
            
        return Response(result)
    
    except Exception as e:
        print(f"[AMY Evaluación] Error inesperado: {e}")
        import traceback
        traceback.print_exc()
        return Response({"error": f"Error interno: {str(e)}"}, status=500)

