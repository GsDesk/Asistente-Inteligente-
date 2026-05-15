from django.db import models
from django.contrib.auth.models import User


class Task(models.Model):
    PRIORITY_CHOICES = [
        ('alta', 'Alta'),
        ('media', 'Media'),
        ('baja', 'Baja'),
    ]

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='tasks',
        null=True,
        blank=True
    )
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    date = models.DateField()
    time = models.TimeField()
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='media')
    category = models.CharField(max_length=50, default='otro')
    completed = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.title} ({self.date} {self.time})"

class EvaluationLog(models.Model):
    user = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        related_name='evaluations',
        null=True,
        blank=True
    )
    topic = models.CharField(max_length=255)
    is_document = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        type_str = "Doc" if self.is_document else "Tema"
        username = self.user.username if self.user else "Anónimo"
        return f"[{type_str}] {self.topic[:30]} - {username}"
