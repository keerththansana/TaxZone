from django.core.management.base import BaseCommand # type: ignore
from tax_calculator import models

class Command(BaseCommand):
    help = 'Verify tax rates in database'

    def handle(self, *args, **kwargs):
        for tax_type, model in {
            'Employment': models.EmploymentTaxRate,
            'Professional': models.ProfessionalTaxRate,
            'Business': models.BusinessTaxRate,
            'Investment': models.InvestmentTaxRate,
            'Rental': models.RentalTaxRate,
            'Dividend': models.DividendTaxRate,
            'Interest': models.InterestTaxRate,
            'Royalty': models.RoyaltyTaxRate,
            'Pension': models.PensionTaxRate,
            'Capital Gains': models.CapitalGainsTaxRate
        }.items():
            count = model.objects.filter(is_active=True).count()
            self.stdout.write(f'{tax_type}: {count} active rates')