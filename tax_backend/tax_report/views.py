from django.shortcuts import render
from rest_framework import status
from rest_framework.response import Response
from rest_framework.decorators import api_view, parser_classes
from rest_framework.parsers import MultiPartParser, FormParser
import logging
from .models import TaxFormDocument
from .services.document_processor import TaxFormDocumentProcessor
from django.http import FileResponse, Http404
import os
import mimetypes

logger = logging.getLogger(__name__)

@api_view(['POST'])
@parser_classes([MultiPartParser, FormParser])
def upload_tax_form_document(request):
    try:
        if 'file' not in request.FILES:
            return Response({
                'error': 'No file provided'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Ensure session exists
        if not request.session.session_key:
            request.session.create()
        
        session_id = request.session.session_key
        file = request.FILES['file']

        # Create a copy of the file in memory
        from django.core.files.base import ContentFile
        file_copy = ContentFile(file.read())
        file_copy.name = file.name

        # Initialize processor and process document
        processor = TaxFormDocumentProcessor()
        result = processor.process_document(file_copy, session_id)
        
        if result:
            # Store document ID in session for persistence
            uploaded_files = request.session.get('tax_form_documents', [])
            uploaded_files.append(str(result['doc_id']))
            request.session['tax_form_documents'] = uploaded_files
            request.session.modified = True

            return Response({
                'success': True,
                'document': result
            })
        else:
            return Response({
                'success': False,
                'error': 'Failed to process document'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    except Exception as e:
        logger.error(f"Document upload error: {str(e)}")
        return Response({
            'error': 'File processing error'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    finally:
        # Ensure file handles are closed
        if 'file' in locals():
            file.close()
        if 'file_copy' in locals():
            file_copy.close()

@api_view(['GET'])
def get_session_documents(request):
    try:
        if not request.session.session_key:
            request.session.create()
            return Response({'documents': []})

        session_id = request.session.session_key
        docs = TaxFormDocument.objects.filter(session_id=session_id)
        
        return Response({
            'success': True,
            'documents': [{
                'id': str(doc.id),
                'filename': doc.original_filename,
                'uploaded_at': doc.uploaded_at,
                'file_url': f'/api/tax-report/view-document/{doc.id}/',
                'file_size': doc.file.size if doc.file else None
            } for doc in docs]
        })
    except Exception as e:
        logger.error(f"Error fetching session documents: {e}")
        return Response({
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

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
