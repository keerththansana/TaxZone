from django.core.management.base import BaseCommand # type: ignore
from tax_calculator.models import TaxRate
from decimal import Decimal

class Command(BaseCommand):
    help = 'Initialize tax rates'

    def handle(self, *args, **kwargs):
        # Employment tax rates
        employment_rates = [
            (1, 6.00, 1200000.00, 1800000.00),
            (2, 12.00, 1200000.00, None),
            (3, 18.00, 1200000.00, None),
            (4, 24.00, 1200000.00, None),
            (5, 30.00, 1200000.00, None),
            (6, 36.00, 999999999.99, None),
        ]

        for order, rate, limit, relief in employment_rates:
            TaxRate.objects.create(
                tax_type='employment',
                period_type='annually',
                bracket_order=order,
                rate=Decimal(str(rate)),
                bracket_limit=Decimal(str(limit)),
                relief_amount=Decimal(str(relief)) if relief else None,
                is_active=True
            )

        self.stdout.write(self.style.SUCCESS('Successfully initialized tax rates'))