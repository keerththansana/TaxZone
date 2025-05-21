import os
import google.generativeai as genai
from django.conf import settings
import pytesseract
from pdf2image import convert_from_path
from django.core.files.storage import default_storage
import shutil
import uuid
from django.utils import timezone
import json

# Handle optional dependencies with try-except blocks
try:
    import pandas as pd
    PANDAS_INSTALLED = True
except ImportError:
    PANDAS_INSTALLED = False
    print("Warning: pandas not installed. Excel processing will be limited.")

try:
    from docx import Document
    DOCX_INSTALLED = True
except ImportError:
    DOCX_INSTALLED = False
    print("Warning: python-docx not installed. Word document processing will be limited.")

try:
    import cv2
    import numpy as np
    CV2_INSTALLED = True
except ImportError:
    CV2_INSTALLED = False
    print("Warning: opencv-python not installed. Image processing will be limited.")

class DocumentProcessor:
    def __init__(self):
        api_key = os.getenv('GEMINI_API_KEY')
        if not api_key:
            raise ValueError("Gemini API key not found")
        
        genai.configure(api_key=api_key)
        # Update to use gemini-1.5-flash model
        self.model = genai.GenerativeModel('gemini-1.5-flash')
        self.storage_path = os.path.join(settings.MEDIA_ROOT, 'tax_documents')
        os.makedirs(self.storage_path, exist_ok=True)

    def extract_text_from_document(self, file_path):
        """Extract text from different document types"""
        file_extension = os.path.splitext(file_path)[1].lower()
        
        if file_extension in ['.jpg', '.jpeg', '.png']:
            return self._extract_from_image(file_path)
        elif file_extension == '.pdf':
            return self._extract_from_pdf(file_path)
        elif file_extension in ['.doc', '.docx']:
            return self._extract_from_word(file_path)
        elif file_extension in ['.xls', '.xlsx']:
            return self._extract_from_excel(file_path)
        else:
            with open(file_path, 'r', encoding='utf-8') as file:
                return file.read()

    def _extract_from_image(self, file_path):
        if not CV2_INSTALLED:
            raise ImportError("opencv-python is required for image processing")
        img = cv2.imread(file_path)
        text = pytesseract.image_to_string(img)
        return text

    def _extract_from_pdf(self, file_path):
        images = convert_from_path(file_path)
        text = ''
        for image in images:
            text += pytesseract.image_to_string(image)
        return text

    def _extract_from_word(self, file_path):
        if not DOCX_INSTALLED:
            raise ImportError("python-docx is required for Word document processing")
        doc = Document(file_path)
        return ' '.join([paragraph.text for paragraph in doc.paragraphs])

    def _extract_from_excel(self, file_path):
        if not PANDAS_INSTALLED:
            raise ImportError("pandas is required for Excel processing")
        df = pd.read_excel(file_path)
        return df.to_string()

    def analyze_document(self, text):
        """Analyze document content using Gemini AI"""
        prompt = """
        Analyze this tax document and extract quickly:
        1. Document type (Income Tax Calculation, APIT, etc.)
        2. Income amounts by category
        3. Deductions and reliefs
        4. Total assessable income

        Return ONLY a JSON object without markdown formatting:
        {
            "document_type": "string",
            "income_items": [
                {"category": "string", "amount": number}
            ],
            "deductions": [
                {"type": "string", "amount": number}
            ],
            "total_assessable_income": number
        }
        """
        
        try:
            response = self.model.generate_content(
                contents=prompt + "\n\nDocument content:\n" + text,
                generation_config={
                    'temperature': 0.1,
                    'top_p': 0.8,
                    'candidate_count': 1
                }
            )
            # Clean the response text to remove markdown formatting
            result = response.text.strip()
            if result.startswith('```json'):
                result = result[7:]  # Remove ```json
            if result.endswith('```'):
                result = result[:-3]  # Remove ```
            return result.strip()
        except Exception as e:
            raise Exception(f"Error analyzing document: {str(e)}")

    def store_document(self, file, session_id):
        """Store document persistently until explicit cleanup"""
        try:
            # Create session directory if it doesn't exist
            session_dir = os.path.join('tax_documents', session_id)
            if not default_storage.exists(session_dir):
                os.makedirs(os.path.join(settings.MEDIA_ROOT, session_dir))

            # Generate unique filename
            file_name = default_storage.get_available_name(
                os.path.join(session_dir, file.name)
            )
            
            # Store file persistently
            stored_path = default_storage.save(file_name, file)
            
            return stored_path
        except Exception as e:
            logger.error(f"Error storing document: {str(e)}")
            return None

    def cleanup_session_documents(self, session_id):
        """Clean up documents when returning to home"""
        session_path = os.path.join(self.storage_path, session_id)
        if os.path.exists(session_path):
            shutil.rmtree(session_path)

    def maintain_session_documents(self, session_id, document_info):
        """Store document info in session file for persistence"""
        try:
            # Create session metadata file
            session_meta_path = os.path.join(self.storage_path, session_id, 'session_meta.json')
            
            # Read existing metadata
            existing_docs = []
            if os.path.exists(session_meta_path):
                with open(session_meta_path, 'r') as f:
                    try:
                        existing_docs = json.load(f)
                    except json.JSONDecodeError:
                        existing_docs = []
            
            # Add new document
            if document_info not in existing_docs:
                existing_docs.append(document_info)
                
            # Write updated metadata
            with open(session_meta_path, 'w') as f:
                json.dump(existing_docs, f)
                
            return True
        except Exception as e:
            logger.error(f"Error maintaining session documents: {str(e)}")
            return False

