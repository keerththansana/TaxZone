from django.urls import path
from .views import SigninView, LoginView, ResetPasswordView, ResetPasswordConfirmView, ResetPasswordValidateView, TokenValidationView, GoogleLoginView
from rest_framework_simplejwt.views import TokenRefreshView
from . import views
from .views import ContactView

urlpatterns = [
    path('signin/', views.signin, name='signin'),
    path('login/', LoginView.as_view(), name='login'),
    path('google-login/', GoogleLoginView.as_view(), name='google_login'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('validate-token/', TokenValidationView.as_view(), name='validate_token'),
    path('reset-password/', ResetPasswordView.as_view(), name='reset_password'),
    path('reset-password/validate/<str:token>/', ResetPasswordValidateView.as_view(), name='reset_password_validate'),
    path('reset-password/confirm/', ResetPasswordConfirmView.as_view(), name='reset_password_confirm'),
    path('contact/', ContactView.as_view(), name='contact'),
]
