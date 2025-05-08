from django.urls import path
from .views import SigninView, LoginView
from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [
    path('signin/', SigninView.as_view(), name='signin'),
    path('login/', LoginView.as_view(), name='login'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]
