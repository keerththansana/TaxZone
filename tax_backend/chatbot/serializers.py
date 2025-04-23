from rest_framework import serializers # type: ignore
from .models import TaxDocument

class TaxDocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = TaxDocument
        fields = ['id', 'title', 'file', 'content', 'uploaded_at']
        read_only_fields = ['content', 'uploaded_at']