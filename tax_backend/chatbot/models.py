from django.db import models # type: ignore
import PyPDF2 # type: ignore
import logging

logger = logging.getLogger(__name__)

class TaxDocument(models.Model):
    title = models.CharField(max_length=255, null=True, blank=True)
    pdf_file = models.TextField(null=True, blank=True)  # Match existing column name
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'tax_documents'
        managed = False

    def __str__(self):
        return self.title or f"Document {self.id}"