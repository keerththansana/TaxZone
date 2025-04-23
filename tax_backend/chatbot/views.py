from rest_framework.decorators import api_view, authentication_classes, permission_classes, parser_classes # type: ignore
from rest_framework.parsers import MultiPartParser, FormParser # type: ignore
from rest_framework.response import Response # type: ignore
from rest_framework import status # type: ignore
from django.db import connection # type: ignore
from tax_calculator.models import TaxDocument
import google.generativeai as genai # type: ignore
import os
import re
from dotenv import load_dotenv # type: ignore
from langchain.text_splitter import RecursiveCharacterTextSplitter # type: ignore
from langchain_community.vectorstores import FAISS # type: ignore
from langchain.chains import RetrievalQA # type: ignore
from langchain_google_genai import ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings # type: ignore
import logging
import PyPDF2 # type: ignore
import io

logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()
GOOGLE_API_KEY = os.getenv('GEMINI_API_KEY')
if not GOOGLE_API_KEY:
    raise ValueError("GEMINI_API_KEY environment variable is not set")

# Initialize models and embeddings
embedding_model = GoogleGenerativeAIEmbeddings(
    model="models/embedding-001",
    google_api_key=GOOGLE_API_KEY
)

llm = ChatGoogleGenerativeAI(
    model="gemini-1.5-flash",
    google_api_key=GOOGLE_API_KEY,
    temperature=0.7,
)

# Set up FAISS paths
FAISS_INDEX_PATH = os.path.join(os.path.dirname(__file__), "faiss_index")
os.makedirs(FAISS_INDEX_PATH, exist_ok=True)

def initialize_vector_store():
    """Initialize vector store with documents from database"""
    try:
        # Get documents with content
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT id, title, pdf_file 
                FROM tax_documents 
                WHERE pdf_file IS NOT NULL AND pdf_file != ''
            """)
            documents = cursor.fetchall()

        if not documents:
            logger.warning("No documents found in database")
            return None

        texts = []
        metadatas = []
        
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200,
        )

        for doc_id, title, content in documents:
            if content:
                # Clean the content
                clean_content = content.replace('\x00', '').strip()
                if clean_content:
                    chunks = text_splitter.split_text(clean_content)
                    texts.extend(chunks)
                    metadatas.extend([{
                        "source": title or f"Document {doc_id}",
                        "doc_id": doc_id
                    }] * len(chunks))

        if not texts:
            logger.warning("No content found in documents")
            return None

        vector_store = FAISS.from_texts(
            texts=texts,
            embedding=embedding_model,
            metadatas=metadatas
        )
        
        # Save with allow_dangerous_deserialization
        vector_store.save_local(
            folder_path=FAISS_INDEX_PATH,
            allow_dangerous_deserialization=True
        )
        logger.info(f"Vector store initialized with {len(texts)} chunks from {len(documents)} documents")
        
        return vector_store

    except Exception as e:
        logger.error(f"Error initializing vector store: {e}")
        return None

def get_relevant_context(query):
    """Get relevant context from the vector store for a given query"""
    try:
        if os.path.exists(os.path.join(FAISS_INDEX_PATH, "index.faiss")):
            vector_store = FAISS.load_local(
                folder_path=FAISS_INDEX_PATH,
                embeddings=embedding_model,
                allow_dangerous_deserialization=True
            )
        else:
            vector_store = initialize_vector_store()
            
        if not vector_store:
            logger.warning("No vector store available")
            return get_fallback_context()
            
        results = vector_store.similarity_search_with_score(query, k=5)
        
        contexts = []
        for doc, score in results:
            if score < 0.8:  # Increased threshold for better matches
                source = doc.metadata.get("source", "Unknown")
                contexts.append(f"From {source}:\n{doc.page_content}")
        
        return "\n\n".join(contexts) if contexts else get_fallback_context()

    except Exception as e:
        logger.error(f"Error getting context: {e}")
        return get_fallback_context()

def get_fallback_context():
    """Get context directly from database if vector store fails"""
    try:
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT id, title, pdf_file 
                FROM tax_documents 
                WHERE pdf_file IS NOT NULL AND pdf_file != ''
                LIMIT 5
            """)
            documents = cursor.fetchall()

            context = ""
            for doc_id, title, content in documents:
                if content:
                    clean_content = content.replace('\x00', '').strip()
                    if clean_content:
                        context += f"\nDocument {title or f'Doc{doc_id}'}:\n{clean_content[:1000]}\n"

            return context

    except Exception as e:
        logger.error(f"Error getting fallback context: {e}")
        return ""

print("Initializing vector store with existing documents...")
initialize_vector_store()

