import os
import google.generativeai as genai # type: ignore
from django.conf import settings # type: ignore
import pytesseract # type: ignore
from pdf2image import convert_from_path # type: ignore
from django.core.files.storage import default_storage # type: ignore
import shutil
import uuid
from django.utils import timezone # type: ignore
import json
import logging
from typing import Dict, Any, List
from .analysis_service import analyze_document

# Handle optional dependencies with try-except blocks
try:
    import pandas as pd # type: ignore
    PANDAS_INSTALLED = True
except ImportError:
    PANDAS_INSTALLED = False
    print("Warning: pandas not installed. Excel processing will be limited.")

try:
    from docx import Document # type: ignore
    DOCX_INSTALLED = True
except ImportError:
    DOCX_INSTALLED = False
    print("Warning: python-docx not installed. Word document processing will be limited.")

try:
    import cv2 # type: ignore
    import numpy as np # type: ignore
    CV2_INSTALLED = True
except ImportError:
    CV2_INSTALLED = False
    print("Warning: opencv-python not installed. Image processing will be limited.")

logger = logging.getLogger(__name__)

class DocumentProcessor:
    def __init__(self):
        api_key = os.getenv('GEMINI_API_KEY')
        if not api_key:
            raise ValueError("Gemini API key not found")
        
        genai.configure(api_key=api_key)
        # Update to use gemini-1.5-flash model
        self.model = genai.GenerativeModel('gemini-1.5-flash')
        self.upload_dir = os.path.join(settings.MEDIA_ROOT, 'tax_documents')
        os.makedirs(self.upload_dir, exist_ok=True)

    def extract_text_from_document(self, file_path: str) -> str:
        """Extract text from document using appropriate method based on file type"""
        try:
            file_extension = os.path.splitext(file_path)[1].lower()
            
            if file_extension == '.pdf':
                try:
                    # Convert PDF to images
                    images = convert_from_path(file_path)
                    text = ""
                    for image in images:
                        # Extract text from each page
                        text += pytesseract.image_to_string(image)
                    return text if text.strip() else "No text could be extracted from PDF"
                except Exception as e:
                    logger.error(f"Error processing PDF: {str(e)}")
                    return "Error processing PDF document"
                
            elif file_extension in ['.jpg', '.jpeg', '.png']:
                try:
                    # Extract text from image
                    text = pytesseract.image_to_string(file_path)
                    return text if text.strip() else "No text could be extracted from image"
                except Exception as e:
                    logger.error(f"Error processing image: {str(e)}")
                    return "Error processing image document"
                
            elif file_extension in ['.doc', '.docx'] and DOCX_INSTALLED:
                try:
                    # Extract text from Word document
                    doc = Document(file_path)
                    text = "\n".join([paragraph.text for paragraph in doc.paragraphs])
                    return text if text.strip() else "No text could be extracted from Word document"
                except Exception as e:
                    logger.error(f"Error processing Word document: {str(e)}")
                    return "Error processing Word document"
                
            elif file_extension in ['.xls', '.xlsx'] and PANDAS_INSTALLED:
                try:
                    # Extract text from Excel file
                    df = pd.read_excel(file_path)
                    return df.to_string() if not df.empty else "No data found in Excel file"
                except Exception as e:
                    logger.error(f"Error processing Excel file: {str(e)}")
                    return "Error processing Excel file"
                
            elif file_extension == '.txt':
                try:
                    # Read text file
                    with open(file_path, 'r', encoding='utf-8') as f:
                        text = f.read()
                        return text if text.strip() else "File is empty"
                except Exception as e:
                    logger.error(f"Error reading text file: {str(e)}")
                    return "Error reading text file"
                    
            else:
                logger.error(f"Unsupported file type: {file_extension}")
                return f"Unsupported file type: {file_extension}"
                
        except Exception as e:
            logger.error(f"Error extracting text: {str(e)}")
            return "Error extracting text from document"

    def analyze_document(self, text: str) -> str:
        """Analyze document text and return structured data"""
        try:
            # Process the text line by line
            lines = text.split('\n')
            income_items = []
            deductions = []
            total_income = 0

            for line in lines:
                line = line.strip()
                if not line:
                    continue

                # Split the line into description and amount
                parts = line.split()
                if len(parts) < 2:
                    continue

                # Extract amount (last part of the line)
                amount_str = parts[-1].replace(',', '')
                try:
                    amount = float(amount_str)
                except ValueError:
                    continue

                # Get description (everything except the amount)
                description = ' '.join(parts[:-1]).strip()
                description_lower = description.lower()

                # Handle capital gains first to ensure they're always categorized as Investment Income
                if 'capital' in description_lower or 'gain' in description_lower:
                    income_items.append({
                        'category': 'Investment Income',
                        'type': 'Capital Gains',
                        'description': description,
                        'amount': amount
                    })
                    total_income += amount
                    continue

                # Handle APIT deductions
                if 'apit' in description_lower:
                    deductions.append({
                        'category': 'Employment Income',
                        'type': 'APIT Deduction',
                        'description': description,
                        'amount': amount
                    })
                    continue

                # Handle WHT deductions
                if 'wht' in description_lower:
                    deductions.append({
                        'category': 'Other Income',
                        'type': 'WHT Deduction',
                        'description': description,
                        'amount': amount
                    })
                    continue

                # Process other income items
                if 'primary income' in description_lower or 'primary salary' in description_lower:
                    income_items.append({
                        'category': 'Employment Income',
                        'type': 'Primary Employment',
                        'description': description,
                        'amount': amount
                    })
                    total_income += amount
                elif 'secondary income' in description_lower or 'secondary salary' in description_lower:
                    income_items.append({
                        'category': 'Employment Income',
                        'type': 'Secondary Employment',
                        'description': description,
                        'amount': amount
                    })
                    total_income += amount
                elif 'sole proprietorship' in description_lower:
                    income_items.append({
                        'category': 'Business Income',
                        'type': 'Sole Proprietorship',
                        'description': description,
                        'amount': amount
                    })
                    total_income += amount
                elif 'partnership' in description_lower:
                    income_items.append({
                        'category': 'Business Income',
                        'type': 'Partnership',
                        'description': description,
                        'amount': amount
                    })
                    total_income += amount
                elif 'trust' in description_lower or 'beneficiary' in description_lower:
                    income_items.append({
                        'category': 'Business Income',
                        'type': 'Trust Beneficiary',
                        'description': description,
                        'amount': amount
                    })
                    total_income += amount
                elif 'betting' in description_lower or 'gaming' in description_lower:
                    income_items.append({
                        'category': 'Business Income',
                        'type': 'Betting, Gaming, Liquor & Tobacco',
                        'description': description,
                        'amount': amount
                    })
                    total_income += amount
                elif 'interest' in description_lower:
                    income_items.append({
                        'category': 'Investment Income',
                        'type': 'Interest Income',
                        'description': description,
                        'amount': amount
                    })
                    total_income += amount
                elif 'dividend' in description_lower:
                    income_items.append({
                        'category': 'Investment Income',
                        'type': 'Dividend Income',
                        'description': description,
                        'amount': amount
                    })
                    total_income += amount
                elif 'rent' in description_lower or 'rental' in description_lower:
                    income_items.append({
                        'category': 'Investment Income',
                        'type': 'Rental Income',
                        'description': description,
                        'amount': amount
                    })
                    total_income += amount
                elif 'service' in description_lower:
                    income_items.append({
                        'category': 'Other Income',
                        'type': 'Service Income (WHT)',
                        'description': description,
                        'amount': amount
                    })
                    total_income += amount
                elif 'royalty' in description_lower:
                    income_items.append({
                        'category': 'Other Income',
                        'type': 'Royalty (WHT)',
                        'description': description,
                        'amount': amount
                    })
                    total_income += amount
                elif 'natural resource' in description_lower:
                    income_items.append({
                        'category': 'Other Income',
                        'type': 'Natural Resource Payment (WHT)',
                        'description': description,
                        'amount': amount
                    })
                    total_income += amount
                elif 'gem' in description_lower or 'auction' in description_lower:
                    income_items.append({
                        'category': 'Other Income',
                        'type': 'Auctioned Gem Sale (WHT)',
                        'description': description,
                        'amount': amount
                    })
                    total_income += amount
                elif 'pension' in description_lower:
                    income_items.append({
                        'category': 'Terminal Benefits',
                        'type': 'Commuted Pension',
                        'description': description,
                        'amount': amount
                    })
                    total_income += amount
                elif 'gratuity' in description_lower:
                    income_items.append({
                        'category': 'Terminal Benefits',
                        'type': 'Retiring Gratuity',
                        'description': description,
                        'amount': amount
                    })
                    total_income += amount
                elif 'compensation' in description_lower or 'job loss' in description_lower:
                    income_items.append({
                        'category': 'Terminal Benefits',
                        'type': 'Compensation for Job Loss',
                        'description': description,
                        'amount': amount
                    })
                    total_income += amount
                elif 'etf' in description_lower:
                    income_items.append({
                        'category': 'Terminal Benefits',
                        'type': 'ETF Payment',
                        'description': description,
                        'amount': amount
                    })
                    total_income += amount
                elif 'donation' in description_lower:
                    income_items.append({
                        'category': 'Qualifying Payments',
                        'type': 'Donations',
                        'description': description,
                        'amount': amount
                    })
                elif 'solar' in description_lower:
                    income_items.append({
                        'category': 'Qualifying Payments',
                        'type': 'Solar Panel Installation',
                        'description': description,
                        'amount': amount
                    })
                elif 'housing' in description_lower:
                    income_items.append({
                        'category': 'Qualifying Payments',
                        'type': 'Low-Income Housing Construction',
                        'description': description,
                        'amount': amount
                    })
                else:
                    # For any other income items, categorize based on context
                    if 'income' in description_lower:
                        income_items.append({
                            'category': 'Other Income',
                            'type': 'Other Income',
                            'description': description,
                            'amount': amount
                        })
                        total_income += amount

            # Sort income items to ensure capital gains are properly categorized
            sorted_income_items = []
            capital_gains = [item for item in income_items if item['type'] == 'Capital Gains']
            other_items = [item for item in income_items if item['type'] != 'Capital Gains']
            sorted_income_items.extend(capital_gains)
            sorted_income_items.extend(other_items)

            # Create the analysis result
            analysis = {
                "document_type": "tax_document",
                "confidence_score": 0.95,
                "processing_time": 0,
                "income_items": sorted_income_items,
                "deductions": deductions,
                "total_assessable_income": total_income - sum(d['amount'] for d in deductions)
            }

            return json.dumps(analysis)

        except Exception as e:
            logger.error(f"Error analyzing document: {str(e)}")
            # Return a valid but empty analysis structure
            empty_analysis = {
                "document_type": "Unknown",
                "confidence_score": 0.0,
                "processing_time": 0,
                "income_items": [],
                "deductions": [],
                "total_assessable_income": 0
            }
            return json.dumps(empty_analysis)

    def analyze_document_with_gemini(self, text: str) -> str:
        """Analyze document text using Gemini API for improved categorization"""
        try:
            # First, extract basic information using the existing method
            basic_analysis = self.analyze_document(text)
            basic_data = json.loads(basic_analysis)
            
            # Prepare text for Gemini analysis
            analysis_prompt = f"""
            You are an expert tax consultant for Sri Lanka. Analyze the following document text and categorize income items and deductions accurately.

            Document Text:
            {text}

            Current Analysis (to improve upon):
            {json.dumps(basic_data, indent=2)}

            Instructions:
            1. Review the current categorization and improve it
            2. Categorize income items into these categories:
               - Employment Income (Primary Employment, Secondary Employment)
               - Business Income (Sole Proprietorship, Partnership, Trust Beneficiary, Betting/Gaming)
               - Investment Income (Interest Income, Dividend Income, Rental Income, Capital Gains)
               - Other Income (Service Income, Royalty, Natural Resource Payment, Gem Sale)
               - Terminal Benefits (Commuted Pension, Retiring Gratuity, Compensation, ETF)
               - Qualifying Payments (Donations, Solar Panel, Housing Construction)

            3. Categorize deductions into:
               - APIT (Advanced Personal Income Tax) - for Employment Income
               - WHT (Withholding Tax) - for Other Income
               - Other deductions

            4. Return a JSON response with this exact structure:
            {{
                "document_type": "tax_document",
                "confidence_score": 0.95,
                "processing_time": 0,
                "income_items": [
                    {{
                        "category": "category_name",
                        "type": "specific_type",
                        "description": "original_description",
                        "amount": amount_value
                    }}
                ],
                "deductions": [
                    {{
                        "category": "category_name",
                        "type": "deduction_type",
                        "description": "original_description",
                        "amount": amount_value
                    }}
                ],
                "total_assessable_income": total_value
            }}

            5. Ensure all amounts are numeric values
            6. Maintain the original description text
            7. Be more accurate than the current analysis
            8. If unsure about categorization, use the most likely category based on Sri Lankan tax law
            9. IMPORTANT: Return ONLY the JSON response, no additional text or explanations
            """

            try:
                logger.info("Starting Gemini API analysis...")
                # Use Gemini API for improved categorization
                response = self.model.generate_content(analysis_prompt)
                
                if response and response.text:
                    logger.info(f"Gemini API response received: {len(response.text)} characters")
                    
                    # Try to parse the JSON response
                    try:
                        # Clean the response text to extract only JSON
                        response_text = response.text.strip()
                        
                        # Remove any markdown formatting if present
                        if response_text.startswith('```json'):
                            response_text = response_text[7:]
                        if response_text.endswith('```'):
                            response_text = response_text[:-3]
                        response_text = response_text.strip()
                        
                        gemini_analysis = json.loads(response_text)
                        
                        # Validate the structure
                        if (isinstance(gemini_analysis, dict) and 
                            'income_items' in gemini_analysis and 
                            'deductions' in gemini_analysis):
                            
                            # Calculate total assessable income
                            total_income = sum(item.get('amount', 0) for item in gemini_analysis.get('income_items', []))
                            total_deductions = sum(ded.get('amount', 0) for ded in gemini_analysis.get('deductions', []))
                            gemini_analysis['total_assessable_income'] = total_income - total_deductions
                            
                            logger.info(f"Gemini analysis successful: {len(gemini_analysis.get('income_items', []))} income items, {len(gemini_analysis.get('deductions', []))} deductions")
                            return json.dumps(gemini_analysis)
                        else:
                            logger.warning("Gemini response structure invalid, falling back to basic analysis")
                            return basic_analysis
                            
                    except json.JSONDecodeError as e:
                        logger.warning(f"Failed to parse Gemini JSON response: {e}, falling back to basic analysis")
                        logger.debug(f"Raw Gemini response: {response.text}")
                        return basic_analysis
                else:
                    logger.warning("No response from Gemini API, falling back to basic analysis")
                    return basic_analysis
                    
            except Exception as gemini_error:
                logger.error(f"Gemini API error: {gemini_error}, falling back to basic analysis")
                return basic_analysis

        except Exception as e:
            logger.error(f"Error in Gemini-enhanced analysis: {str(e)}")
            # Fall back to basic analysis
            return self.analyze_document(text)

    def cleanup_session_documents(self, session_id: str):
        """Clean up documents associated with a session"""
        try:
            session_dir = os.path.join(self.upload_dir, session_id)
            if os.path.exists(session_dir):
                for file in os.listdir(session_dir):
                    os.remove(os.path.join(session_dir, file))
                os.rmdir(session_dir)
        except Exception as e:
            logger.error(f"Error cleaning up session documents: {str(e)}")
            raise

    def map_context_to_form_fields(self, context_data):
        """Map extracted context to form fields"""
        try:
            logger.info(f"Mapping context data: {context_data}")
            
            # Initialize the mappings structure
            mappings = {
                'EmploymentIncome': {
                    'income_items': [],
                    'deductions': []
                }
            }

            # Process income items
            if 'income_items' in context_data:
                for item in context_data['income_items']:
                    if item.get('category') == 'Employment Income':
                        mappings['EmploymentIncome']['income_items'].append({
                            'type': 'SALARY',
                            'amount': float(item.get('amount', 0)),
                            'description': item.get('description', '')
                        })
                    elif item.get('category') == 'Secondary Employment':
                        mappings['EmploymentIncome']['income_items'].append({
                            'type': 'SECONDARY_SALARY',
                            'amount': float(item.get('amount', 0)),
                            'description': item.get('description', '')
                        })

            # Process deductions
            if 'deductions' in context_data:
                for deduction in context_data['deductions']:
                    if deduction.get('type') == 'APIT':
                        mappings['EmploymentIncome']['deductions'].append({
                            'type': 'APIT',
                            'amount': float(deduction.get('amount', 0)),
                            'description': deduction.get('description', ''),
                            'source': deduction.get('source', 'Primary Employment')
                        })

            logger.info(f"Generated mappings: {mappings}")
            return mappings

        except Exception as e:
            logger.error(f"Error mapping context to form fields: {str(e)}")
            return {
                'EmploymentIncome': {
                    'income_items': [],
                    'deductions': []
                }
            }

    def process_and_store_context(self, document_id, extracted_data):
        """Process extracted data and store context with form mappings"""
        try:
            # Store extracted contexts
            contexts = []
            for item in extracted_data.get('income_items', []):
                context = ExtractedContext.objects.create(
                    document_id=document_id,
                    context_type='income',
                    original_text=item.get('original_text', ''),
                    extracted_value=item.get('amount', 0),
                    confidence_score=0.9
                )
                contexts.append(context)

            for item in extracted_data.get('deductions', []):
                context = ExtractedContext.objects.create(
                    document_id=document_id,
                    context_type='deduction',
                    original_text=item.get('original_text', ''),
                    extracted_value=item.get('amount', 0),
                    confidence_score=0.9
                )
                contexts.append(context)

            # Map contexts to form fields
            mappings = self.map_context_to_form_fields(extracted_data)
            
            # Store form field mappings
            for mapping in mappings.get('EmploymentIncome', {}).get('income_items', []):
                FormFieldMapping.objects.create(
                    context=contexts[0],
                    form_type='EmploymentIncome',
                    field_name=mapping['type'],
                    field_path=f"EmploymentIncome.{mapping['type']}",
                    confidence_score=0.9
                )

            for mapping in mappings.get('EmploymentIncome', {}).get('deductions', []):
                FormFieldMapping.objects.create(
                    context=contexts[1],
                    form_type='EmploymentIncome',
                    field_name=mapping['type'],
                    field_path=f"EmploymentIncome.{mapping['type']}",
                    confidence_score=0.9
                )

            return True
            
        except Exception as e:
            logger.error(f"Error processing and storing context: {str(e)}")
            return False

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
            logger.error(f"Error storing document: {str(e)}") # type: ignore
            return None

    def maintain_session_documents(self, session_id, document_info):
        """Store document info in session file for persistence"""
        try:
            # Create session metadata file
            session_meta_path = os.path.join(self.upload_dir, session_id, 'session_meta.json')
            
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
            logger.error(f"Error maintaining session documents: {str(e)}") # type: ignore
            return False

    def cleanup_session(self, session_id):
        """Only clean up when explicitly called"""
        try:
            session_dir = os.path.join(self.upload_dir, session_id)
            if os.path.exists(session_dir):
                shutil.rmtree(session_dir)
            return True
        except Exception as e:
            logger.error(f"Error cleaning up session: {str(e)}") # type: ignore
            return False

