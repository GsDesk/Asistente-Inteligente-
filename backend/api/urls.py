from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'tasks', views.TaskViewSet)

urlpatterns = [
    path('chat/', views.chat_with_aria, name='api_chat'),
    path('', include(router.urls)),
]
