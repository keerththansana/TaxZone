from django.shortcuts import render
from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from .models import TaxReport
from .serializers import TaxReportSerializer

class TaxReportViewSet(viewsets.ModelViewSet):
    serializer_class = TaxReportSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return TaxReport.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=True, methods=['post'])
    def generate_pdf(self, request, pk=None):
        tax_report = self.get_object()
        # Add PDF generation logic here
        return Response({'status': 'PDF generation initiated'})
