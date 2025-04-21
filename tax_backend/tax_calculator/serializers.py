# tax_calculator/serializers.py

from rest_framework import serializers # type: ignore
from .models import TaxCalculation

class TaxCalculationSerializer(serializers.ModelSerializer):
    class Meta:
        model = TaxCalculation
        fields = ['tax_type', 'period', 'gross_income_input']

    def validate_gross_income_input(self, value):
        if value <= 0:
            raise serializers.ValidationError("Amount must be greater than zero")
        return value
