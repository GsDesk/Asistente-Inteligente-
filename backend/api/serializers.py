from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Task


class TaskSerializer(serializers.ModelSerializer):
    class Meta:
        model = Task
        fields = '__all__'
        read_only_fields = ['user', 'created_at']


class RegisterSerializer(serializers.ModelSerializer):
    password  = serializers.CharField(write_only=True, min_length=6)
    password2 = serializers.CharField(write_only=True, label='Confirmar contrasena')
    full_name = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model  = User
        fields = ['username', 'email', 'password', 'password2', 'full_name']

    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError('Este nombre de usuario ya esta en uso.')
        return value

    def validate_email(self, value):
        if value and User.objects.filter(email=value).exists():
            raise serializers.ValidationError('Este email ya esta registrado.')
        return value

    def validate(self, data):
        if data['password'] != data['password2']:
            raise serializers.ValidationError({'password2': 'Las contrasenas no coinciden.'})
        return data

    def create(self, validated_data):
        validated_data.pop('password2')
        full_name = validated_data.pop('full_name', '')
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=validated_data['password'],
        )
        if full_name:
            parts = full_name.split(' ', 1)
            user.first_name = parts[0]
            user.last_name  = parts[1] if len(parts) > 1 else ''
            user.save()
        return user


class UserSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()

    class Meta:
        model  = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'full_name']

    def get_full_name(self, obj):
        name = f"{obj.first_name} {obj.last_name}".strip()
        return name or obj.username
