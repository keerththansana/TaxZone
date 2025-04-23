import os
from langchain.vectorstores import FAISS # type: ignore
from langchain.text_splitter import RecursiveCharacterTextSplitter # type: ignore
from langchain_google_genai import GoogleGenerativeAIEmbeddings # type: ignore
from dotenv import load_dotenv # type: ignore
import google.generativeai as genai # type: ignore
from tax_calculator.models import TaxDocument
import logging

logger = logging.getLogger(__name__)

# Load environment variables from .env file
load_dotenv()

# ✅ Configure Google Gemini API (Replace 'YOUR_API_KEY' with your actual key)

genai.configure(api_key=os.getenv("gemini_key"))

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
    embedding_model = GoogleGenerativeAIEmbeddings(model="models/embedding-001", google_api_key=os.getenv("gemini_key"))
    
    # Create FAISS Vector Store
    vector_store = FAISS.from_documents(docs, embedding_model)
    
    # Save FAISS index to disk for future use
    vector_store.save_local("faiss_index")

    print("FAISS index created and saved.")

def initialize_vector_store():
    """Initialize vector store with documents from database"""
    try:
        # Get documents from database
        documents = TaxDocument.objects.all()
        if not documents.exists():
            logger.warning("No documents found in database")
            return None

        logger.info(f"Found {documents.count()} documents in database")
        
        # Process documents
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200
        )
        
        texts = []
        metadatas = []
        
        # Process each document
        for doc in documents:
            if doc.content:
                chunks = text_splitter.split_text(doc.content)
                texts.extend(chunks)
                metadatas.extend([{
                    "source": doc.title or f"Document {doc.id}",
                    "doc_id": doc.id
                }] * len(chunks))

        if not texts:
            logger.warning("No content found in documents")
            return None

        # Create embeddings
        embedding_model = GoogleGenerativeAIEmbeddings(
            model="models/embedding-001",
            google_api_key=os.getenv("gemini_key")
        )

        # Create and save vector store
        vector_store = FAISS.from_texts(
            texts=texts,
            embedding=embedding_model,
            metadatas=metadatas
        )
        
        vector_store.save_local("faiss_index")
        logger.info("Vector store initialized successfully")
        return vector_store

    except Exception as e:
        logger.error(f"Error initializing vector store: {str(e)}")
        return None

# Run this function only once to initialize the FAISS index
if __name__ == "__main__":
    create_faiss_index()
