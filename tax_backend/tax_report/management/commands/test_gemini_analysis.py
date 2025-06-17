from django.core.management.base import BaseCommand
from tax_report.services.document_processor import DocumentProcessor
import json

class Command(BaseCommand):
    help = 'Test Gemini API integration for document analysis'

    def add_arguments(self, parser):
        parser.add_argument('--text', type=str, help='Test text to analyze')
        parser.add_argument('--file', type=str, help='Test file to analyze')

    def handle(self, *args, **options):
        processor = DocumentProcessor()
        
        # Test text
        test_text = options.get('text') or """
        APIT Statement for January 2024
        Employee: John Doe
        TIN: 123456789
        
        Basic Salary: 150,000.00
        Allowances: 25,000.00
        APIT Deduction: 15,000.00
        EPF Contribution: 12,000.00
        
        Interest Income from Bank: 5,000.00
        Dividend Income: 3,000.00
        WHT on Interest: 500.00
        
        Rental Income: 20,000.00
        Service Income: 10,000.00
        WHT on Service: 1,000.00
        """
        
        self.stdout.write('Testing Gemini API integration...')
        self.stdout.write('=' * 50)
        
        try:
            # Test basic analysis
            self.stdout.write('1. Running basic analysis...')
            basic_result = processor.analyze_document(test_text)
            basic_data = json.loads(basic_result)
            
            self.stdout.write(f'   Basic analysis found:')
            self.stdout.write(f'   - {len(basic_data.get("income_items", []))} income items')
            self.stdout.write(f'   - {len(basic_data.get("deductions", []))} deductions')
            
            # Test Gemini analysis
            self.stdout.write('\n2. Running Gemini-enhanced analysis...')
            gemini_result = processor.analyze_document_with_gemini(test_text)
            gemini_data = json.loads(gemini_result)
            
            self.stdout.write(f'   Gemini analysis found:')
            self.stdout.write(f'   - {len(gemini_data.get("income_items", []))} income items')
            self.stdout.write(f'   - {len(gemini_data.get("deductions", []))} deductions')
            
            # Compare results
            self.stdout.write('\n3. Comparison:')
            basic_income_count = len(basic_data.get("income_items", []))
            gemini_income_count = len(gemini_data.get("income_items", []))
            basic_deduction_count = len(basic_data.get("deductions", []))
            gemini_deduction_count = len(gemini_data.get("deductions", []))
            
            self.stdout.write(f'   Income items: {basic_income_count} → {gemini_income_count}')
            self.stdout.write(f'   Deductions: {basic_deduction_count} → {gemini_deduction_count}')
            
            if gemini_income_count > basic_income_count or gemini_deduction_count > basic_deduction_count:
                self.stdout.write(self.style.SUCCESS('   ✓ Gemini analysis found more items!'))
            else:
                self.stdout.write(self.style.WARNING('   ⚠ Gemini analysis found same or fewer items'))
            
            # Show detailed results
            self.stdout.write('\n4. Detailed Gemini Results:')
            for item in gemini_data.get("income_items", []):
                self.stdout.write(f'   Income: {item.get("category")} - {item.get("type")} - {item.get("description")} - Rs. {item.get("amount")}')
            
            for deduction in gemini_data.get("deductions", []):
                self.stdout.write(f'   Deduction: {deduction.get("category")} - {deduction.get("type")} - {deduction.get("description")} - Rs. {deduction.get("amount")}')
            
            self.stdout.write(self.style.SUCCESS('\n✓ Gemini API integration test completed successfully!'))
            
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'\n✗ Error during testing: {str(e)}'))
            self.stdout.write('Falling back to basic analysis...') 