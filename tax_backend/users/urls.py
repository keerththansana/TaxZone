from django.urls import path # type: ignore
from rest_framework_simplejwt.views import TokenRefreshView # type: ignore
from .views import LoginView,  GoogleLoginView, SigninView

urlpatterns = [
    path('login/', LoginView.as_view(), name='login'),
    path('login/google/', GoogleLoginView.as_view(), name='google-login'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token-refresh'),
    path('signin/', SigninView.as_view(), name='signin'), # type: ignore
] 
