from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from tax_report.models import DownloadedReports

class Command(BaseCommand):
    help = 'Fix user references in DownloadedReports by matching email addresses'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be done without making changes',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        
        # Get all DownloadedReports that don't have a user assigned
        reports_without_user = DownloadedReports.objects.filter(user__isnull=True)
        
        if not reports_without_user.exists():
            self.stdout.write(
                self.style.SUCCESS('No reports found without user assignments.')
            )
            return
        
        self.stdout.write(f"Found {reports_without_user.count()} reports without user assignments.")
        
        fixed_count = 0
        not_fixed_count = 0
        
        for report in reports_without_user:
            if report.email:
                try:
                    user = User.objects.get(email=report.email)
                    if not dry_run:
                        report.user = user
                        report.save()
                    self.stdout.write(
                        f"{'[DRY RUN] ' if dry_run else ''}Assigned user {user.username} (ID: {user.id}) to report {report.id} (Email: {report.email})"
                    )
                    fixed_count += 1
                except User.DoesNotExist:
                    self.stdout.write(
                        self.style.WARNING(f"No user found with email {report.email} for report {report.id}")
                    )
                    not_fixed_count += 1
            else:
                self.stdout.write(
                    self.style.WARNING(f"No email found for report {report.id}")
                )
                not_fixed_count += 1
        
        self.stdout.write(
            self.style.SUCCESS(
                f"\nSummary: {fixed_count} reports fixed, {not_fixed_count} reports could not be fixed."
            )
        )
        
        if dry_run:
            self.stdout.write(
                self.style.WARNING("This was a dry run. Use --dry-run=False to apply changes.")
            ) 