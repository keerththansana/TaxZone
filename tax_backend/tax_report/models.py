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

class ExtractedContext(models.Model):
    document = models.ForeignKey(TaxFormDocument, on_delete=models.CASCADE, related_name='contexts')
    context_type = models.CharField(max_length=50)  # e.g., 'income', 'deduction', 'tax'
    original_text = models.TextField()
    extracted_value = models.DecimalField(max_digits=12, decimal_places=2)
    confidence_score = models.FloatField(default=0.0)
    created_at = models.DateTimeField(auto_now_add=True)

class FormFieldMapping(models.Model):
    context = models.ForeignKey(ExtractedContext, on_delete=models.CASCADE, related_name='mappings')
    form_type = models.CharField(max_length=50)  # e.g., 'EmploymentIncome', 'BusinessIncome'
    field_name = models.CharField(max_length=100)
    field_path = models.CharField(max_length=255)  # JSON path to the field
    confidence_score = models.FloatField(default=0.0)
    created_at = models.DateTimeField(auto_now_add=True)

class DownloadedReports(models.Model):
    user_id = models.IntegerField(null=True, blank=True)  # Keep existing user_id field
    username = models.CharField(max_length=150, null=True, blank=True)  # Add username field as nullable
    email = models.EmailField(null=True, blank=True)  # Make email nullable
    document = models.FileField(upload_to='downloaded_docs/', null=True, blank=True)  # stores the document file
    downloaded_at = models.DateTimeField(default=timezone.now)  # date and time of download

    class Meta:
        db_table = 'downloaded_reports'
        ordering = ['-downloaded_at']

    def __str__(self):
        return f"{self.username or 'Unknown'} - {self.email or 'No email'} - {self.downloaded_at}"
