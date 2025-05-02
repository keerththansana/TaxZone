from rest_framework.decorators import api_view, authentication_classes, permission_classes, parser_classes # type: ignore
from rest_framework.response import Response # type: ignore
from rest_framework import status # type: ignore
from django.db import connection # type: ignore
from decimal import Decimal
import logging
from rest_framework.parsers import MultiPartParser, FormParser # type: ignore
from .models import TaxDocument
from .serializers import TaxDocumentSerializer
import PyPDF2 # type: ignore
import io

logger = logging.getLogger(__name__)

def table_exists(cursor, table_name):
    cursor.execute("""
        SELECT COUNT(*)
        FROM information_schema.tables
        WHERE table_schema = DATABASE()
        AND table_name = %s
    """, [table_name])
    return cursor.fetchone()[0] > 0

def calculate_annual_equivalent(period, amount, tax):
    """Calculate annual equivalent for monthly/quarterly amounts"""
    if isinstance(amount, str):
        amount = Decimal(amount)
    if isinstance(tax, str):
        tax = Decimal(tax)
        
    multiplier = {
        'monthly': 12,
        'quarterly': 4,
        'annually': 1
    }.get(period, 1)

    return {
        'gross_income': float(amount * multiplier),
        'total_tax': float(tax * multiplier)
    }

