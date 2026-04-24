from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from . import views

router = DefaultRouter()
router.register(r'tasks', views.TaskViewSet, basename='task')

urlpatterns = [
    # Chat
    path('chat/', views.chat_with_aria, name='api_chat'),

    # Auth
    path('auth/register/', views.register_user,           name='auth_register'),
    path('auth/login/',    TokenObtainPairView.as_view(), name='auth_login'),
    path('auth/refresh/',  TokenRefreshView.as_view(),    name='auth_refresh'),
    path('auth/me/',       views.me,                      name='auth_me'),

    # Evaluaciones
    path('evaluate/',      views.generate_evaluation_view, name='api_evaluate'),

    # Tareas (CRUD)
    path('', include(router.urls)),
]
