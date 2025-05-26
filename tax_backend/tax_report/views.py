from django.shortcuts import render
import logging
from rest_framework import status
from rest_framework.response import Response
from rest_framework.decorators import api_view, parser_classes
from rest_framework.parsers import MultiPartParser, FormParser, FileUploadParser
from django.core.files.storage import default_storage
from django.conf import settings
from django.http import FileResponse, Http404
from django.utils import timezone
import os
import mimetypes
import json
import uuid

from .models import TaxFormDocument
from .services.document_processor import TaxFormDocumentProcessor, DocumentProcessor

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
        
        # Analyze the document synchronously
        analysis_result = processor.analyze_document(extracted_text)
        
        # Update document with analysis results
        document['analyzed'] = True
        document['analysis'] = json.loads(analysis_result)
        request.session.modified = True

        return Response({
            'success': True,
            'analysis': json.loads(analysis_result)
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
        
        # Process the document
        processor = DocumentProcessor()
        extracted_text = processor.extract_text_from_document(full_path)
        analysis_result = processor.analyze_document(extracted_text)
        
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

@api_view(['POST'])
def process_auto_fill(request):
    try:
        analysis_data = request.data.get('analysisResults')
        if not analysis_data:
            return Response({
                'success': False,
                'error': 'No analysis data provided'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Process the analysis results
        mapped_data = {}
        for result in analysis_data:
            if 'analysis' in result:
                # Process income items
                for item in result['analysis'].get('income_items', []):
                    form_type = determine_form_type(item['category'])
                    if form_type:
                        if form_type not in mapped_data:
                            mapped_data[form_type] = {'income': {}}
                        mapped_data[form_type]['income'][item['category']] = item['amount']

                # Process deductions
                for deduction in result['analysis'].get('deductions', []):
                    form_type = determine_form_type(deduction['type'])
                    if form_type:
                        if form_type not in mapped_data:
                            mapped_data[form_type] = {'deductions': {}}
                        mapped_data[form_type]['deductions'][deduction['type']] = deduction['amount']

        return Response({
            'success': True,
            'data': mapped_data
        })

    except Exception as e:
        logger.error(f"Error in auto-fill process: {str(e)}")
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

def determine_form_type(item_type):
    form_mapping = {
        'APIT': 'EmploymentIncome',
        'SALARY': 'EmploymentIncome',
        # Add more mappings as needed
    }
    return form_mapping.get(item_type)
