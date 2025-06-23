from django.db import models # type: ignore
from django.contrib.auth.models import User
import uuid

class TaxDocument(models.Model):
    title = models.CharField(max_length=255, null=True, blank=True)
    pdf_file = models.TextField(null=True, blank=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'tax_documents'
        managed = False

    def __str__(self):
        return self.title or f"Document {self.id}"

class TaxConversation(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='tax_conversations', null=True, blank=True)
    title = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.title

class TaxMessage(models.Model):
    conversation = models.ForeignKey(TaxConversation, related_name='messages', on_delete=models.CASCADE)
    query = models.TextField()
    response = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']