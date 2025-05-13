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
        
        # Save vector store without problematic parameter
        try:
            vector_store.save_local(FAISS_INDEX_PATH)
            logger.info(f"Vector store initialized with {len(texts)} chunks from {len(documents)} documents")
        except Exception as save_error:
            logger.warning(f"Could not save vector store: {save_error}")
        
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
                embeddings=embedding_model
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
    response = re.sub(r'<li>(.*?)</li>(?=<li>)', r'</ul>\n<li>\1></li>', response)
    response = re.sub(r'<li>(.*?)</li>', r'<ul>\n<li>\1</li></ul>', response)
    
    response = re.sub(r'\[(.*?)\]\((.*?)\)', r'<a href="\2" style="color: #007bff; text-decoration: none;">\1</a>', response)
    
    response = re.sub(r'\s*<li>', '<li>', response)
    response = re.sub(r'</li>\s*', '</li>', response)
    response = re.sub(r'\s*</?[uo]l>\s*', lambda m: m.group().strip(), response)
    
    return response

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

        # Extract text from PDF
        pdf_content = ''
        pdf_reader = PyPDF2.PdfReader(io.BytesIO(file.read()))
        for page in pdf_reader.pages:
            pdf_content += page.extract_text() + '\n'

        # Save to database
        document = TaxDocument.objects.create(
            title=title,
            pdf_file=pdf_content
        )

        # Reinitialize vector store
        initialize_vector_store()

        return Response({
            'message': 'Document uploaded successfully',
            'id': document.id,
            'title': document.title,
            'success': True
        })

    except Exception as e:
        return Response({
            'error': str(e),
            'success': False
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

def format_tax_response(doc_content, gemini_response=None):
    """Format the combined response from documents and Gemini"""
    try:
        formatted_response = ""
        
        if doc_content:
            formatted_response += "### Tax Information from Documents:\n\n"
            formatted_response += doc_content + "\n\n"
            
        if gemini_response:
            formatted_response += "### AI Assistant's Analysis:\n\n"
            formatted_response += gemini_response
            
        return formatted_response
    except Exception as e:
        logger.error(f"Error formatting response: {e}")
        return doc_content or gemini_response

def get_gemini_response(query, context):
    """Get response from Gemini API with improved formatting"""
    try:
        model = configure_gemini()
        if not model:
            return None

        prompt = f"""Act as an expert tax consultant for Sri Lanka. Analyze the query and context provided, then give a clear, well-structured response.

Question: {query}

Context from tax documents:
{context}

Please follow these formatting rules in your response:
1. Start with a brief, direct answer to the question
2. Use markdown formatting:
   - **Bold** for important terms and numbers
   - Use bullet points (•) for lists
   - Use ### for section headings
   - Use numbered lists for steps or procedures
3. Structure your response with these sections:
   ### Direct Answer
   [Provide immediate, concise answer]

   ### Details
   [Expand with relevant details]

   ### Additional Information
   [Include related context, exceptions, or deadlines]

   ### References
   [Mention specific laws or documents]

Remember to:
- Be precise with numbers and rates
- Highlight deadlines and important dates
- Explain any technical terms
- Format currency values consistently (e.g., LKR 100,000)
- Keep paragraphs short and focused
"""

        response = model.generate_content(prompt)
        return response.text if response else None

    except Exception as e:
        logger.error(f"Gemini API error: {e}")
        return None

def get_gemini_web_response(query):
    """Get concise, ChatGPT-style response from Gemini API with smart formatting"""
    try:
        model = configure_gemini()
        if not model:
            return None

        search_prompt = f"""Provide a clear and professionally formatted explanation of the following aspect of Sri Lankan tax regulations:

Query: {query}

Instructions for Response Formatting:

Overall Goal: Structure the response for maximum clarity and easy understanding, as if a professional consultant is explaining this.

Paragraphing:
- If the information naturally falls into distinct themes or stages, use **separate paragraphs** for each.
- Keep paragraphs focused on a single main idea.

Titles and Subtitles:
- If the query is broad and covers multiple sub-topics, use a **clear title** for the overall response.
- Employ **subtitles** to introduce and organize different sections or aspects of the explanation.

Bullet Points and Numbered Lists:
- Use **bullet points** to present lists of related items, such as different tax rates, categories, or requirements.
- Use **numbered lists** if the information involves a sequence or steps.

Tone: Maintain a natural, conversational yet authoritative tone.

Content Integration: Seamlessly weave in specific facts, figures, and relevant legal references.

Source Citation: Conclude with a clear and concise source citation. If the information is structured with titles or bullet points, the citation can appear at the end of the entire response.

Example of Desired Flexibility:

**Scenario 1 (Simple Explanation):**
"The current **Value Added Tax (VAT) rate** in Sri Lanka is **15%**, effective from **January 1, 2024**. This applies to most goods and services, and businesses with a turnover exceeding a certain threshold are required to register for VAT. (Source: Inland Revenue Department Circular No. X of 2024)"

**Scenario 2 (Explanation with Sub-topics):**
"**Value Added Tax (VAT) in Sri Lanka**

**Current Rate:**
The standard **VAT rate** is **15%**, implemented on **January 1, 2024**.

**Registration Threshold:**
Businesses with an annual taxable turnover exceeding **LKR 12 million** are obligated to register for VAT.

**Filing Frequency:**
VAT returns are typically required to be filed on a **monthly basis**.

(Source: Inland Revenue Act No. 24 of 2017 and subsequent amendments)"

Now, address the following query about Sri Lankan tax regulations: {query}
"""

        response = model.generate_content(search_prompt)
        if response and response.text:
            cleaned_response = response.text.strip()
            return cleaned_response

        return None

    except Exception as e:
        logger.error(f"Gemini web search error: {e}")
        return None
    except Exception as e:
        logger.error(f"Gemini web search error: {e}")
        return None

    except Exception as e:
        logger.error(f"Gemini web search error: {e}")
        return None

@api_view(['POST'])
def chat(request):
    """Chat endpoint using Gemini web search"""
    try:
        query = request.data.get('query')
        if not query:
            return Response({
                'error': 'Query is required',
                'success': False
            }, status=400)

        # Get response from Gemini
        response = get_gemini_web_response(query)
        
        if not response:
            return Response({
                'error': 'No response available',
                'success': False
            }, status=500)

        return Response({
            'response': response,
            'success': True
        })

    except Exception as e:
        logger.error(f"Chat endpoint error: {e}")
        return Response({
            'error': str(e),
            'success': False
        }, status=500)

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

def get_response_from_documents(query, vector_store):
    """Get relevant content with brief summary"""
    try:
        results = vector_store.similarity_search_with_score(query, k=3)
        if results:
            relevant_docs = [doc for doc, score in results if score < 0.8]
            if relevant_docs:
                model = configure_gemini()
                if model:
                    analysis_prompt = f"""Create a brief, focused answer from this tax document content:

Content: {[doc.page_content for doc in relevant_docs]}
Query: {query}

Requirements:
1. Give a SINGLE focused paragraph (2-3 lines)
2. Use **bold** for key terms and numbers
3. Add source at the end in parentheses
4. Include ONLY direct facts from documents
5. Exclude general advice or additional context
6. Do not include 'Key Tax Information' or 'Additional Information' sections
7. If no relevant answer found, return None"""

                    response = model.generate_content(analysis_prompt)
                    if response and "None" not in response.text:
                        return response.text.strip()

        return None

    except Exception as e:
        logger.error(f"Error in document response: {e}")
        return None

@api_view(['POST'])
def test_chat(request):
    """Test endpoint to verify Gemini API and document search"""
    try:
        query = request.data.get('query')
        if not query:
            return Response({
                'error': 'Query is required',
                'success': False
            }, status=400)

        # Test document search
        vector_store = initialize_vector_store()
        doc_response = None
        if vector_store:
            doc_response = get_response_from_documents(query, vector_store)
            logger.info(f"Document search result: {'Found' if doc_response else 'Not found'}")

        # Test Gemini API
        try:
            genai.configure(api_key=GOOGLE_API_KEY)
            model = genai.GenerativeModel('gemini-pro')
            test_prompt = f"Test query: {query}"
            gemini_response = model.generate_content(test_prompt)
            gemini_working = bool(gemini_response.text)
        except Exception as e:
            logger.error(f"Gemini API test failed: {e}")
            gemini_working = False

        return Response({
            'success': True,
            'query': query,
            'document_search': {
                'working': bool(vector_store),
                'found_content': bool(doc_response),
                'content': doc_response
            },
            'gemini_api': {
                'working': gemini_working,
                'test_response': gemini_response.text if gemini_working else None
            }
        })

    except Exception as e:
        logger.error(f"Test endpoint error: {e}")
        return Response({
            'error': str(e),
            'success': False
        }, status=500)

import os
import google.generativeai as genai # type: ignore
from dotenv import load_dotenv # type: ignore
import logging

logger = logging.getLogger(__name__)
load_dotenv()

def configure_gemini():
    """Configure Gemini API with safety settings"""
    try:
        api_key = os.getenv('GEMINI_API_KEY')
        if not api_key:
            raise ValueError("Gemini API key not found")
            
        genai.configure(api_key=api_key)
        
        generation_config = {
            "temperature": 0.7,
            "top_p": 0.8,
            "top_k": 40,
            "max_output_tokens": 2048,
        }

        # Using Gemini 1.5 Flash model
        model = genai.GenerativeModel(
            model_name="gemini-1.5-flash",  # Updated to use 1.5 Flash
            generation_config=generation_config
        )
        
        # Test the model
        test_response = model.generate_content("Test")
        if not test_response:
            raise ValueError("Model test failed")
            
        logger.info("Gemini 1.5 Flash model configured successfully")
        return model

    except Exception as e:
        logger.error(f"Gemini configuration error: {e}")
        return None

@api_view(['POST'])
def test_gemini(request):
    """Test endpoint for Gemini API"""
    try:
        model = configure_gemini()
        if not model:
            return Response({
                'error': 'Failed to configure Gemini API',
                'success': False
            }, status=500)

        query = request.data.get('query', 'Test query')
        
        response = model.generate_content(query)
        
        if response and hasattr(response, 'text'):
            return Response({
                'success': True,
                'response': response.text
            })
        else:
            return Response({
                'error': 'No response generated',
                'success': False
            }, status=500)

    except Exception as e:
        logger.error(f"Test endpoint error: {str(e)}")
        return Response({
            'error': str(e),
            'success': False
        }, status=500)

@api_view(['GET'])
def debug_gemini(request):
    """Debug endpoint to check Gemini configuration"""
    try:
        api_key = os.getenv('GEMINI_API_KEY')
        models = genai.list_models()
        model_names = [m.name for m in models]
        
        return Response({
            'api_key_present': bool(api_key),
            'api_key_length': len(api_key) if api_key else 0,
            'available_models': model_names
        })

    except Exception as e:
        logger.error(f"Debug Gemini error: {str(e)}")
        return Response({
            'error': str(e),
            'success': False
        }, status=500)