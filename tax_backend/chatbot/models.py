from django.db import models

class TaxDocument(models.Model):
    title = models.CharField(max_length=255, null=True, blank=True)
    pdf_file = models.TextField(null=True, blank=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'tax_documents'
        managed = False

    def __str__(self):
        return self.title or f"Document {self.id}"