@api_view(['POST'])
@authentication_classes([])
@permission_classes([])
def calculate_tax(request):
    try:
        data = request.data
        tax_year = data.get('taxYear', '2024/2025')
        tax_type = data.get('taxType', '').lower()
        period = data.get('period', '').lower()
        amount = Decimal(str(data.get('amount', 0)))
        business_type = data.get('businessType')

        # Convert tax_type to match table name format
        tax_type_mapping = {
            'capital_gains': 'capital_gain',  # Fix for capital gains table name
            'professional': 'professional',
            'business': 'business',
            'employment': 'employment',
            'rental': 'rental',
            'dividend': 'dividend',
            'interest': 'interest',
            'royalty': 'royalty',
            'pension': 'pension',
            'foreign': 'foreign'
        }

        # Get correct table name prefix
        table_type = tax_type_mapping.get(tax_type, tax_type)
        
        # Determine year suffix based on selected tax year
        year_suffix = "_2024" if tax_year == '2024/2025' else "_2025"
        
        # Construct table name
        table_name = f"{table_type}_tax_rates{year_suffix}"

        # Verify table exists
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT COUNT(*) 
                FROM information_schema.tables 
                WHERE table_name = %s
            """, [table_name])
            
            if cursor.fetchone()[0] == 0:
                raise Exception(f"Tax table {table_name} for {tax_year} not found")

            # Rest of your calculation logic...
            # Update the query to handle tables with and without is_flat_rate column
            with connection.cursor() as cursor:
                # First check if is_flat_rate column exists
                cursor.execute("""
                    SELECT COUNT(*) 
                    FROM information_schema.columns 
                    WHERE table_name = %s 
                    AND column_name = 'is_flat_rate'
                """, [table_name])
                
                has_flat_rate = cursor.fetchone()[0] > 0

                # Modify query based on column existence
                if has_flat_rate:
                    query = f"""
                        SELECT rate, bracket_limit, relief_amount, is_flat_rate
                        FROM {table_name}
                        WHERE period_type = %s
                        AND is_active = TRUE
                    """
                else:
                    query = f"""
                        SELECT rate, bracket_limit, relief_amount, FALSE as is_flat_rate
                        FROM {table_name}
                        WHERE period_type = %s
                        AND is_active = TRUE
                    """
                
                params = [period]
                
                if tax_type == 'business' and business_type:
                    query += " AND business_type = %s"
                    params.append(business_type)
                
                query += " ORDER BY bracket_order"
                
                cursor.execute(query, params)
                rates = cursor.fetchall()

                if not rates:
                    raise Exception(f"No tax rates found for {tax_type} in {tax_year}")

                # Calculate tax using the fetched rates
                gross_income = amount
                total_tax = Decimal('0')
                brackets = []

                # Get relief amount if applicable
                relief_amount = rates[0][2] if rates[0][2] else Decimal('0')
                
                # Calculate taxable income after relief
                taxable_income = max(gross_income - relief_amount, Decimal('0'))

                # Calculate tax based on brackets
                remaining_income = taxable_income
                cumulative_limit = Decimal('0')

                for rate, bracket_limit, _, is_flat_rate in rates:
                    rate = Decimal(str(rate))
                    bracket_limit = Decimal(str(bracket_limit))

                    if is_flat_rate:
                        tax_amount = taxable_income * (rate / Decimal('100'))
                        brackets.append({
                            'rate': float(rate),
                            'limit': float(bracket_limit),
                            'taxable_amount': float(taxable_income),
                            'tax_amount': float(tax_amount),
                            'cumulative_limit': float(cumulative_limit)
                        })
                        total_tax = tax_amount
                        break
                    else:
                        taxable_amount = min(remaining_income, bracket_limit)
                        if taxable_amount > 0:
                            tax_amount = taxable_amount * (rate / Decimal('100'))
                            brackets.append({
                                'rate': float(rate),
                                'limit': float(bracket_limit),
                                'taxable_amount': float(taxable_amount),
                                'tax_amount': float(tax_amount),
                                'cumulative_limit': float(cumulative_limit)
                            })
                            total_tax += tax_amount
                            remaining_income -= taxable_amount
                            cumulative_limit += bracket_limit

                        if remaining_income <= 0:
                            break

                # Prepare response with both gross and taxable income
                return Response({
                    'tax_year': tax_year,
                    'gross_income': float(gross_income),
                    'relief_amount': float(relief_amount),
                    'taxable_income': float(taxable_income),
                    'total_tax': float(total_tax),
                    'brackets': brackets,
                    'period': period,
                    'tax_type': tax_type,
                    'business_type': business_type if tax_type == 'business' else None,
                    'success': True
                })

    except Exception as e:
        logger.error(f"Tax calculation error: {str(e)}")
        return Response({
            'error': str(e),
            'success': False
        }, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@parser_classes([MultiPartParser, FormParser])
def upload_document(request):
    try:
        serializer = TaxDocumentSerializer(data=request.data)
        if serializer.is_valid():
            # Save the document
            document = serializer.save()
            
            # Extract text from PDF
            pdf_file = document.file
            pdf_reader = PyPDF2.PdfReader(pdf_file)
            text_content = ""
            
            # Extract text from each page
            for page in pdf_reader.pages:
                text_content += page.extract_text() + "\n"
            
            # Save extracted text
            document.content = text_content
            document.save()
            
            return Response({
                'message': 'Document uploaded successfully',
                'document': serializer.data
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response({
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
def list_documents(request):
    documents = TaxDocument.objects.all()
    serializer = TaxDocumentSerializer(documents, many=True)
    return Response(serializer.data)

@api_view(['POST'])
@authentication_classes([])
@permission_classes([])
def calculate_rental_tax(request):
    try:
        data = request.data
        tax_year = data.get('taxYear', '2024/2025')
        period = data.get('period', '').lower()
        amount = Decimal(str(data.get('amount', 0)))
        year = tax_year.split('/')[0]

        with connection.cursor() as cursor:
            # Get rental relief rate
            cursor.execute("""
                SELECT parameter_value 
                FROM rental_tax_parameters_%s 
                WHERE parameter_name = 'rental_relief_rate'
                AND is_active = TRUE
            """, [year])
            
            relief_rate = cursor.fetchone()[0]
            relief_amount = amount * (relief_rate / Decimal('100'))
            taxable_income = amount - relief_amount

            # Get tax rates with corrected column names
            cursor.execute("""
                SELECT rate, bracket_limit, relief_amount, is_flat_rate
                FROM rental_tax_rates_%s 
                WHERE period_type = %s 
                AND is_active = TRUE 
                ORDER BY bracket_order
            """, [year, period])

            rates = cursor.fetchall()
            
            # Calculate tax using brackets
            total_tax = Decimal('0')
            brackets = []
            remaining_income = taxable_income

            for rate, bracket_limit, relief, is_flat in rates:
                rate = Decimal(str(rate))
                bracket_limit = Decimal(str(bracket_limit))
                
                taxable_amount = min(remaining_income, bracket_limit)
                if taxable_amount > 0:
                    tax_amount = taxable_amount * (rate / Decimal('100'))
                    brackets.append({
                        'rate': float(rate),
                        'taxable_amount': float(taxable_amount),
                        'tax_amount': float(tax_amount)
                    })
                    total_tax += tax_amount
                    remaining_income -= taxable_amount

            return Response({
                'gross_income': float(amount),
                'relief_rate': float(relief_rate),
                'relief_amount': float(relief_amount),
                'taxable_income': float(taxable_income),
                'total_tax': float(total_tax),
                'brackets': brackets,
                'success': True
            })

    except Exception as e:
        logger.error(f"Rental tax calculation error: {str(e)}")
        return Response({
            'error': str(e),
            'success': False
        }, status=status.HTTP_400_BAD_REQUEST)