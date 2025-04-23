# tax_calculator/serializers.py

from rest_framework import serializers # type: ignore
from .models import TaxDocument

class TaxCalculationSerializer(serializers.Serializer):
    taxType = serializers.CharField(max_length=50)
    period = serializers.CharField(max_length=50)
    amount = serializers.DecimalField(max_digits=12, decimal_places=2)
    businessType = serializers.CharField(max_length=50, required=False)
    foreignType = serializers.CharField(max_length=50, required=False)

    def validate_amount(self, value):
        if value <= 0:
            raise serializers.ValidationError("Amount must be greater than zero")
        return value

class TaxDocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = TaxDocument
        fields = ['id', 'title', 'file', 'content', 'uploaded_at']
        read_only_fields = ['content', 'uploaded_at']
