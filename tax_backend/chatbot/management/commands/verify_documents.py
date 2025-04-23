from django.core.management.base import BaseCommand # type: ignore
from chatbot.models import TaxDocument

class Command(BaseCommand):
    help = 'Verify and update document content'

    def handle(self, *args, **kwargs):
        documents = TaxDocument.objects.all()
        for doc in documents:
            if not doc.content and doc.file:
                doc.save()  # This will trigger content extraction
                self.stdout.write(self.style.SUCCESS(f'Updated content for {doc.title}'))