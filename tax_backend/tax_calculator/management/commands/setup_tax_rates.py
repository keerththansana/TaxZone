from django.core.management.base import BaseCommand # type: ignore
from django.utils import timezone # type: ignore
from tax_calculator import models
from decimal import Decimal

class Command(BaseCommand):
    help = 'Setup initial tax rates for all income types'

    def handle(self, *args, **kwargs):
        current_date = timezone.now().date()
        
        # Employment and Professional Services tax rates
        for model in [models.EmploymentTaxRate, models.ProfessionalTaxRate]:
            self._create_progressive_tax_rates(model, current_date)

        # Business tax rates
        self._create_flat_tax_rates(models.BusinessTaxRate, 24, current_date)
        
        # Investment and Rental tax rates
        for model in [models.InvestmentTaxRate, models.RentalTaxRate]:
            self._create_flat_tax_rates(model, 18, current_date)
        
        # Dividend, Interest, Royalty, and Pension tax rates
        for model in [models.DividendTaxRate, models.InterestTaxRate, 
                     models.RoyaltyTaxRate, models.PensionTaxRate]:
            self._create_flat_tax_rates(model, 14, current_date)
        
        # Capital Gains tax rates
        self._create_flat_tax_rates(models.CapitalGainsTaxRate, 10, current_date)

    def _create_progressive_tax_rates(self, model, current_date):
        periods = {
            'annually': {'multiplier': 1, 'relief': Decimal('1800000.00')},
            'quarterly': {'multiplier': 0.25, 'relief': Decimal('450000.00')},
            'monthly': {'multiplier': 1/12, 'relief': Decimal('150000.00')}
        }

        for period, data in periods.items():
            brackets = [
                (1, 6, 1200000 * data['multiplier']),
                (2, 12, 1200000 * data['multiplier']),
                (3, 18, 1200000 * data['multiplier']),
                (4, 24, 1200000 * data['multiplier']),
                (5, 30, 1200000 * data['multiplier']),
                (6, 36, Decimal('999999999.99'))
            ]

            for order, rate, limit in brackets:
                model.objects.create(
                    period_type=period,
                    bracket_order=order,
                    rate=rate,
                    bracket_limit=limit,
                    relief_amount=data['relief'] if order == 1 else None,
                    effective_from=current_date,
                    is_active=True
                )

    def _create_flat_tax_rates(self, model, rate, current_date):
        periods = {
            'annually': {'relief': Decimal('1800000.00')},
            'quarterly': {'relief': Decimal('450000.00')},
            'monthly': {'relief': Decimal('150000.00')}
        }

        for period, data in periods.items():
            model.objects.create(
                period_type=period,
                bracket_order=1,
                rate=rate,
                bracket_limit=Decimal('999999999.99'),
                relief_amount=data['relief'],
                effective_from=current_date,
                is_active=True
            )