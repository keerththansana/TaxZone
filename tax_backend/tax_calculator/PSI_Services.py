from decimal import Decimal
from .models import PersonalServiceTaxRate

class PersonalServiceTaxCalculator:
    def __init__(self, period, gross_income):
        self.period = period
        self.gross_income = Decimal(str(gross_income))
        self.tax_brackets = self._get_tax_brackets()

    def _get_tax_brackets(self):
        return PersonalServiceTaxRate.get_current_rates(self.period)

    def calculate(self):
        # Get relief amount
        first_bracket = self.tax_brackets.first()
        relief = first_bracket.relief_amount if first_bracket else Decimal('0')

        # Calculate taxable income
        taxable_income = max(Decimal('0'), self.gross_income - relief)
        remaining_income = taxable_income
        total_tax = Decimal('0')
        bracket_details = []
        cumulative_limit = Decimal('0')

        # Calculate tax for each bracket
        for bracket in self.tax_brackets:
            rate = bracket.rate / Decimal('100')
            limit = bracket.bracket_limit

            if remaining_income <= 0:
                taxable_in_bracket = Decimal('0')
                tax_in_bracket = Decimal('0')
            else:
                taxable_in_bracket = min(remaining_income, limit)
                tax_in_bracket = taxable_in_bracket * rate

            bracket_details.append({
                'rate': float(bracket.rate),
                'limit': float(bracket.bracket_limit),
                'taxable_amount': float(taxable_in_bracket),
                'tax_amount': float(tax_in_bracket),
                'cumulative_limit': float(cumulative_limit),
                'next_limit': float(cumulative_limit + limit)
            })

            total_tax += tax_in_bracket
            remaining_income -= taxable_in_bracket
            cumulative_limit += limit

        return {
            'gross_income': float(self.gross_income),
            'relief_amount': float(relief),
            'taxable_income': float(taxable_income),
            'total_tax': float(total_tax),
            'brackets': bracket_details,
            'period': self.period,
            'effective_rate': float((total_tax / self.gross_income * 100) if self.gross_income > 0 else Decimal('0'))
        }