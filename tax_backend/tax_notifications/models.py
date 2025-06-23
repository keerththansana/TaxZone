from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
from datetime import datetime, timedelta

class TaxDeadline(models.Model):
    """Model to store tax deadlines"""
    DEADLINE_TYPES = [
        ('monthly', 'Monthly'),
        ('quarterly', 'Quarterly'),
        ('yearly', 'Yearly'),
        ('custom', 'Custom'),
    ]
    
    title = models.CharField(max_length=255)
    deadline_date = models.DateField()
    deadline_type = models.CharField(max_length=20, choices=DEADLINE_TYPES, default='custom')
    year_assessment = models.CharField(max_length=10)  # e.g., "2024/2025"
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'tax_deadlines'
        ordering = ['deadline_date']
    
    def __str__(self):
        return f"{self.title} - {self.deadline_date}"
    
    @property
    def is_overdue(self):
        return self.deadline_date < timezone.now().date()
    
    @property
    def days_until_deadline(self):
        return (self.deadline_date - timezone.now().date()).days

class UserNotificationPreference(models.Model):
    """Model to store user notification preferences"""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='notification_preferences')
    email_notifications = models.BooleanField(default=True)
    push_notifications = models.BooleanField(default=True)
    reminder_before_days = models.IntegerField(default=1)  # Days before deadline to send reminder
    reminder_time = models.TimeField(default=datetime.strptime('06:00', '%H:%M').time())  # 6 AM default
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'user_notification_preferences'
    
    def __str__(self):
        return f"Notification preferences for {self.user.username}"

class NotificationHistory(models.Model):
    """Model to track notification history"""
    NOTIFICATION_TYPES = [
        ('deadline_reminder', 'Deadline Reminder'),
        ('deadline_due', 'Deadline Due'),
        ('deadline_overdue', 'Deadline Overdue'),
        ('system', 'System Notification'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    deadline = models.ForeignKey(TaxDeadline, on_delete=models.CASCADE, null=True, blank=True)
    notification_type = models.CharField(max_length=20, choices=NOTIFICATION_TYPES)
    title = models.CharField(max_length=255)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    sent_at = models.DateTimeField(auto_now_add=True)
    read_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'notification_history'
        ordering = ['-sent_at']
    
    def __str__(self):
        return f"{self.notification_type} for {self.user.username} - {self.sent_at}"
    
    def mark_as_read(self):
        self.is_read = True
        self.read_at = timezone.now()
        self.save()
