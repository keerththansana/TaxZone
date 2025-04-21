# users/views.py
from rest_framework.views import APIView # type: ignore
from rest_framework.response import Response # type: ignore
from rest_framework import status # type: ignore
from django.contrib.auth import authenticate # type: ignore
from django.contrib.auth.models import User # type: ignore
from django.db import IntegrityError # type: ignore
from rest_framework_simplejwt.tokens import RefreshToken # type: ignore
from rest_framework.authentication import SessionAuthentication, BasicAuthentication # type: ignore

class SigninView(APIView):
    """
    API endpoint for user registration (sign-up).
    """
    authentication_classes = []
    permission_classes = []

    def post(self, request):
        username = request.data.get('username')
        email = request.data.get('email')
        password = request.data.get('password')
        confirm_password = request.data.get('confirmPassword')

        if not username or not email or not password or not confirm_password:
            return Response(
                {"error": "Username, email, password, and confirm password are required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if password != confirm_password:
            return Response(
                {"error": "Passwords do not match."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Basic email format validation
        if '@' not in email or '.' not in email:
            return Response(
                {"error": "Invalid email format."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if len(password) < 8:
            return Response(
                {"error": "Password must be at least 8 characters long."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            User.objects.create_user(username=username, email=email, password=password)
            return Response(
                {"message": "Registration successful!"},
                status=status.HTTP_201_CREATED
            )
        except IntegrityError as e:
            if 'unique constraint' in str(e).lower():
                if 'username' in str(e).lower():
                    return Response(
                        {"error": "Username already exists."},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                elif 'email' in str(e).lower():
                    return Response(
                        {"error": "Email address already exists."},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            return Response(
                {"error": f"Registration failed due to a database error: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        except Exception as e:
            return Response(
                {"error": f"Registration failed: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

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
            return Response(
                {"error": "Please provide both username and password."},
                status=status.HTTP_400_BAD_REQUEST
            )

        user = authenticate(request, username=username, password=password)

        if user is not None:
            refresh = RefreshToken.for_user(user)
            access_token = str(refresh.access_token)
            return Response(
                {"access": access_token, "refresh": str(refresh)},
                status=status.HTTP_200_OK
            )
        else:
            return Response(
                {"error": "Invalid login credentials."},
                status=status.HTTP_401_UNAUTHORIZED
            )

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