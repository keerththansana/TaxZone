from django.core.management.base import BaseCommand # type: ignore
from django.utils import timezone # type: ignore
from tax_calculator.models import IncomeType, TaxPeriod, TaxRate
from decimal import Decimal

class Command(BaseCommand):
    help = 'Initialize tax calculation data'

    def handle(self, *args, **kwargs):
        # Create Income Types
        income_types_data = [
            ('employment', 'Employment Income', True),
            ('professional', 'Professional Services Income', True),
            ('business', 'Business Income', True),
            ('investment', 'Investment Income', True),
            ('rental', 'Rental Income', True),
            ('dividend', 'Dividend Income', False),
            ('interest', 'Interest Income', False),
            ('royalty', 'Royalty Income', True),
            ('pension', 'Pension Income', True),
            ('capital_gains', 'Capital Gains', False),
        ]

        for code, name, has_period in income_types_data:
            IncomeType.objects.get_or_create(
                type_code=code,
                defaults={
                    'type_name': name,
                    'has_period': has_period
                }
            )

        # Create Tax Periods
        period_data = [
            ('monthly', 'Monthly'),
            ('quarterly', 'Quarterly'),
            ('annually', 'Annually'),
        ]

        for code, name in period_data:
            TaxPeriod.objects.get_or_create(
                period_code=code,
                defaults={'period_name': name}
            )

        # Create initial tax rates for Employment Income
        employment = IncomeType.objects.get(type_code='employment')
        annual_period = TaxPeriod.objects.get(period_code='annually')
        
        tax_brackets = [
            (1, Decimal('6.00'), Decimal('1200000.00'), Decimal('1800000.00')),
            (2, Decimal('12.00'), Decimal('1200000.00'), None),
            (3, Decimal('18.00'), Decimal('1200000.00'), None),
            (4, Decimal('24.00'), Decimal('1200000.00'), None),
            (5, Decimal('30.00'), Decimal('1200000.00'), None),
            (6, Decimal('36.00'), Decimal('999999999.99'), None),
        ]

        for order, rate, limit, relief in tax_brackets:
            TaxRate.objects.get_or_create(
                income_type=employment,
                period=annual_period,
                bracket_order=order,
                defaults={
                    'rate': rate,
                    'bracket_limit': limit,
                    'relief_amount': relief,
                    'effective_from': timezone.now().date(),
                    'is_active': True
                }
            )

        self.stdout.write(self.style.SUCCESS('Successfully initialized tax data'))

# Check income types
print(IncomeType.objects.count())

# Check periods
print(TaxPeriod.objects.count())

# Check tax rates
print(TaxRate.objects.count())