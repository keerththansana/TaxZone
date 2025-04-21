from django.core.management.base import BaseCommand # type: ignore
from tax_calculator import models
from django.utils import timezone # type: ignore

class Command(BaseCommand):
    help = 'Show current tax rates'

    def add_arguments(self, parser):
        parser.add_argument('--tax-type', type=str,
                          help='Type of tax to show (optional)')
        parser.add_argument('--period', type=str,
                          help='Period type (optional)')

    def handle(self, *args, **options):
        model_mapping = {
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

        tax_type = options['tax_type']
        period = options['period']

        if tax_type and tax_type.lower() not in model_mapping:
            self.stdout.write(self.style.ERROR(f'Invalid tax type: {tax_type}'))
            return

        models_to_check = ([model_mapping[tax_type.lower()]] if tax_type 
                          else model_mapping.values())

        for model in models_to_check:
            self.stdout.write(self.style.SUCCESS(
                f'\n{model.__name__}:'
            ))
            
            queryset = model.objects.filter(is_active=True)
            if period:
                queryset = queryset.filter(period_type=period.lower())
                
            for rate in queryset.order_by('period_type', 'bracket_order'):
                self.stdout.write(
                    f'  {rate.period_type.title()}, '
                    f'Bracket {rate.bracket_order}: '
                    f'{rate.rate}% '
                    f'(Limit: {rate.bracket_limit}, '
                    f'Relief: {rate.relief_amount or "N/A"})'
                )