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
@authentication_classes([])  # No authentication required
@permission_classes([])      # No permissions required
def calculate_tax(request):
    try:
        tax_type = request.data.get('taxType', '').lower()
        period = request.data.get('period', 'annually').lower()
        amount = request.data.get('amount')

        # Validate input data
        if not tax_type or amount is None:
            return Response({
                'error': 'Tax type and amount are required'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Convert amount to Decimal safely
        try:
            amount = Decimal(str(amount))
            if amount < 0:
                raise ValueError("Amount cannot be negative")
        except (TypeError, ValueError, InvalidOperation) as e: # type: ignore
            return Response({
                'error': f'Invalid amount: {str(e)}'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Get table name based on tax type
        tax_table_mapping = {
            'employment': 'employment_tax_rates',
            'professional': 'professional_tax_rates',
            'business': 'business_tax_rates',
            'foreign': 'foreign_tax_rates',
            'rental': 'rental_tax_rates',
            'dividend': 'dividend_tax_rates',
            'interest': 'interest_tax_rates',
            'royalty': 'royalty_tax_rates',
            'pension': 'pension_tax_rates',  # Add this line
            'capital_gains': 'capital_gain_tax_rates'
        }
        
        table_name = tax_table_mapping.get(tax_type)
        if not table_name:
            return Response({
                'error': f'Tax type {tax_type} not supported'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Get tax rates from database
        with connection.cursor() as cursor:
            if tax_type == 'rental':
                # Get rental tax rates and parameters
                cursor.execute("""
                    SELECT p.rental_relief_percentage, p.wht_threshold, p.wht_rate, p.relief_amount,
                           r.rate, r.bracket_limit, r.bracket_order
                    FROM rental_tax_parameters p
                    JOIN rental_tax_rates r ON r.period_type = p.period_type
                    WHERE p.period_type = %s 
                    AND p.is_active = 1
                    AND r.is_active = 1
                    AND r.rate > 0
                    ORDER BY r.bracket_order
                """, [period])
                
                tax_data = cursor.fetchall()
                if not tax_data:
                    return Response({
                        'error': f'No tax rates found for rental income ({period})'
                    }, status=status.HTTP_400_BAD_REQUEST)

                # Extract parameters
                rental_relief_pct = Decimal(str(tax_data[0][0])) / Decimal('100')  # 25%
                wht_threshold = Decimal(str(tax_data[0][1]))  # WHT threshold
                wht_rate = Decimal(str(tax_data[0][2])) / Decimal('100')  # 10%
                relief_amount = Decimal(str(tax_data[0][3]))  # Period-specific relief

                # Calculate rental relief (25% of gross income)
                rental_relief = amount * rental_relief_pct
                net_rental_income = amount - rental_relief

                # Calculate WHT if applicable
                wht_applicable = amount > wht_threshold
                wht_amount = amount * wht_rate if wht_applicable else Decimal('0')

                # Calculate taxable income after reliefs
                taxable_income = max(Decimal('0'), net_rental_income - relief_amount)
                remaining_income = taxable_income
                total_tax = Decimal('0')
                bracket_details = []
                cumulative_limit = Decimal('0')

                # Calculate tax using progressive rates (matching employment income structure)
                for row in tax_data:
                    if remaining_income <= 0:
                        break

                    rate = Decimal(str(row[4])) / Decimal('100')  # Tax rate
                    limit = Decimal(str(row[5]))  # Bracket limit
                    
                    taxable_in_bracket = min(remaining_income, limit)
                    tax_in_bracket = taxable_in_bracket * rate

                    if rate > 0:  # Only include non-zero rate brackets
                        bracket_details.append({
                            'rate': float(row[4]),
                            'limit': float(limit),
                            'taxable_amount': float(taxable_in_bracket),
                            'tax_amount': float(tax_in_bracket),
                            'cumulative_limit': float(cumulative_limit),
                            'next_limit': float(cumulative_limit + limit)
                        })

                    total_tax += tax_in_bracket
                    remaining_income -= taxable_in_bracket
                    cumulative_limit += limit

                return Response({
                    'period': period,
                    'tax_type': tax_type,
                    'gross_income': float(amount),
                    'rental_relief': float(rental_relief),
                    'rental_relief_percentage': float(rental_relief_pct * 100),
                    'net_rental_income': float(net_rental_income),
                    'relief_amount': float(relief_amount),
                    'taxable_income': float(taxable_income),
                    'total_tax': float(total_tax),
                    'wht_applicable': wht_applicable,
                    'wht_threshold': float(wht_threshold),
                    'wht_rate': float(wht_rate * 100),
                    'wht_amount': float(wht_amount),
                    'brackets': bracket_details,
                    'effective_rate': float((total_tax / amount * 100) if amount > 0 else Decimal('0'))
                })
            elif tax_type == 'royalty':
                # Get royalty tax rates and relief amounts
                cursor.execute("""
                    SELECT rate, bracket_limit, bracket_order, relief_amount
                    FROM royalty_tax_rates 
                    WHERE period_type = %s 
                    AND is_active = 1 
                    ORDER BY bracket_order
                """, [period])

                rate_data = cursor.fetchall()
                if not rate_data:
                    return Response({
                        'error': 'No royalty tax rates found'
                    }, status=status.HTTP_400_BAD_REQUEST)

                # Initialize variables
                total_tax = Decimal('0')
                brackets = []
                remaining_income = amount
                cumulative_limit = Decimal('0')
                relief_amount = Decimal(str(rate_data[0][3])) if rate_data[0][3] else Decimal('0')
                
                # Calculate taxable income after relief
                taxable_income = max(Decimal('0'), amount - relief_amount)
                remaining_taxable = taxable_income

                # Calculate tax for each bracket
                for rate, bracket_limit, bracket_order, _ in rate_data:
                    rate = Decimal(str(rate)) / Decimal('100')
                    bracket_limit = Decimal(str(bracket_limit))
                    
                    if remaining_income <= 0:
                        break

                    # For the last bracket, use all remaining income
                    is_last_bracket = bracket_order == len(rate_data)
                    income_in_bracket = remaining_income if is_last_bracket else min(remaining_income, bracket_limit)
                    
                    # Calculate taxable amount
                    if bracket_order == 1:
                        taxable_in_bracket = max(Decimal('0'), income_in_bracket - relief_amount)
                    else:
                        taxable_in_bracket = income_in_bracket

                    tax_in_bracket = taxable_in_bracket * rate

                    if income_in_bracket > 0:
                        brackets.append({
                            'rate': float(rate * 100),
                            'limit': float(bracket_limit),
                            'taxable_amount': float(taxable_in_bracket),
                            'tax_amount': float(tax_in_bracket),
                            'cumulative_limit': float(cumulative_limit),
                            'next_limit': float(cumulative_limit + bracket_limit)
                        })

                    total_tax += tax_in_bracket
                    remaining_income -= income_in_bracket
                    cumulative_limit += bracket_limit

                return Response({
                    'tax_type': 'royalty',
                    'period': period,
                    'gross_income': float(amount),
                    'relief_amount': float(relief_amount),
                    'taxable_income': float(taxable_income),
                    'total_tax': float(total_tax),
                    'brackets': brackets
                })
            elif tax_type == 'pension':
                # Get pension tax rates and relief amounts
                cursor.execute("""
                    SELECT rate, bracket_limit, bracket_order, relief_amount
                    FROM pension_tax_rates 
                    WHERE period_type = %s 
                    AND is_active = 1 
                    ORDER BY bracket_order
                """, [period])

                rate_data = cursor.fetchall()
                if not rate_data:
                    return Response({
                        'error': 'No pension tax rates found'
                    }, status=status.HTTP_400_BAD_REQUEST)

                # Initialize variables
                total_tax = Decimal('0')
                brackets = []
                remaining_income = amount
                cumulative_limit = Decimal('0')
                relief_amount = Decimal(str(rate_data[0][3])) if rate_data[0][3] else Decimal('0')
                
                # Calculate taxable income after relief
                taxable_income = max(Decimal('0'), amount - relief_amount)
                remaining_taxable = taxable_income

                # Calculate tax for each bracket
                for rate, bracket_limit, bracket_order, _ in rate_data:
                    rate = Decimal(str(rate)) / Decimal('100')
                    bracket_limit = Decimal(str(bracket_limit))
                    
                    if remaining_income <= 0:
                        break

                    # For the last bracket, use all remaining income
                    is_last_bracket = bracket_order == len(rate_data)
                    income_in_bracket = remaining_income if is_last_bracket else min(remaining_income, bracket_limit)
                    
                    # Calculate taxable amount
                    if bracket_order == 1:
                        taxable_in_bracket = max(Decimal('0'), income_in_bracket - relief_amount)
                    else:
                        taxable_in_bracket = income_in_bracket

                    tax_in_bracket = taxable_in_bracket * rate

                    if income_in_bracket > 0:
                        brackets.append({
                            'rate': float(rate * 100),
                            'limit': float(bracket_limit),
                            'taxable_amount': float(taxable_in_bracket),
                            'tax_amount': float(tax_in_bracket),
                            'cumulative_limit': float(cumulative_limit),
                            'next_limit': float(cumulative_limit + bracket_limit)
                        })

                    total_tax += tax_in_bracket
                    remaining_income -= income_in_bracket
                    cumulative_limit += bracket_limit

                return Response({
                    'tax_type': 'pension',
                    'period': period,
                    'gross_income': float(amount),
                    'relief_amount': float(relief_amount),
                    'taxable_income': float(taxable_income),
                    'total_tax': float(total_tax),
                    'brackets': brackets
                })
            elif tax_type == 'dividend':
                # Get dividend tax rate
                cursor.execute("""
                    SELECT rate
                    FROM dividend_tax_rates 
                    WHERE is_active = 1
                    ORDER BY effective_from DESC
                    LIMIT 1
                """)
                
                rate_data = cursor.fetchone()
                if not rate_data:
                    return Response({
                        'error': 'No dividend tax rates found'
                    }, status=status.HTTP_400_BAD_REQUEST)

                # Calculate tax using flat rate
                rate = Decimal(str(rate_data[0])) / Decimal('100')
                total_tax = amount * rate
                
                bracket_details = [{
                    'rate': float(rate_data[0]),
                    'limit': float(amount),
                    'taxable_amount': float(amount),
                    'tax_amount': float(total_tax),
                    'cumulative_limit': 0,
                    'next_limit': float(amount)
                }]

                return Response({
                    'period': period,
                    'tax_type': tax_type,
                    'gross_income': float(amount),
                    'relief_amount': float(0),  # No relief for dividend income
                    'taxable_income': float(amount),
                    'total_tax': float(total_tax),
                    'brackets': bracket_details,
                    'effective_rate': float(rate_data[0])
                })
            elif tax_type == 'interest':
                # Get interest tax rates and parameters
                cursor.execute("""
                    SELECT rate, bracket_limit, relief_amount, wht_rate, exemption_limit
                    FROM interest_tax_rates 
                    WHERE period_type = %s
                    AND is_active = 1
                    ORDER BY effective_from DESC
                    LIMIT 1
                """, [period])
                
                rate_data = cursor.fetchone()
                if not rate_data:
                    return Response({
                        'error': 'No interest tax rates found'
                    }, status=status.HTTP_400_BAD_REQUEST)

                # Extract parameters
                rate = Decimal(str(rate_data[0])) / Decimal('100')
                bracket_limit = Decimal(str(rate_data[1]))
                relief_amount = Decimal(str(rate_data[2])) if rate_data[2] else Decimal('0')
                wht_rate = Decimal(str(rate_data[3])) / Decimal('100')
                exemption_limit = Decimal(str(rate_data[4]))

                # Calculate WHT if applicable
                wht_applicable = amount > exemption_limit
                wht_amount = amount * wht_rate if wht_applicable else Decimal('0')

                # Calculate taxable income after relief
                taxable_income = max(Decimal('0'), amount - relief_amount)
                total_tax = taxable_income * rate

                bracket_details = [{
                    'rate': float(rate_data[0]),
                    'limit': float(bracket_limit),
                    'taxable_amount': float(taxable_income),
                    'tax_amount': float(total_tax),
                    'cumulative_limit': 0,
                    'next_limit': float(bracket_limit)
                }]

                return Response({
                    'period': period,
                    'tax_type': tax_type,
                    'gross_income': float(amount),
                    'relief_amount': float(relief_amount),
                    'taxable_income': float(taxable_income),
                    'total_tax': float(total_tax),
                    'wht_applicable': wht_applicable,
                    'wht_threshold': float(exemption_limit),
                    'wht_rate': float(wht_rate * 100),
                    'wht_amount': float(wht_amount),
                    'brackets': bracket_details,
                    'effective_rate': float((total_tax / amount * 100) if amount > 0 else Decimal('0'))
                })
            elif tax_type == 'capital_gains':
                # Get capital gains tax rates
                cursor.execute("""
                    SELECT rate, bracket_limit, relief_amount, is_flat_rate
                    FROM capital_gain_tax_rates 
                    WHERE period_type = %s
                    AND is_active = 1
                    ORDER BY effective_from DESC
                    LIMIT 1
                """, [period])
                
                rate_data = cursor.fetchone()
                if not rate_data:
                    return Response({
                        'error': 'No capital gains tax rates found'
                    }, status=status.HTTP_400_BAD_REQUEST)

                # Extract parameters
                rate = Decimal(str(rate_data[0])) / Decimal('100')  # 15%
                bracket_limit = Decimal(str(rate_data[1]))
                relief_amount = Decimal(str(rate_data[2])) if rate_data[2] else Decimal('0')
                is_flat_rate = bool(rate_data[3])

                # Calculate taxable income
                taxable_income = max(Decimal('0'), amount - relief_amount)
                total_tax = taxable_income * rate

                bracket_details = [{
                    'rate': float(rate_data[0]),
                    'limit': float(bracket_limit),
                    'taxable_amount': float(taxable_income),
                    'tax_amount': float(total_tax),
                    'cumulative_limit': 0,
                    'next_limit': float(bracket_limit)
                }]

                return Response({
                    'period': period,
                    'tax_type': tax_type,
                    'gross_income': float(amount),
                    'relief_amount': float(relief_amount),
                    'taxable_income': float(taxable_income),
                    'total_tax': float(total_tax),
                    'is_flat_rate': is_flat_rate,
                    'brackets': bracket_details,
                    'effective_rate': float(rate_data[0])
                })
            else:
                # Get business type for business income or foreign type for foreign income
                business_type = request.data.get('businessType', 'general') if tax_type == 'business' else None
                foreign_type = request.data.get('foreignType', 'other') if tax_type == 'foreign' else None

                # Modify query based on tax type
                if tax_type in ['employment', 'professional']:
                    cursor.execute(f"""
                        SELECT rate, bracket_limit, COALESCE(relief_amount, 0) as relief_amount, bracket_order
                        FROM {table_name}
                        WHERE period_type = %s AND is_active = 1
                        ORDER BY bracket_order
                    """, [period])
                elif tax_type == 'business':
                    query = f"""
                        SELECT rate, bracket_limit, COALESCE(relief_amount, 0) as relief_amount, bracket_order, is_flat_rate
                        FROM {table_name}
                        WHERE period_type = %s AND is_active = 1 AND business_type = %s
                        ORDER BY bracket_order
                    """
                    cursor.execute(query, [period, business_type])
                elif tax_type == 'foreign':
                    query = f"""
                        SELECT rate, bracket_limit, COALESCE(relief_amount, 0) as relief_amount, bracket_order, is_flat_rate
                        FROM {table_name}
                        WHERE period_type = %s AND is_active = 1 AND foreign_type = %s
                        ORDER BY bracket_order
                    """
                    cursor.execute(query, [period, foreign_type])
                else:
                    cursor.execute(f"""
                        SELECT rate, bracket_limit, COALESCE(relief_amount, 0) as relief_amount, bracket_order, is_flat_rate
                        FROM {table_name}
                        WHERE period_type = %s AND is_active = 1
                        ORDER BY bracket_order
                    """, [period])
                
                tax_rates = cursor.fetchall()

                if not tax_rates:
                    return Response({
                        'error': f'No active tax rates found for {tax_type} ({period})'
                    }, status=status.HTTP_400_BAD_REQUEST)

                # For employment and professional income, always use progressive rates
                if tax_type in ['employment', 'professional']:
                    relief = Decimal(str(tax_rates[0][2]))  # Get relief amount
                    taxable_income = max(Decimal('0'), amount - relief)
                    remaining_income = taxable_income
                    total_tax = Decimal('0')
                    bracket_details = []
                    cumulative_limit = Decimal('0')

                    for rate, limit, _, _ in tax_rates:
                        if remaining_income <= 0:
                            break

                        rate = Decimal(str(rate)) / Decimal('100')
                        limit = Decimal(str(limit))
                        
                        taxable_in_bracket = min(remaining_income, limit)
                        tax_in_bracket = taxable_in_bracket * rate

                        bracket_details.append({
                            'rate': float(rate * 100),
                            'limit': float(limit),
                            'taxable_amount': float(taxable_in_bracket),
                            'tax_amount': float(tax_in_bracket),
                            'cumulative_limit': float(cumulative_limit),
                            'next_limit': float(cumulative_limit + limit)
                        })

                        total_tax += tax_in_bracket
                        remaining_income -= taxable_in_bracket
                        cumulative_limit += limit

                    return Response({
                        'period': period,
                        'tax_type': tax_type,
                        'gross_income': float(amount),
                        'relief_amount': float(relief),
                        'taxable_income': float(taxable_income),
                        'total_tax': float(total_tax),
                        'brackets': bracket_details,
                        'effective_rate': float((total_tax / amount * 100) if amount > 0 else Decimal('0'))
                    })
                # For flat rate taxes (special business type, remitted foreign income, or other flat rate taxes)
                elif len(tax_rates) == 1 or tax_rates[0][4] or (tax_type == 'business' and business_type == 'special') or (tax_type == 'foreign' and foreign_type == 'remitted'):
                    rate = Decimal(str(tax_rates[0][0])) / Decimal('100')
                    total_tax = amount * rate
                    relief_amount = Decimal(str(tax_rates[0][2])) if tax_rates[0][2] else Decimal('0')
                    
                    bracket_details = [{
                        'rate': float(tax_rates[0][0]),
                        'limit': float(tax_rates[0][1]),
                        'taxable_amount': float(amount),
                        'tax_amount': float(total_tax),
                        'cumulative_limit': 0,
                        'next_limit': float(tax_rates[0][1])
                    }]

                    return Response({
                        'period': period,
                        'tax_type': tax_type,
                        'business_type': business_type if tax_type == 'business' else None,
                        'foreign_type': foreign_type if tax_type == 'foreign' else None,
                        'gross_income': float(amount),
                        'relief_amount': float(relief_amount),
                        'taxable_income': float(amount),
                        'total_tax': float(total_tax),
                        'brackets': bracket_details,
                        'effective_rate': float(tax_rates[0][0])
                    })

                # For progressive tax rates
                relief = Decimal(str(tax_rates[0][2]))
                taxable_income = max(Decimal('0'), amount - relief)
                remaining_income = taxable_income
                total_tax = Decimal('0')
                bracket_details = []
                cumulative_limit = Decimal('0')

                for rate, limit, _, _, _ in tax_rates:
                    if remaining_income <= 0:
                        break

                    rate = Decimal(str(rate)) / Decimal('100')
                    limit = Decimal(str(limit))
                    
                    taxable_in_bracket = min(remaining_income, limit)
                    tax_in_bracket = taxable_in_bracket * rate

                    bracket_details.append({
                        'rate': float(rate * 100),
                        'limit': float(limit),
                        'taxable_amount': float(taxable_in_bracket),
                        'tax_amount': float(tax_in_bracket),
                        'cumulative_limit': float(cumulative_limit),
                        'next_limit': float(cumulative_limit + limit)
                    })

                    total_tax += tax_in_bracket
                    remaining_income -= taxable_in_bracket
                    cumulative_limit += limit

                return Response({
                    'period': period,
                    'tax_type': tax_type,
                    'business_type': business_type if tax_type == 'business' else None,
                    'foreign_type': foreign_type if tax_type == 'foreign' else None,
                    'gross_income': float(amount),
                    'relief_amount': float(relief),
                    'taxable_income': float(taxable_income),
                    'total_tax': float(total_tax),
                    'brackets': bracket_details,
                    'effective_rate': float((total_tax / amount * 100) if amount > 0 else Decimal('0'))
                })

    except Exception as e:
        logger.error(f"Error in tax calculation: {str(e)}")
        return Response({
            'error': f'Calculation error: {str(e)}'
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