from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TaxReportViewSet

router = DefaultRouter()
router.register(r'reports', TaxReportViewSet, basename='taxreport')

urlpatterns = [
    path('', include(router.urls)),
]