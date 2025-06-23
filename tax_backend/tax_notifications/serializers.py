from rest_framework import serializers
from .models import TaxDeadline, UserNotificationPreference, NotificationHistory
from django.contrib.auth.models import User

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name']

class TaxDeadlineSerializer(serializers.ModelSerializer):
    is_overdue = serializers.ReadOnlyField()
    days_until_deadline = serializers.ReadOnlyField()
    
    class Meta:
        model = TaxDeadline
        fields = '__all__'

class UserNotificationPreferenceSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = UserNotificationPreference
        fields = '__all__'
        read_only_fields = ['user', 'created_at', 'updated_at']

class NotificationHistorySerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    deadline = TaxDeadlineSerializer(read_only=True)
    
    class Meta:
        model = NotificationHistory
        fields = '__all__'
        read_only_fields = ['user', 'sent_at', 'read_at']

class NotificationHistoryListSerializer(serializers.ModelSerializer):
    deadline = TaxDeadlineSerializer(read_only=True)
    
    class Meta:
        model = NotificationHistory
        fields = ['id', 'deadline', 'notification_type', 'title', 'message', 'is_read', 'sent_at'] 