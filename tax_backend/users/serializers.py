from rest_framework import serializers
from django.contrib.auth import get_user_model
User = get_user_model()
from .models import AuthNewUser
from .models import ContactUser
from .models import TaxReview


class UserSerializer(serializers.ModelSerializer):
    password2 = serializers.CharField(write_only=True)
    
    class Meta:
        model = User
        fields = ('username', 'email', 'password', 'password2')
        extra_kwargs = {
            'password': {'write_only': True},
            'email': {'required': True}
        }

    def validate(self, data):
        if data['password'] != data['password2']:
            raise serializers.ValidationError("Passwords don't match.")
        if User.objects.filter(email=data['email']).exists():
            raise serializers.ValidationError("Email already exists.")
        return data

    def create(self, validated_data):
        validated_data.pop('password2')
        user = User.objects.create_user(**validated_data)
        return user

class LoginSerializer(serializers.Serializer):
    username = serializers.CharField(required=True)
    password = serializers.CharField(required=True, write_only=True)

    def validate(self, attrs):
        if not attrs.get('username') or not attrs.get('password'):
            raise serializers.ValidationError('Both username and password are required')
        return attrs

class AuthNewUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = AuthNewUser
        fields = ['username', 'email', 'password', 'created_at', 'updated_at']
        extra_kwargs = {
            'password': {'write_only': True},
            'created_at': {'read_only': True},
            'updated_at': {'read_only': True}
        }
# Add to users/serializers.py
class ContactSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContactUser
        fields = ['name', 'email', 'phone', 'message']

class TaxReviewSerializer(serializers.ModelSerializer):
    class Meta:
        model = TaxReview
        fields = '__all__'