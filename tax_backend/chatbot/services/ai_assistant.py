from tax_calculator.models import TaxDocument
import google.generativeai as genai # type: ignore
from django.conf import settings # type: ignore
import logging

logger = logging.getLogger(__name__)

class TaxAssistantService:
    def __init__(self):
        genai.configure(api_key=settings.GEMINI_API_KEY)
        self.model = genai.GenerativeModel('gemini-pro')

    def get_document_context(self):
        """Fetch and format tax documents from database"""
        documents = TaxDocument.objects.all()
        context = []
        
        for doc in documents:
            if doc.content:
                context.append(f"""
                Document: {doc.title or 'Untitled'}
                Content:
                {doc.content}
                ---
                """)
        
        return "\n".join(context)

    def get_answer(self, question: str) -> dict:
        try:
            context = self.get_document_context()
            if not context:
                return {
                    "success": False,
                    "message": "No tax documents found in database"
                }

            prompt = f"""
            Based on these tax documents, please answer the following question:

            {context}

            Question: {question}

            Instructions:
            1. Only use information from the provided tax documents
            2. If the answer isn't in the documents, say so
            3. Be specific and cite the document source if possible
            """

            response = self.model.generate_content(prompt)
            
            return {
                "success": True,
                "answer": response.text,
                "source_count": TaxDocument.objects.count()
            }

        except Exception as e:
            logger.error(f"AI Assistant Error: {str(e)}")
            return {
                "success": False,
                "message": str(e)
            }