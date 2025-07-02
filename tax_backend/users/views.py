# users/views.py
from rest_framework.views import APIView # type: ignore
from rest_framework.response import Response # type: ignore
from rest_framework import status # type: ignore
from django.contrib.auth import authenticate # type: ignore
from django.contrib.auth.models import User # type: ignore
from django.db import IntegrityError # type: ignore
from rest_framework_simplejwt.tokens import RefreshToken # type: ignore
from rest_framework.authentication import SessionAuthentication, BasicAuthentication # type: ignore
from .serializers import UserSerializer, AuthNewUserSerializer
from django.contrib.auth import get_user_model
from django.contrib.auth.hashers import make_password
from .models import AuthNewUser, ResetPassword, TaxReview
from rest_framework.decorators import api_view
from django.core.mail import send_mail
from django.conf import settings
import secrets
from django.utils.http import urlsafe_base64_decode
from django.utils.encoding import force_str
from django.contrib.auth.tokens import default_token_generator
from .serializers import ContactSerializer, TaxReviewSerializer
from .models import ContactUser
from rest_framework import generics
from rest_framework.generics import ListAPIView

User = get_user_model()

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
        try:
            username = request.data.get('username')
            password = request.data.get('password')

            if not username or not password:
                return Response({
                    'status': 'error',
                    'message': 'Username and password are required'
                }, status=status.HTTP_400_BAD_REQUEST)

            # Print for debugging (remove in production)
            print(f"Login attempt for username: {username}")

            # First try exact username match
            user = authenticate(username=username, password=password)

            # If username authentication fails, try email
            if not user:
                try:
                    user_obj = User.objects.filter(email=username).first()
                    if user_obj:
                        user = authenticate(username=user_obj.username, password=password)
                        if not user:
                            print(f"Authentication failed for email: {username}")
                    else:
                        print(f"No user found with email: {username}")
                except User.DoesNotExist:
                    print(f"User.DoesNotExist exception for email: {username}")
                    pass

            if user:
                refresh = RefreshToken.for_user(user)
                return Response({
                    'status': 'success',
                    'tokens': {
                        'access': str(refresh.access_token),
                        'refresh': str(refresh)
                    },
                    'user': {
                        'username': user.username,
                        'email': user.email
                    }
                })

            return Response({
                'status': 'error',
                'message': 'Invalid username or password'
            }, status=status.HTTP_401_UNAUTHORIZED)

        except Exception as e:
            print(f"Login error: {str(e)}")  # For debugging
            return Response({
                'status': 'error',
                'message': f'Login failed: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class GoogleLoginView(APIView):
    def post(self, request):
        email = request.data.get('email')
        given_name = request.data.get('given_name', '')
        google_id = request.data.get('google_id', '')
        picture = request.data.get('picture', '')

        if not email:
            return Response({"error": "Email is required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            # Create a new user if not exists (like normal signup)
            username = email.split('@')[0]
            user = User.objects.create(
                username=username,
                email=email,
                first_name=given_name,
                password=make_password(User.objects.make_random_password())
            )
            # Optionally, create an AuthNewUser entry if you use that for normal signup
            AuthNewUser.objects.create(
                user=user,
                username=username,
                email=email,
                password=user.password  # Already hashed
            )

        refresh = RefreshToken.for_user(user)
        return Response({
            "access": str(refresh.access_token),
            "refresh": str(refresh),
            "user": {
                "id": user.id,
                "email": user.email,
                "username": user.username,
                "name": user.first_name,
                "picture": picture,
            }
        }, status=status.HTTP_200_OK)

@api_view(['POST'])
def signin(request):
    if request.method == 'POST':
        username = request.data.get('username')
        email = request.data.get('email')
        password = request.data.get('password')
        password2 = request.data.get('password2')

        if not all([username, email, password, password2]):
            return Response({'error': 'All fields are required'}, status=status.HTTP_400_BAD_REQUEST)

        if password != password2:
            return Response({'error': 'Passwords do not match'}, status=status.HTTP_400_BAD_REQUEST)

        if User.objects.filter(username=username).exists():
            return Response({'error': 'Username already exists'}, status=status.HTTP_400_BAD_REQUEST)

        if User.objects.filter(email=email).exists():
            return Response({'error': 'Email already exists'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            # Create Django User
            user = User.objects.create(
                username=username,
                email=email,
                password=make_password(password)
            )

            # Create AuthNewUser entry
            auth_new_user = AuthNewUser.objects.create(
                user=user,
                username=username,
                email=email,
                password=make_password(password)
            )

            return Response({
                'message': 'Registration successful',
                'user': {
                    'username': username,
                    'email': email
                }
            }, status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class ResetPasswordView(APIView):
    """
    API endpoint for initiating password reset.
    Sends a reset link to the user's email.
    """
    authentication_classes = []
    permission_classes = []

    def post(self, request):
        email = request.data.get('email')
        
        if not email:
            return Response({
                'message': 'Email is required'
            }, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.get(email=email)
            # Generate a reset token
            reset_token = secrets.token_urlsafe(32)
            
            # Store the token in the user's session or a separate model
            # For now, we'll just send a success message
            # In production, you should store this token and verify it when resetting
            
            # Send email
            reset_link = f'http://localhost:3000/new-password/{reset_token}?email={email}'
            email_subject = 'Password Reset Request'
            email_message = f'''
            Hello {user.username},

            You have requested to reset your password. Please click the link below to reset your password:

            {reset_link}

            If you did not request this password reset, please ignore this email.

            Best regards,
            Tax.X Team
            '''
            
            send_mail(
                email_subject,
                email_message,
                settings.DEFAULT_FROM_EMAIL,
                [email],
                fail_silently=False,
            )
            
            return Response({
                'message': 'If your email is registered, you will receive a password reset link.'
            }, status=status.HTTP_200_OK)
            
        except User.DoesNotExist:
            # Return success even if user doesn't exist for security
            return Response({
                'message': 'If your email is registered, you will receive a password reset link.'
            }, status=status.HTTP_200_OK)
        except Exception as e:
            print(f"Password reset error: {str(e)}")  # For debugging
            return Response({
                'message': 'An error occurred while processing your request.'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class ResetPasswordValidateView(APIView):
    """
    API endpoint for validating reset password token.
    """
    authentication_classes = []
    permission_classes = []

    def get(self, request, token):
        try:
            # In a real application, you would verify the token here
            # For now, we'll just return success
            # You should store the email with the token in a real application
            return Response({
                'valid': True,
                'message': 'Token is valid',
                'email': request.query_params.get('email', '')  # Get email from query params
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({
                'valid': False,
                'message': 'Invalid or expired token'
            }, status=status.HTTP_400_BAD_REQUEST)

class ResetPasswordConfirmView(APIView):
    """
    API endpoint for confirming password reset.
    """
    authentication_classes = []
    permission_classes = []

    def post(self, request):
        token = request.data.get('token')
        new_password = request.data.get('new_password')
        email = request.data.get('email')

        if not all([token, new_password, email]):
            return Response({
                'message': 'Missing required fields'
            }, status=status.HTTP_400_BAD_REQUEST)

        try:
            # Find user by email
            user = User.objects.get(email=email)
            
            # Update user's password
            user.set_password(new_password)
            user.save()

            # Store reset password information with the actual new password
            ResetPassword.objects.create(
                email=email,
                new_password=new_password  # Store the actual new password
            )

            return Response({
                'message': 'Password has been reset successfully'
            }, status=status.HTTP_200_OK)

        except User.DoesNotExist:
            return Response({
                'message': 'User not found'
            }, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            print(f"Password reset error: {str(e)}")  # For debugging
            return Response({
                'message': 'An error occurred while resetting your password'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# Add to users/views.py
class ContactView(APIView):
    """
    API endpoint for contact form submissions.
    """
    authentication_classes = []
    permission_classes = []

    def post(self, request):
        serializer = ContactSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({
                'message': 'Thank you for your message. We will get back to you soon!'
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class TokenValidationView(APIView):
    """
    API endpoint for validating JWT tokens.
    """
    authentication_classes = []
    permission_classes = []

    def get(self, request):
        try:
            # Get the Authorization header
            auth_header = request.headers.get('Authorization')
            if not auth_header or not auth_header.startswith('Bearer '):
                return Response({
                    'valid': False,
                    'message': 'No valid authorization header'
                }, status=status.HTTP_401_UNAUTHORIZED)

            # Extract the token
            token = auth_header.split(' ')[1]
            
            # Validate the token using JWT
            from rest_framework_simplejwt.tokens import AccessToken
            from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
            
            try:
                # This will raise an exception if the token is invalid
                AccessToken(token)
                return Response({
                    'valid': True,
                    'message': 'Token is valid'
                }, status=status.HTTP_200_OK)
            except (InvalidToken, TokenError) as e:
                return Response({
                    'valid': False,
                    'message': 'Token is invalid or expired'
                }, status=status.HTTP_401_UNAUTHORIZED)
                
        except Exception as e:
            return Response({
                'valid': False,
                'message': 'Error validating token'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class TaxReviewCreateUpdateView(generics.CreateAPIView, generics.UpdateAPIView):
    queryset = TaxReview.objects.all()
    serializer_class = TaxReviewSerializer
    lookup_field = 'name'  # or use user if you want to link to user

class TaxReviewListView(ListAPIView):
    queryset = TaxReview.objects.all()
    serializer_class = TaxReviewSerializer