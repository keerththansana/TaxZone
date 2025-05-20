from django.db import models # type: ignore
from django.contrib.auth.models import User # type: ignore
import uuid
from django.utils import timezone # type: ignore

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

class TaxFormDocument(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    session_id = models.CharField(max_length=100, db_index=True)
    file = models.FileField(upload_to='tax_form_docs/')
    original_filename = models.CharField(max_length=255)
    content_text = models.TextField(null=True, blank=True)
    extracted_data = models.JSONField(null=True, blank=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    is_processed = models.BooleanField(default=False)
    form_progress = models.CharField(max_length=50, default='uploaded')  # track progress state

    class Meta:
        db_table = 'tax_report_documents'
        ordering = ['-uploaded_at']
