from django.core.management.base import BaseCommand
from django.utils import timezone
from django.core.mail import send_mail
from django.conf import settings
from tax_notifications.models import TaxDeadline, UserNotificationPreference, NotificationHistory
from django.contrib.auth.models import User
from datetime import timedelta

class Command(BaseCommand):
    help = 'Send email reminders to users one day before their tax deadline.'

    def handle(self, *args, **options):
        today = timezone.now().date()
        reminder_day = today + timedelta(days=1)
        
        # Get all active user notification preferences for email
        preferences = UserNotificationPreference.objects.filter(
            email_notifications=True,
            is_active=True,
            reminder_before_days=1
        )
        
        count = 0
        for pref in preferences:
            user = pref.user
            # Find all active deadlines for tomorrow
            deadlines = TaxDeadline.objects.filter(
                is_active=True,
                deadline_date=reminder_day
            )
            for deadline in deadlines:
                # Check if already notified
                already_notified = NotificationHistory.objects.filter(
                    user=user,
                    deadline=deadline,
                    notification_type='deadline_reminder',
                ).exists()
                if already_notified:
                    continue
                # Compose email
                subject = f"Reminder: Tax Deadline Approaching - {deadline.title}"
                message = (
                    f"Dear {user.first_name or user.username},\n\n"
                    f"This is a reminder that the following tax deadline is tomorrow ({deadline.deadline_date}):\n\n"
                    f"{deadline.title}\n\n"
                    f"Please ensure you complete any necessary actions before the deadline.\n\n"
                    f"Best regards,\nTaxZone Team"
                )
                # Send email
                send_mail(
                    subject,
                    message,
                    settings.DEFAULT_FROM_EMAIL,
                    [user.email],
                    fail_silently=False,
                )
                # Log notification
                NotificationHistory.objects.create(
                    user=user,
                    deadline=deadline,
                    notification_type='deadline_reminder',
                    title=subject,
                    message=message,
                )
                count += 1
                self.stdout.write(self.style.SUCCESS(f"Sent reminder to {user.email} for deadline '{deadline.title}'"))
        if count == 0:
            self.stdout.write("No reminders sent today.")
        else:
            self.stdout.write(self.style.SUCCESS(f"Total reminders sent: {count}"))

        # Set notification preferences for all users
        for user in User.objects.all():
            UserNotificationPreference.objects.update_or_create(
                user=user,
                defaults={
                    'email_notifications': True,
                    'push_notifications': False,
                    'reminder_before_days': 1,
                    'is_active': True
                }
            )
        self.stdout.write(self.style.SUCCESS("Notification preferences set for all users.")) 