SYSTEM_PROMPT = """You are a helpful tax assistant for the Sri Lankan tax system. 
Your role is to help users understand and calculate their taxes according to Sri Lankan tax regulations.
Provide clear, accurate, and helpful responses to tax-related queries.
Always maintain a professional and friendly tone.
If you're not sure about something, be honest and say so.
Base your responses on the provided context from official tax documents when available.

When answering questions:
1. First, check if the provided context contains relevant information
2. If the context is relevant, use it to provide accurate answers, citing the source document
3. If the context doesn't contain the information, use your general knowledge about Sri Lankan taxes
4. Always be clear about whether you're using information from specific documents or general knowledge"""

def format_response(response):
    if not response or not isinstance(response, str):
        return "I apologize, but I couldn't generate a proper response. Please try again."
        
    response = re.sub(r'^####\s+(.*?)$', r'<h4>\1</h4>', response, flags=re.MULTILINE)
    response = re.sub(r'^###\s+(.*?)$', r'<h3>\1</h3>', response, flags=re.MULTILINE)
    response = re.sub(r'^##\s+(.*?)$', r'<h2>\1</h2>', response, flags=re.MULTILINE)
    response = re.sub(r'^#\s+(.*?)$', r'<h1>\1</h1>', response, flags=re.MULTILINE)

    response = re.sub(r'\*\*(.*?)\*\*', r'<b>\1</b>', response)
    
    response = re.sub(r'\n- (.*?)(?=\n|$)', r'<li>\1</li>', response)
    response = re.sub(r'<li>(.*?)</li>(?=<li>)', r'</ul>\n<li>\1</li>', response)
    response = re.sub(r'<li>(.*?)</li>', r'<ul>\n<li>\1</li></ul>', response)
    
    response = re.sub(r'\[(.*?)\]\((.*?)\)', r'<a href="\2" style="color: #007bff; text-decoration: none;">\1</a>', response)
    
    response = re.sub(r'\s*<li>', '<li>', response)
    response = re.sub(r'</li>\s*', '</li>', response)
    response = re.sub(r'\s*</?[uo]l>\s*', lambda m: m.group().strip(), response)
    
    return response

