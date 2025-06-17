from django.shortcuts import render
import logging
from rest_framework import status
from rest_framework.response import Response
from rest_framework.decorators import api_view, parser_classes
from rest_framework.parsers import MultiPartParser, FormParser, FileUploadParser
from django.core.files.storage import default_storage
from django.conf import settings
from django.http import FileResponse, Http404, JsonResponse
from django.utils import timezone
import os
import mimetypes
import json
import uuid
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from .models import TaxFormDocument
from .services.document_processor import TaxFormDocumentProcessor, DocumentProcessor
from django.conf import settings
from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from .models import DownloadedReports
from django.core.files import File
import os

# Initialize logger
logger = logging.getLogger(__name__)

@api_view(['POST'])
@parser_classes([MultiPartParser, FormParser, FileUploadParser])
def upload_tax_form_document(request):
    try:
        if not request.session.session_key:
            request.session.create()
        
        if 'file' not in request.FILES:
            return Response({
                'success': False,
                'error': 'No file provided'
            }, status=status.HTTP_400_BAD_REQUEST)

        uploaded_file = request.FILES['file']
        
        # Generate unique filename
        unique_filename = f"{uuid.uuid4()}_{uploaded_file.name}"
        file_path = os.path.join('tax_documents', request.session.session_key, unique_filename)
        
        # Save file
        full_path = default_storage.save(file_path, uploaded_file)

        # Create document data
        document_data = {
            'doc_id': str(uuid.uuid4()),
            'filename': uploaded_file.name,
            'stored_filename': full_path,  # Save the stored path
            'file_type': uploaded_file.content_type,
            'upload_date': timezone.now().isoformat()
        }

        # Store in session
        documents = request.session.get('tax_documents', [])
        documents.append(document_data)
        request.session['tax_documents'] = documents
        request.session.modified = True

        return Response({
            'success': True,
            'document': document_data
        })

    except Exception as e:
        logger.error(f"Upload error: {str(e)}")
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
def get_session_documents(request):
    try:
        # Ensure session exists
        if not request.session.session_key:
            request.session.create()
            
        # Get documents from session
        documents = request.session.get('tax_documents', [])
        
        # Ensure we're returning a list
        if not isinstance(documents, list):
            documents = []
            
        return Response({
            'success': True,
            'documents': documents
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Error fetching session documents: {str(e)}")
        return Response({
            'success': False,
            'error': 'Failed to fetch documents',
            'documents': []
        }, status=status.HTTP_200_OK)  # Return 200 with empty array instead of 500

@api_view(['DELETE'])
def remove_session_document(request, doc_id):
    try:
        # Get documents from session
        documents = request.session.get('tax_documents', [])
        
        # Find the document to remove
        document = next((doc for doc in documents if doc['doc_id'] == doc_id), None)
        
        if not document:
            return Response({
                'success': False,
                'error': 'Document not found'
            }, status=status.HTTP_404_NOT_FOUND)

        # Remove file from storage if it exists
        if 'stored_filename' in document:
            try:
                file_path = document['stored_filename']
                if default_storage.exists(file_path):
                    default_storage.delete(file_path)
            except Exception as e:
                logger.error(f"Error deleting file: {str(e)}")

        # Remove document from session
        updated_documents = [doc for doc in documents if doc['doc_id'] != doc_id]
        request.session['tax_documents'] = updated_documents
        request.session.modified = True

        return Response({
            'success': True,
            'message': 'Document removed successfully'
        })

    except Exception as e:
        logger.error(f"Error removing document: {str(e)}")
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
def view_document(request, doc_id):
    try:
        # Get document from session
        documents = request.session.get('tax_documents', [])
        document = next((doc for doc in documents if doc['doc_id'] == doc_id), None)
        
        if not document or 'stored_filename' not in document:
            logger.error(f"Document not found or invalid: {doc_id}")
            return Response({
                'success': False,
                'error': 'Document not found'
            }, status=status.HTTP_404_NOT_FOUND)

        file_path = document['stored_filename']
        
        if not default_storage.exists(file_path):
            logger.error(f"File not found at path: {file_path}")
            return Response({
                'success': False,
                'error': 'File not found'
            }, status=status.HTTP_404_NOT_FOUND)

        # Open and serve file
        file = default_storage.open(file_path)
        response = FileResponse(file)
        response['Content-Type'] = document.get('file_type', 'application/octet-stream')
        response['Content-Disposition'] = f'inline; filename="{document["filename"]}"'
        
        return response

    except Exception as e:
        logger.error(f"Error viewing document: {str(e)}")
        return Response({
            'success': False,
            'error': 'Error viewing document'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
def analyze_document(request, doc_id):
    try:
        # Get document from session
        documents = request.session.get('tax_documents', [])
        document = next((doc for doc in documents if doc['doc_id'] == doc_id), None)
        
        if not document or 'stored_filename' not in document:
            return Response({
                'success': False,
                'error': 'Document not found'
            }, status=status.HTTP_404_NOT_FOUND)

        file_path = os.path.join(settings.MEDIA_ROOT, document['stored_filename'])
        
        if not os.path.exists(file_path):
            return Response({
                'success': False,
                'error': 'File not found'
            }, status=status.HTTP_404_NOT_FOUND)

        # Initialize processor and process document
        processor = DocumentProcessor()
        
        # Extract text from document
        extracted_text = processor.extract_text_from_document(file_path)
        logger.info(f"Extracted text: {extracted_text[:200]}...")  # Log first 200 chars
        
        # Analyze the document using Gemini-enhanced analysis
        analysis_result = processor.analyze_document_with_gemini(extracted_text)
        analysis_data = json.loads(analysis_result)
        
        # Log the analysis results
        logger.info(f"Gemini-enhanced analysis results: {analysis_data}")
        
        # Update document with analysis results
        document['analyzed'] = True
        document['analysis'] = analysis_data
        request.session.modified = True

        # Store the analysis results in a separate session key for easy access
        request.session['last_analysis'] = analysis_data
        request.session.modified = True

        return Response({
            'success': True,
            'analysis': analysis_data
        })

    except Exception as e:
        logger.error(f"Error analyzing document: {str(e)}")
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@parser_classes([MultiPartParser, FormParser])
def analyze_uploaded_document(request):
    # Debug logging
    logger.debug(f"Request META: {request.META.get('CONTENT_TYPE', 'No content type')}")
    logger.debug(f"Request FILES: {request.FILES}")
    logger.debug(f"Request POST: {request.POST}")
    
    # Check if any file was uploaded
    if len(request.FILES) == 0:
        return Response({
            'error': 'No file uploaded',
            'debug_info': {
                'content_type': request.content_type,
                'files_received': list(request.FILES.keys()),
                'post_data': list(request.POST.keys())
            }
        }, status=400)

    # Get the uploaded file
    file_field = next(iter(request.FILES.values()))
    
    try:
        # Create temp directory if it doesn't exist
        temp_dir = os.path.join(settings.MEDIA_ROOT, 'temp')
        os.makedirs(temp_dir, exist_ok=True)
        
        # Save file with unique name
        file_name = default_storage.get_available_name(
            os.path.join('temp', file_field.name)
        )
        file_path = default_storage.save(file_name, file_field)
        full_path = default_storage.path(file_path)
        
        # Process the document using Gemini-enhanced analysis
        processor = DocumentProcessor()
        extracted_text = processor.extract_text_from_document(full_path)
        analysis_result = processor.analyze_document_with_gemini(extracted_text)
        
        # Clean up
        default_storage.delete(file_path)
        
        return Response({
            'success': True,
            'analysis': analysis_result
        })
        
    except Exception as e:
        logger.error(f"Error processing document: {str(e)}")
        return Response({
            'error': str(e),
            'detail': 'Error processing document'
        }, status=500)

@api_view(['POST'])
def cleanup_tax_session(request):
    """Clean up session documents when returning to home"""
    try:
        if request.session.session_key:
            processor = DocumentProcessor()
            processor.cleanup_session_documents(request.session.session_key)
            request.session['tax_documents'] = []
            request.session.modified = True
        return Response({'success': True})
    except Exception as e:
        return Response({'error': str(e)}, status=500)

@csrf_exempt
@require_http_methods(["POST"])
def upload_document(request):
    """Handle document upload and processing"""
    try:
        if 'file' not in request.FILES:
            return JsonResponse({
                'success': False,
                'error': 'No file provided'
            }, status=400)

        file = request.FILES['file']
        session_id = request.POST.get('session_id', 'default')

        # Process the document
        processor = TaxFormDocumentProcessor()
        result = processor.process_document(file, session_id)

        if not result:
            return JsonResponse({
                'success': False,
                'error': 'Failed to process document'
            }, status=500)

        return JsonResponse({
            'success': True,
            'data': result
        })

    except Exception as e:
        logger.error(f"Error processing document upload: {str(e)}")
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)

@csrf_exempt
@require_http_methods(["POST"])
def process_auto_fill(request):
    """Process auto-fill request"""
    try:
        # Get the last analysis results from session
        analysis_results = request.session.get('last_analysis', {})
        
        if not analysis_results:
            logger.error("No analysis results found in session")
            return JsonResponse({
                'success': False,
                'error': 'No analysis results available'
            }, status=400)

        logger.info(f"Processing auto-fill with analysis results: {analysis_results}")

        # Process the analysis results
        processor = DocumentProcessor()
        mapped_data = processor.map_context_to_form_fields(analysis_results)

        # Format the response
        formatted_mappings = {
            'EmploymentIncome': {
                'primaryEntries': [],
                'secondaryEntries': [],
                'apitEntries': []
            }
        }

        # Process income items
        for item in mapped_data.get('EmploymentIncome', {}).get('income_items', []):
            if item['type'] == 'SALARY':
                formatted_mappings['EmploymentIncome']['primaryEntries'].append({
                    'name': 'Primary Salary',
                    'amount': str(item['amount'])
                })
            elif item['type'] == 'SECONDARY_SALARY':
                formatted_mappings['EmploymentIncome']['secondaryEntries'].append({
                    'name': 'Secondary Salary',
                    'amount': str(item['amount'])
                })

        # Process deductions
        for deduction in mapped_data.get('EmploymentIncome', {}).get('deductions', []):
            if deduction['type'] == 'APIT':
                formatted_mappings['EmploymentIncome']['apitEntries'].append({
                    'source': deduction.get('source', 'Primary Employment'),
                    'name': 'APIT Deduction',
                    'amount': str(deduction['amount'])
                })

        logger.info(f"Returning formatted mappings: {formatted_mappings}")
        return JsonResponse({
            'success': True,
            'mappings': formatted_mappings
        })

    except Exception as e:
        logger.error(f"Error processing auto-fill: {str(e)}")
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)

def determine_form_type(item_type):
    form_mapping = {
        'APIT': 'EmploymentIncome',
        'SALARY': 'EmploymentIncome',
        # Add more mappings as needed
    }
    return form_mapping.get(item_type)

@api_view(['GET'])
def get_documents(request):
    """Get all documents for the current session"""
    try:
        # Ensure session exists
        if not request.session.session_key:
            request.session.create()
            
        # Get documents from session
        documents = request.session.get('tax_documents', [])
        
        # Ensure we're returning a list
        if not isinstance(documents, list):
            documents = []
            
        return Response({
            'success': True,
            'documents': documents
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Error fetching documents: {str(e)}")
        return Response({
            'success': False,
            'error': 'Failed to fetch documents',
            'documents': []
        }, status=status.HTTP_200_OK)

@api_view(['GET'])
def get_document(request, document_id):
    """Get a specific document by ID"""
    try:
        # Get documents from session
        documents = request.session.get('tax_documents', [])
        
        # Find the requested document
        document = next((doc for doc in documents if doc['doc_id'] == document_id), None)
        
        if not document:
            return Response({
                'success': False,
                'error': 'Document not found'
            }, status=status.HTTP_404_NOT_FOUND)
            
        return Response({
            'success': True,
            'document': document
        })
        
    except Exception as e:
        logger.error(f"Error fetching document: {str(e)}")
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['DELETE'])
def delete_document(request, document_id):
    """Delete a specific document"""
    try:
        # Get documents from session
        documents = request.session.get('tax_documents', [])
        
        # Find the document to delete
        document = next((doc for doc in documents if doc['doc_id'] == document_id), None)
        
        if not document:
            return Response({
                'success': False,
                'error': 'Document not found'
            }, status=status.HTTP_404_NOT_FOUND)

        # Remove file from storage if it exists
        if 'stored_filename' in document:
            try:
                file_path = document['stored_filename']
                if default_storage.exists(file_path):
                    default_storage.delete(file_path)
            except Exception as e:
                logger.error(f"Error deleting file: {str(e)}")

        # Remove document from session
        updated_documents = [doc for doc in documents if doc['doc_id'] != document_id]
        request.session['tax_documents'] = updated_documents
        request.session.modified = True

        return Response({
            'success': True,
            'message': 'Document deleted successfully'
        })

    except Exception as e:
        logger.error(f"Error deleting document: {str(e)}")
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
def extract_and_map_context(request, document_id):
    """Extract and map context from a document"""
    try:
        # Get document from session
        documents = request.session.get('tax_documents', [])
        document = next((doc for doc in documents if doc['doc_id'] == document_id), None)
        
        if not document or 'stored_filename' not in document:
            return Response({
                'success': False,
                'error': 'Document not found'
            }, status=status.HTTP_404_NOT_FOUND)

        file_path = os.path.join(settings.MEDIA_ROOT, document['stored_filename'])
        
        if not os.path.exists(file_path):
            return Response({
                'success': False,
                'error': 'File not found'
            }, status=status.HTTP_404_NOT_FOUND)

        # Initialize processor
        processor = DocumentProcessor()
        
        # Extract text from document
        extracted_text = processor.extract_text_from_document(file_path)
        
        # Analyze the document using Gemini-enhanced analysis
        analysis_result = processor.analyze_document_with_gemini(extracted_text)
        analysis_data = json.loads(analysis_result)
        
        # Process and store context
        success = processor.process_and_store_context(document_id, analysis_data)
        
        if not success:
            return Response({
                'success': False,
                'error': 'Failed to process and store context'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        # Update document with analysis results
        document['analyzed'] = True
        document['analysis'] = analysis_data
        request.session.modified = True

        return Response({
            'success': True,
            'analysis': analysis_data
        })

    except Exception as e:
        logger.error(f"Error extracting and mapping context: {str(e)}")
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
def get_form_field_mappings(request, document_id):
    """Get form field mappings for a document"""
    try:
        # Get document from session
        documents = request.session.get('tax_documents', [])
        document = next((doc for doc in documents if doc['doc_id'] == document_id), None)
        
        if not document:
            return Response({
                'success': False,
                'error': 'Document not found'
            }, status=status.HTTP_404_NOT_FOUND)

        # Get mappings from document analysis
        mappings = document.get('analysis', {}).get('mappings', [])
        
        return Response({
            'success': True,
            'mappings': mappings
        })

    except Exception as e:
        logger.error(f"Error getting form field mappings: {str(e)}")
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@csrf_exempt
def auto_fill_forms(request):
    """Handle auto-fill form mapping request"""
    try:
        logger.info("Received auto-fill request")
        
        # Get the last analysis results from session
        analysis_data = request.session.get('last_analysis', {})
        
        if not analysis_data:
            logger.error("No analysis data found in session")
            return Response({
                'success': False,
                'error': 'No analysis data available'
            }, status=status.HTTP_400_BAD_REQUEST)

        logger.info(f"Processing analysis data: {analysis_data}")
        processor = DocumentProcessor()
        
        # Map the analysis data to form fields
        mappings = processor.map_context_to_form_fields(analysis_data)
        logger.info(f"Generated mappings: {mappings}")
        
        # Format the response
        formatted_mappings = {
            'EmploymentIncome': {
                'primaryEntries': [],
                'secondaryEntries': [],
                'apitEntries': []
            },
            'BusinessIncome': {
                'businessEntries': [],
                'deductions': []
            },
            'InvestmentIncome': {
                'investmentEntries': [],
                'deductions': []
            },
            'OtherIncome': {
                'otherEntries': []
            },
            'TerminalBenefits': {
                'benefitEntries': []
            },
            'QualifyingPayments': {
                'paymentEntries': []
            }
        }

        # Process income items
        for item in analysis_data.get('income_items', []):
            category = item.get('category', '')
            if category == 'Employment Income':
                if item.get('type') == 'SALARY':
                    formatted_mappings['EmploymentIncome']['primaryEntries'].append({
                        'name': 'Primary Salary',
                        'amount': str(item.get('amount', 0))
                    })
                elif item.get('type') == 'SECONDARY_SALARY':
                    formatted_mappings['EmploymentIncome']['secondaryEntries'].append({
                        'name': 'Secondary Salary',
                        'amount': str(item.get('amount', 0))
                    })
            elif category == 'Business Income':
                formatted_mappings['BusinessIncome']['businessEntries'].append({
                    'name': item.get('description', 'Business Income'),
                    'amount': str(item.get('amount', 0))
                })
            elif category == 'Investment Income':
                formatted_mappings['InvestmentIncome']['investmentEntries'].append({
                    'name': item.get('description', 'Investment Income'),
                    'amount': str(item.get('amount', 0))
                })
            elif category == 'Other Income':
                formatted_mappings['OtherIncome']['otherEntries'].append({
                    'name': item.get('description', 'Other Income'),
                    'amount': str(item.get('amount', 0))
                })
            elif category == 'Terminal Benefits':
                formatted_mappings['TerminalBenefits']['benefitEntries'].append({
                    'name': item.get('description', 'Terminal Benefit'),
                    'amount': str(item.get('amount', 0))
                })
            elif category == 'Qualifying Payments':
                formatted_mappings['QualifyingPayments']['paymentEntries'].append({
                    'name': item.get('description', 'Qualifying Payment'),
                    'amount': str(item.get('amount', 0))
                })

        # Process deductions
        for deduction in analysis_data.get('deductions', []):
            deduction_type = deduction.get('type', '')
            if deduction_type == 'APIT':
                formatted_mappings['EmploymentIncome']['apitEntries'].append({
                    'source': deduction.get('source', 'Primary Employment'),
                    'name': 'APIT Deduction',
                    'amount': str(deduction.get('amount', 0))
                })
            elif deduction_type == 'BUSINESS_DEDUCTION':
                formatted_mappings['BusinessIncome']['deductions'].append({
                    'name': deduction.get('description', 'Business Deduction'),
                    'amount': str(deduction.get('amount', 0))
                })
            elif deduction_type == 'INVESTMENT_DEDUCTION':
                formatted_mappings['InvestmentIncome']['deductions'].append({
                    'name': deduction.get('description', 'Investment Deduction'),
                    'amount': str(deduction.get('amount', 0))
                })

        logger.info(f"Returning formatted mappings: {formatted_mappings}")
        return Response({
            'success': True,
            'mappings': formatted_mappings
        })
        
    except Exception as e:
        logger.error(f"Error processing auto-fill: {str(e)}")
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def record_download(request):
    user = request.user
    document_name = request.data.get('document_name')  # name of the file sent by frontend
    
    if not document_name:
        return Response({"error": "Missing document_name"}, status=status.HTTP_400_BAD_REQUEST)

    # Construct full path of the file on the server
    file_path = os.path.join(settings.MEDIA_ROOT, 'downloaded_docs', document_name)

    if not os.path.exists(file_path):
        return Response({"error": "Document not found on server"}, status=status.HTTP_404_NOT_FOUND)

    # Open the existing file and create DownloadedReports entry
    with open(file_path, 'rb') as f:
        django_file = File(f)
        # Create a record of the download
        DownloadedReports.objects.create(
            user=user,
            document=django_file,
            downloaded_at=timezone.now()
        )
    
    return Response({"message": "Download recorded successfully"}, status=status.HTTP_201_CREATED)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser])
def save_document(request):
    """
    Save downloaded tax document to database with user details and actual file
    """
    try:
        user = request.user
        
        # Debug logging to check user authentication
        logger.info(f"User authenticated: {user.is_authenticated}")
        logger.info(f"User ID: {user.id}")
        logger.info(f"User username: {user.username}")
        logger.info(f"User email: {user.email}")
        
        if not user.is_authenticated:
            return Response({
                'success': False,
                'error': 'User not authenticated'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        # Get the document file
        document_file = request.FILES.get('document')
        
        if not document_file:
            return Response({
                'success': False,
                'error': 'No document file provided'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Log document file details
        logger.info(f"Document file received: {document_file.name}")
        logger.info(f"Document file size: {document_file.size} bytes")
        logger.info(f"Document file type: {document_file.content_type}")
        
        # Get metadata from FormData to extract user details from taxation form
        metadata_json = request.data.get('metadata')
        if not metadata_json:
            return Response({
                'success': False,
                'error': 'Missing metadata'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Parse metadata JSON
        try:
            metadata = json.loads(metadata_json)
        except json.JSONDecodeError:
            return Response({
                'success': False,
                'error': 'Invalid metadata format'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Get user details from the taxation form data
        content = metadata.get('content', {})
        user_details = content.get('userDetails', {})
        
        # Get full name from taxation form
        full_name = user_details.get('fullName')
        if not full_name:
            # Fallback to user's first/last name or username
            full_name = getattr(user, 'first_name', '') + ' ' + getattr(user, 'last_name', '').strip()
            if not full_name.strip():
                full_name = user.username
        
        # Get email from user model (since it's required for authentication)
        user_email = user.email
        if not user_email:
            return Response({
                'success': False,
                'error': 'User email not found'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Create DownloadedReports entry with user details and actual document file
        downloaded_report = DownloadedReports.objects.create(
            user_id=user.id,  # Store user ID
            username=user.username,  # Store username
            email=user_email,  # Store email from user model
            document=document_file,  # Store the actual document file
            downloaded_at=timezone.now()
        )
        
        # Log the successful save with all details
        logger.info(f"Document saved successfully:")
        logger.info(f"  - User ID: {downloaded_report.user_id}")
        logger.info(f"  - Username: {downloaded_report.username}")
        logger.info(f"  - Email: {downloaded_report.email}")
        logger.info(f"  - Document: {downloaded_report.document.name}")
        logger.info(f"  - Document size: {downloaded_report.document.size} bytes")
        logger.info(f"  - Document path: {downloaded_report.document.path if downloaded_report.document else 'No path'}")
        logger.info(f"  - Downloaded at: {downloaded_report.downloaded_at}")
        
        return Response({
            'success': True,
            'message': 'Document saved and downloaded successfully',
            'document_id': downloaded_report.id,
            'user_id': user.id,  # Get user ID from user object
            'username': downloaded_report.username,
            'email': user_email,
            'document_name': document_file.name,
            'document_size': document_file.size,
            'downloaded_at': downloaded_report.downloaded_at.isoformat()
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        logger.error(f"Error saving document: {str(e)}")
        logger.error(f"Exception type: {type(e).__name__}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_details(request, user_id):
    """
    Get user details and downloaded reports by user ID
    """
    try:
        from django.contrib.auth.models import User
        
        # Get user details
        user = User.objects.get(id=user_id)
        
        # Get all downloaded reports for this user using user_id matching
        downloaded_reports = DownloadedReports.objects.filter(user_id=user_id).order_by('-downloaded_at')
        
        user_data = {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'date_joined': user.date_joined.isoformat(),
            'is_active': user.is_active,
            'downloaded_reports_count': downloaded_reports.count(),
            'downloaded_reports': []
        }
        
        # Add downloaded reports data
        for report in downloaded_reports:
            user_data['downloaded_reports'].append({
                'id': report.id,
                'user_id': report.user_id,
                'username': report.username,
                'email': report.email,
                'document_name': report.document.name if report.document else None,
                'document_size': report.document.size if report.document else None,
                'downloaded_at': report.downloaded_at.isoformat(),
                'document_url': report.document.url if report.document else None
            })
        
        return Response({
            'success': True,
            'user': user_data
        }, status=status.HTTP_200_OK)
        
    except User.DoesNotExist:
        return Response({
            'success': False,
            'error': 'User not found'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error(f"Error getting user details: {str(e)}")
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_orphaned_reports(request):
    """
    Get reports that don't have a matching user (for debugging)
    """
    try:
        from django.contrib.auth.models import User
        
        # Get all downloaded reports
        all_reports = DownloadedReports.objects.all()
        orphaned_reports = []
        
        for report in all_reports:
            # Check if user exists with this user_id
            if report.user_id:
                try:
                    User.objects.get(id=report.user_id)
                except User.DoesNotExist:
                    orphaned_reports.append(report)
            else:
                # Report has no user_id assigned
                orphaned_reports.append(report)
        
        reports_data = []
        for report in orphaned_reports:
            reports_data.append({
                'id': report.id,
                'user_id': report.user_id,
                'username': report.username,
                'email': report.email,
                'document_name': report.document.name if report.document else None,
                'downloaded_at': report.downloaded_at.isoformat(),
            })
        
        return Response({
            'success': True,
            'orphaned_reports_count': len(orphaned_reports),
            'orphaned_reports': reports_data
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Error getting orphaned reports: {str(e)}")
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
def test_gemini_analysis(request):
    """Test endpoint to verify Gemini API integration for document analysis"""
    try:
        test_text = request.data.get('text', '')
        if not test_text:
            return Response({
                'success': False,
                'error': 'No test text provided'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Initialize processor
        processor = DocumentProcessor()
        
        # Test both basic and Gemini analysis
        basic_result = processor.analyze_document(test_text)
        gemini_result = processor.analyze_document_with_gemini(test_text)
        
        basic_data = json.loads(basic_result)
        gemini_data = json.loads(gemini_result)
        
        return Response({
            'success': True,
            'test_text': test_text[:200] + '...' if len(test_text) > 200 else test_text,
            'basic_analysis': basic_data,
            'gemini_analysis': gemini_data,
            'comparison': {
                'basic_income_items': len(basic_data.get('income_items', [])),
                'gemini_income_items': len(gemini_data.get('income_items', [])),
                'basic_deductions': len(basic_data.get('deductions', [])),
                'gemini_deductions': len(gemini_data.get('deductions', [])),
                'improvement': len(gemini_data.get('income_items', [])) > len(basic_data.get('income_items', [])) or 
                              len(gemini_data.get('deductions', [])) > len(basic_data.get('deductions', []))
            }
        })

    except Exception as e:
        logger.error(f"Error testing Gemini analysis: {str(e)}")
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
