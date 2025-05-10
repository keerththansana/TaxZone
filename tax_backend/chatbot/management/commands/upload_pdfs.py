from django.core.management.base import BaseCommand # type: ignore
from django.db import connection # type: ignore
import os
import PyPDF2 # type: ignore
import logging

logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = 'Upload PDFs from a directory to the tax_documents table'

    def handle(self, *args, **options):
        # Define the PDF directory path correctly
        pdf_dir = os.path.join(
            os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
            'pdfs'
        )
        
        self.stdout.write(f"Looking for PDFs in: {pdf_dir}")

        if not os.path.exists(pdf_dir):
            self.stdout.write(
                self.style.ERROR(f'Directory not found: {pdf_dir}')
            )
            return

        # First, drop the existing table and recreate it
        try:
            with connection.cursor() as cursor:
                # Drop existing table
                cursor.execute("DROP TABLE IF EXISTS tax_documents")
                
                # Create new table
                cursor.execute("""
                    CREATE TABLE tax_documents (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        title VARCHAR(255),
                        pdf_file LONGTEXT,
                        uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
                """)
                connection.commit()
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Failed to create table: {str(e)}')
            )
            return

        # Process PDF files
        try:
            pdf_files = [f for f in os.listdir(pdf_dir) if f.endswith('.pdf')]
            if not pdf_files:
                self.stdout.write(
                    self.style.WARNING('No PDF files found in directory')
                )
                return

            for filename in pdf_files:
                file_path = os.path.join(pdf_dir, filename)
                
                try:
                    # Extract text from PDF
                    with open(file_path, 'rb') as file:
                        pdf_reader = PyPDF2.PdfReader(file)
                        pdf_content = ''
                        for page in pdf_reader.pages:
                            pdf_content += page.extract_text() + '\n'

                    # Clean the content
                    pdf_content = pdf_content.replace('\x00', '').strip()
                    
                    # Insert into database without checking for duplicates
                    with connection.cursor() as cursor:
                        cursor.execute("""
                            INSERT INTO tax_documents (title, pdf_file)
                            VALUES (%s, %s)
                        """, [filename, pdf_content])
                        connection.commit()
                    
                    self.stdout.write(
                        self.style.SUCCESS(f'Successfully uploaded {filename}')
                    )
                
                except Exception as e:
                    self.stdout.write(
                        self.style.ERROR(f'Failed to process {filename}: {str(e)}')
                    )
                    
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Error: {str(e)}')
            )