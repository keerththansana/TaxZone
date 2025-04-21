from django.core.management.base import BaseCommand # type: ignore
from django.utils import timezone # type: ignore
from tax_calculator import models
from decimal import Decimal

class Command(BaseCommand):
    help = 'Update tax rates with history tracking'

    def add_arguments(self, parser):
        parser.add_argument('--tax-type', required=True, 
            help='Type of income (employment, professional, etc.)')
        parser.add_argument('--period', required=True,
            help='Period type (monthly, quarterly, annually)')
        parser.add_argument('--bracket', type=int, required=True,
            help='Bracket number')
        parser.add_argument('--rate', type=float, required=True,
            help='New tax rate percentage')
        parser.add_argument('--relief', type=float,
            help='Relief amount (for first bracket)')

    def handle(self, *args, **options):
        model_map = {
            'employment': models.EmploymentTaxRate,
            'professional': models.ProfessionalTaxRate,
            # Add other models
        }

        model = model_map.get(options['tax_type'])
        if not model:
            self.stderr.write(f"Invalid tax type: {options['tax_type']}")
            return

        try:
            current_rate = model.objects.get(
                period_type=options['period'],
                bracket_order=options['bracket'],
                is_active=True
            )

            # Create new rate
            new_rate = model.objects.create(
                period_type=options['period'],
                bracket_order=options['bracket'],
                rate=Decimal(str(options['rate'])),
                bracket_limit=current_rate.bracket_limit,
                relief_amount=(Decimal(str(options['relief'])) 
                             if options['relief'] else None),
                effective_from=timezone.now().date(),
                is_active=True
            )

            # Deactivate old rate
            current_rate.is_active = False
            current_rate.effective_to = timezone.now().date()
            current_rate.save()

            self.stdout.write(self.style.SUCCESS(
                f'Successfully updated tax rate from {current_rate.rate}% '
                f'to {new_rate.rate}%'
            ))

        except model.DoesNotExist:
            self.stderr.write(f"No active rate found for the specified criteria")