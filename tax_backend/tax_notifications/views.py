from django.shortcuts import render
from rest_framework import viewsets, status
from rest_framework.decorators import api_view, action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.db.models import Q
from datetime import datetime
from .models import TaxDeadline, UserNotificationPreference, NotificationHistory
from .serializers import (
    TaxDeadlineSerializer, 
    UserNotificationPreferenceSerializer, 
    NotificationHistorySerializer,
    NotificationHistoryListSerializer
)

class TaxDeadlineViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing tax deadlines
    """
    queryset = TaxDeadline.objects.filter(is_active=True).order_by('deadline_date')
    serializer_class = TaxDeadlineSerializer
    permission_classes = [AllowAny]  # Allow public access for calendar data
    
    def get_queryset(self):
        queryset = TaxDeadline.objects.filter(is_active=True)
        
        # Filter by year assessment if provided
        year_assessment = self.request.query_params.get('year_assessment', None)
        if year_assessment:
            queryset = queryset.filter(year_assessment=year_assessment)
        
        # Filter by deadline type if provided
        deadline_type = self.request.query_params.get('deadline_type', None)
        if deadline_type:
            queryset = queryset.filter(deadline_type=deadline_type)
        
        return queryset.order_by('deadline_date')

@api_view(['GET'])
def calendar_data(request):
    """
    API endpoint to get formatted calendar data for the frontend
    """
    try:
        year_assessment = request.GET.get('year_assessment', '2024/2025')
        
        # Get all deadlines for the specified year
        deadlines = TaxDeadline.objects.filter(
            year_assessment=year_assessment,
            is_active=True
        ).order_by('deadline_date')
        
        # Group by deadline type
        monthly_deadlines = deadlines.filter(deadline_type='monthly')
        quarterly_deadlines = deadlines.filter(deadline_type='quarterly')
        yearly_deadlines = deadlines.filter(deadline_type='yearly')
        
        # Format data for frontend
        calendar_data = {
            'year_assessment': year_assessment,
            'monthly': {
                'deadlines': TaxDeadlineSerializer(monthly_deadlines, many=True).data,
                'summary': f"APIT & AIT/WHT Payments - {year_assessment}"
            },
            'quarterly': {
                'deadlines': TaxDeadlineSerializer(quarterly_deadlines, many=True).data,
                'summary': f"Self-Assessment Tax Instalments - {year_assessment}"
            },
            'yearly': {
                'deadlines': TaxDeadlineSerializer(yearly_deadlines, many=True).data,
                'summary': f"Annual Obligations - {year_assessment}"
            }
        }
        
        return Response({
            'success': True,
            'data': calendar_data
        })
        
    except Exception as e:
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
def available_years(request):
    """
    API endpoint to get available assessment years
    """
    try:
        years = TaxDeadline.objects.filter(
            is_active=True
        ).values_list('year_assessment', flat=True).distinct().order_by('year_assessment')
        
        return Response({
            'success': True,
            'years': list(years)
        })
        
    except Exception as e:
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class UserNotificationPreferenceViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing user notification preferences
    """
    serializer_class = UserNotificationPreferenceSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return UserNotificationPreference.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class NotificationHistoryViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for viewing notification history
    """
    serializer_class = NotificationHistoryListSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return NotificationHistory.objects.filter(user=self.request.user)
    
    @action(detail=True, methods=['post'])
    def mark_as_read(self, request, pk=None):
        notification = self.get_object()
        notification.mark_as_read()
        return Response({'success': True})