@api_view(['POST'])
@authentication_classes([])
@permission_classes([])
def chat(request):
    """Handle chat requests with document content"""
    try:
        query = request.data.get('query')
        if not query:
            return Response({
                'error': 'Query is required',
                'success': False
            }, status=status.HTTP_400_BAD_REQUEST)

        # Get relevant context using vector store
        context = get_relevant_context(query)
        
        if not context:
            logger.warning("No relevant context found for query")
            # Fallback to direct database query
            with connection.cursor() as cursor:
                cursor.execute("""
                    SELECT id, title, pdf_file 
                    FROM tax_documents 
                    WHERE pdf_file IS NOT NULL AND pdf_file != ''
                """)
                documents = cursor.fetchall()

                if not documents:
                    return Response({
                        'error': 'No document content available',
                        'success': False
                    }, status=status.HTTP_404_NOT_FOUND)

                context = ""
                for doc_id, title, content in documents:
                    if content:
                        # Clean and format the content
                        clean_content = content.replace('\x00', '').strip()
                        if clean_content:
                            context += f"\nDocument {title or f'Doc{doc_id}'}:\n{clean_content}\n"

        if not context.strip():
            return Response({
                'error': 'No readable content found in documents',
                'success': False
            }, status=status.HTTP_404_NOT_FOUND)

        # Configure Gemini
        api_key = os.getenv('GEMINI_API_KEY')  # Updated to match your env variable
        if not api_key:
            return Response({
                'error': 'API key not configured',
                'success': False
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        genai.configure(api_key=api_key)
        model = genai.GenerativeModel('gemini-1.5-flash')

        # Create prompt with context
        prompt = f"""{SYSTEM_PROMPT}

        Context from tax documents:
        {context}

        Question: {query}

        Please provide a detailed answer using only the information from these tax documents.
        If specific rates, amounts, or rules are mentioned, include them.
        If the information isn't in the documents, clearly state that.
        """

        # Generate response
        response = model.generate_content(prompt)
        formatted_response = format_response(response.text)

        return Response({
            'response': formatted_response,
            'success': True,
            'has_context': bool(context)
        })

    except Exception as e:
        logger.error(f"Chat error: {str(e)}")
        return Response({
            'error': str(e),
            'debug_info': {
                'exception_type': type(e).__name__,
                'message': str(e)
            },
            'success': False
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@authentication_classes([])  # No authentication required
@permission_classes([])      # No permissions required
def test_documents(request):
    """Test endpoint to verify document retrieval"""
    try:
        documents = TaxDocument.objects.all()
        doc_list = []
        
        for doc in documents:
            doc_list.append({
                'id': doc.id,
                'title': doc.title or f"Document {doc.id}",
                'has_content': bool(doc.pdf_file),  # Changed from content to pdf_file
                'content_preview': doc.pdf_file[:100] if doc.pdf_file else None,
                'uploaded_at': doc.uploaded_at.isoformat() if doc.uploaded_at else None
            })
        
        return Response({
            'document_count': len(doc_list),
            'documents': doc_list,
            'success': True
        })
    except Exception as e:
        logger.error(f"Test endpoint error: {str(e)}")
        return Response({
            'error': str(e),
            'success': False
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@authentication_classes([])
@permission_classes([])
def check_documents(request):
    """Debug endpoint to check document availability"""
    try:
        documents = TaxDocument.objects.all()
        doc_list = []
        
        for doc in documents:
            doc_list.append({
                'id': doc.id,
                'title': doc.title or f"Document {doc.id}",
                'has_content': bool(doc.content),
                'content_preview': doc.content[:100] if doc.content else None,
                'uploaded_at': doc.uploaded_at.isoformat() if doc.uploaded_at else None
            })
        
        return Response({
            'total_documents': len(doc_list),
            'documents': doc_list
        })
        
    except Exception as e:
        logger.error(f"Document check error: {str(e)}")
        return Response({
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@parser_classes([MultiPartParser, FormParser])
def upload_document(request):
    try:
        if 'file' not in request.FILES:
            return Response({
                'error': 'No file provided',
                'success': False
            }, status=status.HTTP_400_BAD_REQUEST)

        file = request.FILES['file']
        title = request.POST.get('title', file.name)

        # Extract text content from PDF
        try:
            # Save file temporarily
            temp_file = io.BytesIO(file.read())
            pdf_reader = PyPDF2.PdfReader(temp_file)
            
            text_content = []
            for page in pdf_reader.pages:
                extracted_text = page.extract_text()
                if extracted_text:
                    text_content.append(extracted_text)
            
            content = '\n'.join(text_content)
            
            if not content.strip():
                return Response({
                    'error': 'No text content could be extracted from PDF',
                    'success': False
                }, status=status.HTTP_400_BAD_REQUEST)

            # Save to database
            document = TaxDocument.objects.create(
                title=title,
                pdf_file=content
            )

            # Reinitialize vector store
            initialize_vector_store()

            return Response({
                'message': 'Document uploaded successfully',
                'id': document.id,
                'title': document.title,
                'content_preview': content[:100] if content else None,
                'success': True
            }, status=status.HTTP_201_CREATED)

        except Exception as e:
            logger.error(f"PDF extraction error: {str(e)}")
            return Response({
                'error': f'Failed to extract PDF content: {str(e)}',
                'success': False
            }, status=status.HTTP_400_BAD_REQUEST)

    except Exception as e:
        logger.error(f"Upload error: {str(e)}")
        return Response({
            'error': str(e),
            'success': False
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
def list_documents(request):
    """List all uploaded documents"""
    try:
        documents = TaxDocument.objects.all()
        serializer = TaxDocumentSerializer(documents, many=True) # type: ignore
        return Response({
            'documents': serializer.data,
            'success': True
        })
    except Exception as e:
        logger.error(f"List documents error: {str(e)}")
        return Response({
            'error': str(e),
            'success': False
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
def verify_db_connection(request):
    """Verify database connection and table structure"""
    try:
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT COUNT(*) 
                FROM tax_documents
            """)
            count = cursor.fetchone()[0]
            
            cursor.execute("""
                DESCRIBE tax_documents
            """)
            columns = cursor.fetchall()
            
            return Response({
                'table_exists': True,
                'document_count': count,
                'columns': [col[0] for col in columns],
                'success': True
            })
    except Exception as e:
        return Response({
            'error': str(e),
            'success': False
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
def test_routing(request):
    """Test endpoint to verify routing"""
    return Response({
        'message': 'Routing is working',
        'success': True
    })

@api_view(['GET'])
def debug_documents(request):
    """Debug endpoint to check document content"""
    try:
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT id, title, LEFT(pdf_file, 100) as preview
                FROM tax_documents
                WHERE pdf_file IS NOT NULL
            """)
            rows = cursor.fetchall()

        documents = [
            {
                'id': row[0],
                'title': row[1],
                'preview': row[2]
            }
            for row in rows
        ]

        return Response({
            'document_count': len(documents),
            'documents': documents,
            'success': True
        })

    except Exception as e:
        logger.error(f"Debug error: {str(e)}")
        return Response({
            'error': str(e),
            'success': False
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
