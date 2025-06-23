from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import datetime, date
from tax_notifications.models import TaxDeadline, UserNotificationPreference
from django.contrib.auth.models import User

class Command(BaseCommand):
    help = 'Populate tax_deadlines table with data from Calendar.js'

    def handle(self, *args, **options):
        self.stdout.write("Populating tax deadlines from Calendar.js data...")
        
        # Clear existing deadlines first
        TaxDeadline.objects.all().delete()
        self.stdout.write("Cleared existing deadlines")
        
        # Data extracted from Calendar.js - 2024/2025
        deadlines_2024_2025 = [
            # Monthly deadline - APIT & AIT/WHT payments (15th of following month)
            {
                'title': 'APIT & AIT/WHT Payments - 2024/2025',
                'deadline_date': date(2024, 2, 15),  # First monthly deadline
                'deadline_type': 'monthly',
                'year_assessment': '2024/2025'
            },
            
            # Quarterly deadlines - Self-Assessment Tax Instalments
            {
                'title': '1st Self-Assessment Tax Instalment - 2024/2025',
                'deadline_date': date(2024, 8, 15),
                'deadline_type': 'quarterly',
                'year_assessment': '2024/2025'
            },
            {
                'title': '2nd Self-Assessment Tax Instalment - 2024/2025',
                'deadline_date': date(2024, 11, 15),
                'deadline_type': 'quarterly',
                'year_assessment': '2024/2025'
            },
            {
                'title': '3rd Self-Assessment Tax Instalment - 2024/2025',
                'deadline_date': date(2025, 2, 15),
                'deadline_type': 'quarterly',
                'year_assessment': '2024/2025'
            },
            {
                'title': 'Final Self-Assessment Tax Payment - 2024/2025',
                'deadline_date': date(2025, 9, 30),
                'deadline_type': 'quarterly',
                'year_assessment': '2024/2025'
            },
            
            # Yearly deadlines
            {
                'title': 'Statement of Estimated Tax (SET) - 2024/2025',
                'deadline_date': date(2024, 8, 15),
                'deadline_type': 'yearly',
                'year_assessment': '2024/2025'
            },
            {
                'title': 'Income Tax Return Filing - 2023/2024',
                'deadline_date': date(2024, 11, 30),
                'deadline_type': 'yearly',
                'year_assessment': '2024/2025'
            },
        ]
        
        # Data extracted from Calendar.js - 2025/2026
        deadlines_2025_2026 = [
            # Monthly deadline - APIT & AIT/WHT payments (15th of following month)
            {
                'title': 'APIT & AIT/WHT Payments - 2025/2026',
                'deadline_date': date(2025, 2, 15),  # First monthly deadline
                'deadline_type': 'monthly',
                'year_assessment': '2025/2026'
            },
            
            # Quarterly deadlines - Self-Assessment Tax Instalments
            {
                'title': '1st Self-Assessment Tax Instalment - 2025/2026',
                'deadline_date': date(2025, 8, 15),
                'deadline_type': 'quarterly',
                'year_assessment': '2025/2026'
            },
            {
                'title': '2nd Self-Assessment Tax Instalment - 2025/2026',
                'deadline_date': date(2025, 11, 15),
                'deadline_type': 'quarterly',
                'year_assessment': '2025/2026'
            },
            {
                'title': '3rd Self-Assessment Tax Instalment - 2025/2026',
                'deadline_date': date(2026, 2, 15),
                'deadline_type': 'quarterly',
                'year_assessment': '2025/2026'
            },
            {
                'title': 'Final Self-Assessment Tax Payment - 2025/2026',
                'deadline_date': date(2026, 9, 30),
                'deadline_type': 'quarterly',
                'year_assessment': '2025/2026'
            },
            
            # Yearly deadlines
            {
                'title': 'Statement of Estimated Tax (SET) - 2025/2026',
                'deadline_date': date(2025, 8, 15),
                'deadline_type': 'yearly',
                'year_assessment': '2025/2026'
            },
            {
                'title': 'Income Tax Return Filing - 2024/2025',
                'deadline_date': date(2025, 11, 30),
                'deadline_type': 'yearly',
                'year_assessment': '2025/2026'
            },
        ]
        
        all_deadlines = deadlines_2024_2025 + deadlines_2025_2026
        created_count = 0
        
        for deadline_data in all_deadlines:
            deadline = TaxDeadline.objects.create(**deadline_data)
            created_count += 1
            self.stdout.write(f"Created deadline: {deadline.title} - {deadline.deadline_date}")
        
        self.stdout.write(
            self.style.SUCCESS(f"Successfully created {created_count} deadlines from Calendar.js")
        )
        
        # Show summary
        self.stdout.write("\nSummary:")
        self.stdout.write(f"2024/2025: {len(deadlines_2024_2025)} deadlines")
        self.stdout.write(f"2025/2026: {len(deadlines_2025_2026)} deadlines")
        self.stdout.write(f"Total: {created_count} deadlines")
        
        self.stdout.write("\nCalendar.js tax due dates have been successfully imported to the database!")
        self.stdout.write("The tax_deadlines table now contains all the deadlines from your Calendar component.")

        # Set notification preference for a new user
        new_user = UserNotificationPreference.objects.create(
            user=new_user,
            email_notifications=True,
            push_notifications=False,
            reminder_before_days=1,
            is_active=True
        )
        self.stdout.write("Notification preference set for the new user")

        # Set notification preference for all users
        for user in User.objects.all():
            UserNotificationPreference.objects.update_or_create(
                user=user,
                defaults={
                    'email_notifications': True,      # Enable email notifications
                    'push_notifications': False,      # (Optional) Disable push notifications
                    'reminder_before_days': 1,        # Send reminder 1 day before deadline
                    'is_active': True                 # Make the preference active
                }
            )
        self.stdout.write("Notification preferences set for all users.")
