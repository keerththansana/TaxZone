import os
from langchain.vectorstores import FAISS # type: ignore
from langchain.text_splitter import RecursiveCharacterTextSplitter # type: ignore
from langchain_google_genai import GoogleGenerativeAIEmbeddings # type: ignore
import google.generativeai as genai # type: ignore
from dotenv import load_dotenv # type: ignore
import logging
from django.db import connection # type: ignore

logger = logging.getLogger(__name__)
load_dotenv()

GOOGLE_API_KEY = os.getenv('GEMINI_API_KEY')
genai.configure(api_key=GOOGLE_API_KEY)

# Define the folder containing PDFs
PDF_FOLDER = "pdfs"  # Change this to your actual folder path

# ✅ Step 1: Load and Process PDFs
def load_and_process_pdfs(pdf_folder):
    all_documents = []
    
    for file in os.listdir(pdf_folder):
        if file.endswith(".pdf"):
            pdf_path = os.path.join(pdf_folder, file)
            loader = PyPDFLoader(pdf_path) # type: ignore
            documents = loader.load()

            # Debugging: Print a sample of the document text
            for i, doc in enumerate(documents):
                words = doc.page_content.split()  # Split text into words
                sample_words = ' '.join(words[:500])  # Get first 500 words
                print(f"📄 {file} - Document {i+1} (First 500 words):\n{sample_words}\n{'-'*80}")
            
            
            # Split document into smaller chunks
            text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
            all_documents.extend(text_splitter.split_documents(documents))

    return all_documents

# ✅ Step 2: Use Google Gemini for Embeddings
def create_faiss_index():
    docs = load_and_process_pdfs(PDF_FOLDER)

    # Create embeddings for the documents
    embedding_model = GoogleGenerativeAIEmbeddings(model="models/embedding-001", google_api_key=GOOGLE_API_KEY)
    
    # Create FAISS Vector Store
    vector_store = FAISS.from_documents(docs, embedding_model)
    
    # Save FAISS index to disk for future use
    vector_store.save_local("faiss_index")

    print("FAISS index created and saved.")

def get_response_from_documents(query, vector_store):
    """Get response from document search"""
    try:
        results = vector_store.similarity_search_with_score(query, k=3)
        contexts = []
        for doc, score in results:
            if score < 0.8:  # Threshold for relevance
                source = doc.metadata.get("source", "Unknown")
                contexts.append(f"From {source}:\n{doc.page_content}")
        return "\n\n".join(contexts) if contexts else None
    except Exception as e:
        logger.error(f"Error searching documents: {e}")
        return None

def get_gemini_response(query, context=None):
    """Get response from Gemini API"""
    try:
        api_key = os.getenv('GEMINI_API_KEY')
        if not api_key:
            return None
            
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel('gemini-pro')
        
        prompt = f"""Question: {query}

        {f'Context from tax documents: {context}' if context else 'Please answer based on general tax knowledge.'}

        Please provide a clear and accurate response."""
        
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        logger.error(f"Error getting Gemini response: {e}")
        return None

def get_document_content():
    """Fetch all document content from database"""
    try:
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT id, title, pdf_file 
                FROM tax_documents 
                WHERE pdf_file IS NOT NULL AND LENGTH(pdf_file) > 0
            """)
            return cursor.fetchall()
    except Exception as e:
        logger.error(f"Database error: {e}")
        return None

def initialize_vector_store():
    """Initialize vector store with documents"""
    try:
        api_key = os.getenv('GEMINI_API_KEY')
        if not api_key:
            logger.error("Gemini API key not found")
            return None
            
        # Configure embeddings
        embedding_model = GoogleGenerativeAIEmbeddings(
            model="models/embedding-001",
            google_api_key=api_key
        )

        # Get documents
        documents = get_document_content()
        if not documents:
            logger.warning("No documents found in database")
            return None

        # Process documents
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200
        )
        
        texts = []
        metadatas = []
        
        for doc_id, title, content in documents:
            if content:
                chunks = text_splitter.split_text(content)
                texts.extend(chunks)
                metadatas.extend([{
                    "source": title,
                    "doc_id": doc_id
                }] * len(chunks))

        if not texts:
            logger.warning("No content to process")
            return None

        # Create vector store
        vector_store = FAISS.from_texts(
            texts=texts,
            embedding=embedding_model,
            metadatas=metadatas
        )
        
        return vector_store

    except Exception as e:
        logger.error(f"Vector store error: {e}")
        return None

# Run this function only once to initialize the FAISS index
if __name__ == "__main__":
    create_faiss_index()
