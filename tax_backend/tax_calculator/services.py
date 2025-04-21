from decimal import Decimal
from django.utils import timezone # type: ignore
from django.db import connection # type: ignore
from . import models

class TaxCalculationService:
    TAX_RATE_MODELS = {
        'employment': models.EmploymentTaxRate,
        'professional': models.ProfessionalTaxRate,
        'business': models.BusinessTaxRate,
        'investment': models.InvestmentTaxRate,
        'rental': models.RentalTaxRate,
        'dividend': models.DividendTaxRate,
        'interest': models.InterestTaxRate,
        'royalty': models.RoyaltyTaxRate,
        'pension': models.PensionTaxRate,
        'capital_gains': models.CapitalGainsTaxRate,
    }

    ANNUAL_ONLY_TYPES = ['dividend', 'interest', 'capital_gains']

    def __init__(self, tax_type, period, gross_income):
        if tax_type not in self.TAX_RATE_MODELS:
            raise ValueError(f"Invalid tax type: {tax_type}")
        
        if period not in ['monthly', 'quarterly', 'annually']:
            raise ValueError(f"Invalid period: {period}")
            
        if tax_type in self.ANNUAL_ONLY_TYPES and period != 'annually':
            raise ValueError(f"{tax_type} tax can only be calculated annually")

        self.tax_type = tax_type
        self.period = period
        self.gross_income = Decimal(str(gross_income))

    def get_tax_brackets(self):
        # Using raw SQL to ensure fresh data
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT tr.rate, tr.bracket_limit, tr.relief_amount, 
                       tr.bracket_order, tr.is_active
                FROM tax_rates tr
                JOIN income_types it ON tr.income_type_id = it.id
                JOIN tax_periods tp ON tr.period_id = tp.id
                WHERE it.type_code = %s
                AND tp.period_code = %s
                AND tr.is_active = 1
                AND tr.effective_from <= CURRENT_DATE
                AND (tr.effective_to IS NULL OR tr.effective_to >= CURRENT_DATE)
                ORDER BY tr.bracket_order
            """, [self.tax_type, self.period])
            
            brackets = []
            for row in cursor.fetchall():
                brackets.append({
                    'rate': row[0],
                    'bracket_limit': row[1],
                    'relief_amount': row[2],
                    'bracket_order': row[3],
                    'is_active': row[4]
                })

            if not brackets:
                raise ValueError(f"No active tax rates found for {self.tax_type} - {self.period}")

            return brackets

    def calculate(self):
        try:
            tax_brackets = self.get_tax_brackets()
            relief = tax_brackets[0].get('relief_amount') or Decimal('0')
            
            # Calculate taxable income
            taxable_income = max(Decimal('0'), self.gross_income - relief)
            remaining_income = taxable_income
            total_tax = Decimal('0')
            bracket_details = []
            cumulative_limit = Decimal('0')

            for bracket in tax_brackets:
                rate = Decimal(str(bracket['rate'])) / Decimal('100')
                limit = Decimal(str(bracket['bracket_limit']))

                if remaining_income <= 0:
                    taxable_in_bracket = Decimal('0')
                    tax_in_bracket = Decimal('0')
                else:
                    taxable_in_bracket = min(remaining_income, limit)
                    tax_in_bracket = taxable_in_bracket * rate

                bracket_details.append({
                    'rate': float(bracket['rate']),
                    'limit': float(limit),
                    'taxable_amount': float(taxable_in_bracket),
                    'tax_amount': float(tax_in_bracket),
                    'cumulative_limit': float(cumulative_limit),
                    'next_limit': float(cumulative_limit + limit)
                })

                total_tax += tax_in_bracket
                remaining_income -= taxable_in_bracket
                cumulative_limit += limit

            return {
                'period': self.period,
                'tax_type': self.tax_type,
                'gross_income': float(self.gross_income),
                'relief_amount': float(relief),
                'taxable_income': float(taxable_income),
                'total_tax': float(total_tax),
                'brackets': bracket_details,
                'effective_rate': float((total_tax / self.gross_income * 100) if self.gross_income > 0 else Decimal('0'))
            }
        except Exception as e:
            raise ValueError(f"Error calculating tax: {str(e)}")