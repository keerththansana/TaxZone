import os
import pytest
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase
from ..services.document_processor import DocumentProcessor

class TestDocumentProcessor:
    @pytest.fixture
    def document_processor(self):
        return DocumentProcessor()

    @pytest.mark.asyncio
    async def test_document_analysis(self, document_processor, tmp_path):
        # Create a sample test file
        test_content = """
        APIT Statement
        Employee: John Doe
        TIN: 123456789
        Period: 2024-01-01 to 2024-03-31
        
        Salary: LKR 150,000.00
        APIT Deduction: LKR 15,000.00
        EPF Contribution: LKR 12,000.00
        Net Salary: LKR 123,000.00
        """
        
        test_file = tmp_path / "test_doc.txt"
        test_file.write_text(test_content)

        # Extract and analyze the document
        extracted_text = document_processor.extract_text_from_document(str(test_file))
        analysis_result = await document_processor.analyze_document(extracted_text)

        # Verify the results
        assert analysis_result is not None
        assert "document_type" in analysis_result
        assert "amounts" in analysis_result
        assert "tax_terms" in analysis_result
        assert "categories" in analysis_result
        assert "form_mappings" in analysis_result

        print("Analysis Result:", analysis_result)