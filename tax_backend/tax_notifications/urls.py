from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'deadlines', views.TaxDeadlineViewSet)
router.register(r'preferences', views.UserNotificationPreferenceViewSet, basename='preferences')
router.register(r'notifications', views.NotificationHistoryViewSet, basename='notifications')

urlpatterns = [
    path('api/', include(router.urls)),
    path('api/calendar-data/', views.calendar_data, name='calendar_data'),
    path('api/available-years/', views.available_years, name='available_years'),
] 