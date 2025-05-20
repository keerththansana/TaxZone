import os
import PyPDF2  # type: ignore
import google.generativeai as genai  # type: ignore
from django.conf import settings  # type: ignore
import logging
from tax_report.models import TaxFormDocument

logger = logging.getLogger(__name__)

class TaxFormDocumentProcessor:
    def __init__(self):
        api_key = os.getenv('GEMINI_API_KEY')
        if not api_key:
            raise ValueError("Gemini API key not found")
        
        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel('gemini-1.5-flash')

    def process_document(self, file, session_id):
        """Process uploaded document and extract relevant tax information"""
        try:
            # Create document record first
            doc = TaxFormDocument.objects.create(
                session_id=session_id,
                file=file,
                original_filename=file.name
            )

            # Reset file pointer
            file.seek(0)

            # Extract text content safely
            text_content = ""
            file_type = "unknown"
            try:
                if file.name.lower().endswith('.pdf'):
                    pdf_reader = PyPDF2.PdfReader(file)
                    for page in pdf_reader.pages:
                        text_content += page.extract_text() + "\n"
                    file_type = "pdf"
                else:
                    file_type = "document"
            except Exception as e:
                logger.error(f"File extraction error: {str(e)}")
                text_content = "Text extraction failed"

            doc.content_text = text_content
            doc.file_type = file_type

            # Analyze content with Gemini
            try:
                extracted_data = self._analyze_content(text_content)
                doc.extracted_data = extracted_data
            except Exception as e:
                logger.error(f"Content analysis error: {str(e)}")
                doc.extracted_data = {"error": "Analysis failed"}

            doc.save()

            return {
                'doc_id': str(doc.id),
                'filename': doc.original_filename,
                'file_type': file_type,
                'file_size': file.size,
                'uploaded_at': doc.uploaded_at.isoformat(),
                'status': 'processed',
                'extracted_data': doc.extracted_data,
                'preview_url': doc.file.url if hasattr(doc.file, 'url') else None
            }

        except Exception as e:
            logger.error(f"Document processing error: {str(e)}")
            return None

        finally:
            try:
                file.close()
            except:
                pass

    def _analyze_content(self, content):
        """Analyze document content using Gemini"""
        try:
            prompt = """
            Analyze this tax document and extract:
            1. Document type (e.g., APIT, VAT, Invoice)
            2. All monetary amounts with their descriptions
            3. Important dates and periods
            4. Tax-related identifiers (TIN, VAT numbers)

            Return the data in this JSON structure:
            {
                "doc_type": "string",
                "amounts": [
                    {
                        "amount": float,
                        "description": "string",
                        "form_field_type": "string" // e.g., "APIT_DEDUCTION", "VAT_PAYMENT"
                    }
                ],
                "dates": [
                    {
                        "date": "YYYY-MM-DD",
                        "description": "string"
                    }
                ],
                "identifiers": [
                    {
                        "type": "string",
                        "value": "string"
                    }
                ]
            }

            For the content:
            {content}
            """

            response = self.model.generate_content(prompt.format(
                content=content[:4000]  # Limit content length
            ))
            
            return response.text if response else None

        except Exception as e:
            logger.error(f"Gemini analysis error: {e}")
            return None