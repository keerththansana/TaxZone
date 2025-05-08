# users/views.py
from rest_framework.views import APIView # type: ignore
from rest_framework.response import Response # type: ignore
from rest_framework import status # type: ignore
from django.contrib.auth import authenticate # type: ignore
from django.contrib.auth.models import User # type: ignore
from django.db import IntegrityError # type: ignore
from rest_framework_simplejwt.tokens import RefreshToken # type: ignore
from rest_framework.authentication import SessionAuthentication, BasicAuthentication # type: ignore
from .serializers import UserSerializer

class SigninView(APIView):
    """
    API endpoint for user registration (sign-up).
    """
    authentication_classes = []
    permission_classes = []

    def post(self, request):
        serializer = UserSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            return Response({
                'message': 'Registration successful!'
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class LoginView(APIView):
    """
    API endpoint for user login.
    Users must have signed up before they can log in.
    """
    authentication_classes = []
    permission_classes = []

    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        
        if not username or not password:
            return Response({
                'error': 'Please provide both username and password'
            }, status=status.HTTP_400_BAD_REQUEST)
            
        user = authenticate(username=username, password=password)
        
        if user:
            refresh = RefreshToken.for_user(user)
            return Response({
                'access': str(refresh.access_token),
                'refresh': str(refresh)
            })
        
        return Response({
            'error': 'Invalid credentials'
        }, status=status.HTTP_401_UNAUTHORIZED)

class GoogleLoginView(APIView):
    """
    API endpoint for Google login.
    Expects 'email' and 'google_id' in the request data.
    This assumes the user has already signed up (their information exists in your database
    and is linked with their Google account).
    """
    def post(self, request):
        email = request.data.get('email')
        google_id = request.data.get('google_id')
        given_name = request.data.get('given_name') # You might want to use this during initial Google signup
        picture = request.data.get('picture')     # You might want to use this during initial Google signup

        if not email or not google_id:
            return Response(
                {"error": "Email and Google ID are required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            user = User.objects.get(email=email, social_auth__provider='google', social_auth__uid=google_id)
        except User.DoesNotExist:
            # Consider handling the case where a user logs in with Google for the first time
            # You might want to create a new user account linked to their Google ID.
            # This would involve a different flow and potentially a separate endpoint.
            return Response(
                {"error": "No user found with this Google account. Please sign up first."},
                status=status.HTTP_404_NOT_FOUND
            )

        refresh = RefreshToken.for_user(user)
        access_token = str(refresh.access_token)
        return Response(
            {"access": access_token, "refresh": str(refresh)},
            status=status.HTTP_200_OK
        )