from django.contrib import admin
from .models import Task, EvaluationLog

@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = ('title', 'user', 'date', 'time', 'priority', 'category', 'completed', 'created_at')
    list_filter = ('completed', 'priority', 'category', 'date')
    search_fields = ('title', 'description', 'user__username')
    ordering = ('-created_at',)
    readonly_fields = ('created_at',)

@admin.register(EvaluationLog)
class EvaluationLogAdmin(admin.ModelAdmin):
    list_display = ('topic', 'user', 'is_document', 'created_at')
    list_filter = ('is_document', 'created_at')
    search_fields = ('topic', 'user__username')
    ordering = ('-created_at',)
    readonly_fields = ('created_at',)
