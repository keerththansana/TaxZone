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
        # Ensure session exists
        if not request.session.session_key:
            request.session.create()
        
        # Handle file upload
        if 'file' not in request.FILES:
            return Response({
                'success': False,
                'error': 'No file provided'
            }, status=status.HTTP_400_BAD_REQUEST)

        uploaded_file = request.FILES['file']
        processor = TaxFormDocumentProcessor()
        
        try:
            # Process and store document
            document = processor.process_document(uploaded_file, request.session.session_key)
            
            if not document:
                logger.error("Document processing failed")
                return Response({
                    'success': False,
                    'error': 'Failed to process document'
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

            # Create document response data
            document_data = {
                'doc_id': document['id'],  # Changed to dictionary access
                'filename': uploaded_file.name,
                'upload_date': timezone.now().isoformat(),
                'file_type': uploaded_file.content_type
            }

            # Store document reference in session
            documents = request.session.get('tax_documents', [])
            documents.append(document_data)
            request.session['tax_documents'] = documents
            request.session.modified = True

            return Response({
                'success': True,
                'document': document_data
            }, status=status.HTTP_200_OK)

        except Exception as process_error:
            logger.error(f"Document processing error: {str(process_error)}")
            return Response({
                'success': False,
                'error': 'Document processing failed'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

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
        if not request.session.session_key:
            return Response({
                'error': 'No active session'
            }, status=status.HTTP_400_BAD_REQUEST)

        session_id = request.session.session_key
        doc = TaxFormDocument.objects.filter(id=doc_id, session_id=session_id).first()
        
        if doc:
            doc.delete()
            return Response({
                'success': True,
                'message': 'Document removed successfully'
            })
        else:
            return Response({
                'error': 'Document not found'
            }, status=status.HTTP_404_NOT_FOUND)

    except Exception as e:
        logger.error(f"Error removing document: {e}")
        return Response({
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
def view_document(request, doc_id):
    try:
        # Get the document from session
        documents = request.session.get('tax_documents', [])
        document = next((doc for doc in documents if doc['doc_id'] == doc_id), None)
        
        if not document:
            raise Http404('Document not found')

        # Construct the full file path
        file_path = os.path.join(settings.MEDIA_ROOT, 'tax_documents', 
                                request.session.session_key, document['stored_filename'])
        
        if not os.path.exists(file_path):
            raise Http404('File not found')

        # Open and return the file
        file = open(file_path, 'rb')
        response = FileResponse(file)
        
        # Set content type based on file extension
        content_type = document.get('file_type', 'application/octet-stream')
        response['Content-Type'] = content_type
        
        # Set content disposition to display in browser
        response['Content-Disposition'] = f'inline; filename="{document["filename"]}"'
        
        return response

    except Exception as e:
        logger.error(f"Error viewing document: {str(e)}")
        raise Http404('Error viewing document')

@api_view(['POST'])
async def analyze_document(request, doc_id):
    try:
        document = TaxFormDocument.objects.get(id=doc_id)
        processor = DocumentProcessor()
        
        # Extract text from document
        text = processor.extract_text_from_document(document.file.path)
        
        # Analyze content using Gemini AI
        analysis_result = await processor.analyze_document(text)
        
        # Parse the JSON response
        analysis_data = json.loads(analysis_result)
        
        # Store analysis results
        document.analysis_results = analysis_data
        document.save()
        
        return Response({
            'success': True,
            'analysis': analysis_data
        })
    except Exception as e:
        return Response({
            'success': False,
            'error': str(e)
        }, status=500)

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
