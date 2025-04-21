from django.core.management.base import BaseCommand # type: ignore
from django.utils import timezone # type: ignore
from tax_calculator import models
from decimal import Decimal

class Command(BaseCommand):
    help = 'Initialize tax rates for all income types'

    def handle(self, *args, **kwargs):
        # Employment and Professional Income Tax Rates
        self._create_progressive_rates(models.EmploymentTaxRate)
        self._create_progressive_rates(models.ProfessionalTaxRate)
        
        # Business Income Tax Rate (24%)
        self._create_flat_rate(models.BusinessTaxRate, 24)
        
        # Investment and Rental Income Tax Rate (18%)
        self._create_flat_rate(models.InvestmentTaxRate, 18)
        self._create_flat_rate(models.RentalTaxRate, 18)
        
        # Dividend, Interest, Royalty and Pension Income Tax Rate (14%)
        self._create_flat_rate(models.DividendTaxRate, 14)
        self._create_flat_rate(models.InterestTaxRate, 14)
        self._create_flat_rate(models.RoyaltyTaxRate, 14)
        self._create_flat_rate(models.PensionTaxRate, 14)
        
        # Capital Gains Tax Rate (10%)
        self._create_flat_rate(models.CapitalGainsTaxRate, 10)
        
        self.stdout.write(self.style.SUCCESS('Successfully initialized tax rates'))

    def _create_progressive_rates(self, model):
        # Progressive tax rates for Employment and Professional Income
        periods = {
            'annually': {'multiplier': 1, 'relief': Decimal('1800000')},
            'quarterly': {'multiplier': Decimal('0.25'), 'relief': Decimal('450000')},
            'monthly': {'multiplier': Decimal('1')/Decimal('12'), 'relief': Decimal('150000')}
        }

        for period, data in periods.items():
            base_amount = Decimal('1200000')
            brackets = [
                (1, 6, base_amount * data['multiplier']),
                (2, 12, base_amount * data['multiplier']),
                (3, 18, base_amount * data['multiplier']),
                (4, 24, base_amount * data['multiplier']),
                (5, 30, base_amount * data['multiplier']),
                (6, 36, Decimal('999999999.99'))
            ]

            for order, rate, limit in brackets:
                model.objects.create(
                    period_type=period,
                    bracket_order=order,
                    rate=rate,
                    bracket_limit=limit,
                    relief_amount=data['relief'] if order == 1 else None,
                    effective_from=timezone.now().date(),
                    is_active=True
                )

    def _create_flat_rate(self, model, rate):
        periods = {
            'annually': Decimal('1800000'),
            'quarterly': Decimal('450000'),
            'monthly': Decimal('150000')
        }

        for period, relief in periods.items():
            model.objects.create(
                period_type=period,
                bracket_order=1,
                rate=rate,
                bracket_limit=Decimal('999999999.99'),
                relief_amount=relief,
                effective_from=timezone.now().date(),
                is_active=True
            )