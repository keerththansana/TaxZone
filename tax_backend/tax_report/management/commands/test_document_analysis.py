from django.core.management.base import BaseCommand
from tax_report.services.document_processor import DocumentProcessor
import asyncio
import os
import json

class Command(BaseCommand):
    help = 'Test document analysis with a sample file'

    def add_arguments(self, parser):
        parser.add_argument('file_path', type=str, help='Path to the document file to analyze')

    def handle(self, *args, **options):
        file_path = options['file_path']
        
        if not os.path.exists(file_path):
            self.stderr.write(self.style.ERROR(f'File not found: {file_path}'))
            return

        processor = DocumentProcessor()
        
        try:
            # Extract text
            self.stdout.write('Extracting text from document...')
            extracted_text = processor.extract_text_from_document(file_path)
            self.stdout.write(self.style.SUCCESS('Text extracted successfully'))
            self.stdout.write('\nExtracted text:')
            self.stdout.write('-' * 80)
            self.stdout.write(extracted_text[:500] + '...' if len(extracted_text) > 500 else extracted_text)
            self.stdout.write('-' * 80)

            # Analyze text
            self.stdout.write('\nAnalyzing document...')
            analysis_result = processor.analyze_document(extracted_text)
            
            try:
                # Parse and format JSON
                parsed_json = json.loads(analysis_result)
                formatted_result = json.dumps(parsed_json, indent=2)
                self.stdout.write(self.style.SUCCESS('Analysis complete'))
                self.stdout.write('\nAnalysis result:')
                self.stdout.write('-' * 80)
                self.stdout.write(formatted_result)
                self.stdout.write('-' * 80)
            except json.JSONDecodeError as je:
                self.stderr.write(self.style.ERROR(f'JSON parsing error: {str(je)}'))
                self.stdout.write('\nRaw output:')
                self.stdout.write(analysis_result)

        except Exception as e:
            self.stderr.write(self.style.ERROR(f'Error: {str(e)}'))