class TaxFormDocumentProcessor:
    def __init__(self):
        self.storage_path = os.path.join(settings.MEDIA_ROOT, 'tax_documents')
        os.makedirs(self.storage_path, exist_ok=True)

    def process_document(self, file, session_id):
        try:
            # Generate a unique document ID
            doc_id = str(uuid.uuid4())
            
            # Save the file
            file_path = f'tax_documents/{session_id}/{doc_id}_{file.name}'
            saved_path = default_storage.save(file_path, file)

            # Create document dictionary
            document = {
                'id': doc_id,
                'original_filename': file.name,
                'stored_filename': saved_path,
                'file_type': file.content_type,
                'upload_date': timezone.now(),
                'session_id': session_id
            }

            logger.info(f"Document processed successfully: {doc_id}")
            return document

        except Exception as e:
            logger.error(f"Error processing document: {str(e)}")
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
            logger.error(f"Metadata storage error: {str(e)}") # type: ignore

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
            logger.error(f"Error retrieving session documents: {str(e)}") # type: ignore
            return []

    def verify_document(self, doc_info):
        """Verify document exists and is accessible"""
        if not doc_info or 'absolute_path' not in doc_info:
            return False
        return os.path.exists(doc_info['absolute_path'])

def process_document(file_path: str) -> Dict[str, Any]:
    """Process a document and return structured data"""
    try:
        processor = DocumentProcessor()
        extracted_text = processor.extract_text_from_document(file_path)
        analysis_result = processor.analyze_document_with_gemini(extracted_text)
        return json.loads(analysis_result)
    except Exception as e:
        logger.error(f"Error processing document: {str(e)}")
        raise

