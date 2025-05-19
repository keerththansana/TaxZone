from django.db import models
from django.contrib.auth.models import User

class TaxReport(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    tax_year = models.CharField(max_length=9)  # Format: 2024/2025
    created_at = models.DateTimeField(auto_now_add=True)
    assessable_income = models.DecimalField(max_digits=12, decimal_places=2)
    taxable_income = models.DecimalField(max_digits=12, decimal_places=2)
    total_tax_payable = models.DecimalField(max_digits=12, decimal_places=2)

class IncomeCategory(models.Model):
    tax_report = models.ForeignKey(TaxReport, on_delete=models.CASCADE, related_name='categories')
    category_type = models.CharField(max_length=50)
    total_amount = models.DecimalField(max_digits=12, decimal_places=2)

class IncomeEntry(models.Model):
    category = models.ForeignKey(IncomeCategory, on_delete=models.CASCADE, related_name='entries')
    name = models.CharField(max_length=255)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    description = models.TextField(null=True, blank=True)

class TaxDeduction(models.Model):
    tax_report = models.ForeignKey(TaxReport, on_delete=models.CASCADE, related_name='deductions')
    deduction_type = models.CharField(max_length=20)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
