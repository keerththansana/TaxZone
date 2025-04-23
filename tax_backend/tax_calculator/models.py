from django.db import models # type: ignore
from decimal import Decimal, ROUND_HALF_UP
import math
from datetime import date

class IncomeType(models.Model):
    type_code = models.CharField(max_length=20, unique=True)
    type_name = models.CharField(max_length=100)
    has_period = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'income_types'

    def __str__(self):
        return self.type_name

class TaxPeriod(models.Model):
    period_code = models.CharField(max_length=20, unique=True)
    period_name = models.CharField(max_length=50)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'tax_periods'

    def __str__(self):
        return self.period_name

class TaxRate(models.Model):

    tax_type = models.CharField(max_length=20)
    period_type = models.CharField(max_length=10)
    bracket_order = models.IntegerField()
    rate = models.DecimalField(max_digits=5, decimal_places=2)
    bracket_limit = models.DecimalField(max_digits=12, decimal_places=2)
    relief_amount = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    effective_from = models.DateField(auto_now_add=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = 'tax_rates'
        managed = True

class TaxDocument(models.Model):
    title = models.CharField(max_length=255, null=True, blank=True)
    file = models.FileField(upload_to='tax_documents/')
    content = models.TextField(null=True, blank=True, default='')  # Make content nullable with empty default
    uploaded_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return self.title or f"Document {self.id}"

    def save(self, *args, **kwargs):
        if not self.title and self.file:
            self.title = self.file.name.split('/')[-1]
        if not self.content:
            self.content = ''
        super().save(*args, **kwargs)

    class Meta:
        db_table = 'tax_calculator_taxdocument'
        ordering = ['-uploaded_at']