from django.shortcuts import render
from rest_framework import status
from rest_framework.response import Response
from rest_framework.decorators import api_view, parser_classes
from rest_framework.parsers import MultiPartParser, FormParser, FileUploadParser
from django.core.files.storage import default_storage
from django.conf import settings
import os
import logging
import mimetypes
import json
from django.http import FileResponse, Http404
import uuid

from .models import TaxFormDocument
from .services.document_processor import TaxFormDocumentProcessor, DocumentProcessor

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
                'error': 'No file provided'
            }, status=status.HTTP_400_BAD_REQUEST)

        uploaded_file = request.FILES['file']
        processor = TaxFormDocumentProcessor()
        
        # Process and store document
        result = processor.process_document(uploaded_file, request.session.session_key)
        
        if not result:
            return Response({
                'error': 'Failed to process document'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        # Store document reference in session
        documents = request.session.get('tax_documents', [])
        documents.append(result)
        request.session['tax_documents'] = documents
        request.session.modified = True

        return Response({
            'success': True,
            'document': result
        })

    except Exception as e:
        logger.error(f"Upload error: {str(e)}")
        return Response({
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
def get_session_documents(request):
    try:
        documents = request.session.get('tax_documents', [])
        
        # Verify files still exist
        valid_documents = []
        for doc in documents:
            if default_storage.exists(doc['path']):
                valid_documents.append(doc)
        
        # Update session if any files were missing
        if len(valid_documents) != len(documents):
            request.session['tax_documents'] = valid_documents
            request.session.modified = True

        return Response(valid_documents)

    except Exception as e:
        logger.error(f"Error retrieving session documents: {str(e)}")
        return Response({'error': str(e)}, status=500)

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
        doc = TaxFormDocument.objects.get(id=doc_id)
        if not doc.file or not os.path.exists(doc.file.path):
            raise Http404("Document not found")

        # Get file extension and determine content type
        file_name = doc.original_filename
        extension = os.path.splitext(file_name)[1].lower()
        
        # Map file extensions to content types
        content_types = {
            '.pdf': 'application/pdf',
            '.doc': 'application/msword',
            '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            '.xls': 'application/vnd.ms-excel',
            '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            '.csv': 'text/csv',
            '.txt': 'text/plain',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.png': 'image/png'
        }
        
        # Get content type from mapping or fallback to mime type guess
        content_type = content_types.get(extension)
        if not content_type:
            content_type, _ = mimetypes.guess_type(file_name)
        if not content_type:
            content_type = 'application/octet-stream'

        # Open file and create response
        file_handle = open(doc.file.path, 'rb')
        response = FileResponse(file_handle)
        
        # Set response headers for inline display
        response['Content-Type'] = content_type
        # Force inline display instead of download
        response['Content-Disposition'] = f'inline; filename="{doc.original_filename}"'
        response['Access-Control-Allow-Origin'] = '*'  # Allow cross-origin access
        response['X-Content-Type-Options'] = 'nosniff'
        
        return response
            
    except TaxFormDocument.DoesNotExist:
        raise Http404("Document not found")
    except Exception as e:
        logger.error(f"Error viewing document: {str(e)}")
        return Response(
            {'error': 'Unable to retrieve document'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

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