class TaxFormDocumentProcessor:
    def __init__(self):
        self.storage_path = os.path.join(settings.MEDIA_ROOT, 'tax_documents')
        os.makedirs(self.storage_path, exist_ok=True)

    def process_document(self, file, session_id):
        try:
            # Create session-specific directory
            session_dir = os.path.join(self.storage_path, session_id)
            os.makedirs(session_dir, exist_ok=True)

            # Generate unique filename
            doc_id = str(uuid.uuid4())
            file_ext = os.path.splitext(file.name)[1]
            filename = f"{doc_id}{file_ext}"
            
            # Store file with session path
            file_path = os.path.join(session_dir, filename)
            
            # Save file with chunks for large files
            with open(file_path, 'wb+') as destination:
                for chunk in file.chunks():
                    destination.write(chunk)
            
            # Create document metadata
            doc_info = {
                'doc_id': doc_id,
                'name': file.name,
                'path': file_path,
                'session_id': session_id,
                'upload_time': timezone.now().isoformat(),
                'is_processed': True
            }

            # Store metadata in session file
            self._store_session_metadata(session_id, doc_info)
            
            return doc_info

        except Exception as e:
            logger.error(f"Document processing error: {str(e)}")
            return None

    def _store_session_metadata(self, session_id, doc_info):
        """Store document metadata in session-specific file"""
        try:
            metadata_file = os.path.join(self.storage_path, session_id, 'metadata.json')
            
            # Load existing metadata
            existing_docs = []
            if os.path.exists(metadata_file):
                with open(metadata_file, 'r') as f:
                    existing_docs = json.load(f)
            
            # Add new document if not exists
            if not any(d.get('doc_id') == doc_info['doc_id'] for d in existing_docs):
                existing_docs.append(doc_info)
            
            # Write updated metadata
            with open(metadata_file, 'w') as f:
                json.dump(existing_docs, f, indent=2)
                
        except Exception as e:
            logger.error(f"Metadata storage error: {str(e)}")

    def get_session_documents(self, session_id):
        """Retrieve all documents for a session"""
        try:
            metadata_file = os.path.join(self.storage_path, session_id, 'metadata.json')
            if not os.path.exists(metadata_file):
                return []
            
            # Read metadata file
            with open(metadata_file, 'r') as f:
                documents = json.load(f)
            
            # Verify files still exist
            valid_docs = []
            for doc in documents:
                if os.path.exists(doc.get('path', '')):
                    valid_docs.append(doc)
            
            return valid_docs
            
        except Exception as e:
            logger.error(f"Error retrieving session documents: {str(e)}")
            return []

    def verify_document(self, doc_info):
        """Verify document exists and is accessible"""
        if not doc_info or 'absolute_path' not in doc_info:
            return False
        return os.path.exists(doc_info['absolute_path'])

    def cleanup_session(self, session_id):
        """Only clean up when explicitly called"""
        try:
            session_dir = os.path.join(self.storage_path, session_id)
            if os.path.exists(session_dir):
                shutil.rmtree(session_dir)
            return True
        except Exception as e:
            logger.error(f"Error cleaning up session: {str(e)}")
            return False