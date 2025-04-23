import os
import re
import warnings
from pdfminer import pdfdocument # type: ignore
from langchain_community.vectorstores import FAISS # type: ignore
from langchain.text_splitter import RecursiveCharacterTextSplitter # type: ignore
from langchain_community.document_loaders import PyPDFLoader # type: ignore
from langchain_google_genai import GoogleGenerativeAIEmbeddings # type: ignore
from dotenv import load_dotenv # type: ignore
import pdfplumber # type: ignore
from langchain_core.documents import Document # type: ignore

# Suppress warnings
warnings.filterwarnings("ignore", category=UserWarning)
load_dotenv()

PDF_FOLDER = "pdfs"

def extract_tax_tables(pdf_path):
    """Specialized extractor for tax tables"""
    tables = []
    try:
        with pdfplumber.open(pdf_path) as pdf:
            for page in pdf.pages:
                # Extract both tables and surrounding text
                text = page.extract_text()
                table = page.extract_table()
                
                if table:
                    # Clean table data
                    cleaned_table = []
                    for row in table:
                        cleaned_row = [str(cell).strip() if cell is not None else "" for cell in row]
                        cleaned_table.append(" | ".join(cleaned_row))
                    table_str = "TAX TABLE:\n" + "\n".join(cleaned_table)
                    tables.append(table_str)
                
                if text:
                    # Extract tax formulas using regex
                    tax_formulas = re.findall(r'\(.*?%.*?\)', text)
                    if tax_formulas:
                        tables.append("TAX FORMULAS:\n" + "\n".join(tax_formulas))
                        
    except Exception as e:
        print(f"Table extraction error in {pdf_path}: {str(e)}")
    return tables

def load_and_process_pdfs(pdf_folder):
    documents = []
    
    for file in os.listdir(pdf_folder):
        if file.endswith(".pdf"):
            pdf_path = os.path.join(pdf_folder, file)
            
            # 1. Extract tables and formulas first
            tax_data = extract_tax_tables(pdf_path)
            if tax_data:
                documents.append(Document(
                    page_content="\n\n".join(tax_data),
                    metadata={"source": file, "type": "tax_tables"}
                ))
            
            # 2. Process regular text with improved splitting
            loader = PyPDFLoader(pdf_path)
            pages = loader.load()
            
            # Special handling for tax documents
            text_splitter = RecursiveCharacterTextSplitter(
                chunk_size=1500,
                chunk_overlap=300,
                separators=["\n\nTax-on-tax", "\n\nExample", "\n•", "\n"]
            )
            
            for page in pages:
                # Clean page content
                page_content = re.sub(r'\s+', ' ', page.page_content).strip()
                if len(page_content) > 100:  # Ignore empty/short pages
                    chunks = text_splitter.split_documents([Document(
                        page_content=page_content,
                        metadata={"source": file, "type": "text"}
                    )])
                    documents.extend(chunks)
    
    print(f"Processed {len(documents)} document chunks")
    return documents

def create_faiss_index():
    docs = load_and_process_pdfs(PDF_FOLDER)
    
    if not docs:
        raise ValueError("No valid documents processed!")
    
    # Verify content
    print("Sample document content:")
    print(docs[0].page_content[:500] + "...")
    
    embedding_model = GoogleGenerativeAIEmbeddings(
        model="models/embedding-001",
        google_api_key=os.getenv("gemini_key")
    )
    
    vector_store = FAISS.from_documents(docs, embedding_model)
    vector_store.save_local("faiss_index")
    print("FAISS index created with tax tables and text content.")

if __name__ == "__main__":
    create_faiss_index()