from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone
from django.contrib.auth.models import User

class CustomUser(AbstractUser):
    email = models.EmailField(unique=True)
    google_id = models.CharField(max_length=255, null=True, blank=True)
    picture = models.URLField(max_length=500, null=True, blank=True)
    last_login_at = models.DateTimeField(auto_now=True)  # Changed to auto_now
    login_count = models.IntegerField(default=0)  # Added to track login count
    
    # Add related_name to avoid clashes
    groups = models.ManyToManyField(
        'auth.Group',
        related_name='custom_user_set',
        blank=True,
        verbose_name='groups',
        help_text='The groups this user belongs to.'
    )
    
    user_permissions = models.ManyToManyField(
        'auth.Permission',
        related_name='custom_user_set',
        blank=True,
        verbose_name='user permissions',
        help_text='Specific permissions for this user.'
    )

    class Meta:
        db_table = 'login_user'
        verbose_name = 'User'
        verbose_name_plural = 'Users'
        
    def __str__(self):
        return self.email or self.username

    def update_login_info(self):
        """Update login information when user logs in"""
        self.last_login_at = timezone.now()
        self.login_count += 1
        self.save(update_fields=['last_login_at', 'login_count'])

class AuthNewUser(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='auth_new_user')
    username = models.CharField(max_length=150, unique=True)
    email = models.EmailField(unique=True)
    password = models.CharField(max_length=128)  # Store hashed password
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'auth_new_user'
        verbose_name = 'New User'
        verbose_name_plural = 'New Users'

    def __str__(self):
        return self.username

class ResetPassword(models.Model):
    email = models.EmailField()
    new_password = models.CharField(max_length=255)
    reset_date = models.DateTimeField(default=timezone.now)
    
    class Meta:
        db_table = 'reset_password'
        verbose_name = 'Reset Password'
        verbose_name_plural = 'Reset Passwords'

    def __str__(self):
        return f"Password reset for {self.email} on {self.reset_date}"

# Add to users/models.py
class ContactUser(models.Model):
    name = models.CharField(max_length=255)
    email = models.EmailField()
    phone = models.CharField(max_length=20, blank=True, null=True)
    message = models.TextField()
    submitted_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'contact_user'
        verbose_name = 'Contact Submission'
        verbose_name_plural = 'Contact Submissions'

    def __str__(self):
        return f"Contact from {self.name} ({self.email})"

class TaxReview(models.Model):
    name = models.CharField(max_length=255)
    role = models.CharField(max_length=255, null=True, blank=True)
    rating = models.PositiveIntegerField()
    comment = models.TextField()
    date = models.DateTimeField(auto_now_add=True)
    image = models.URLField(max_length=500, null=True, blank=True)

    class Meta:
        db_table = 'tax_reviews'
        verbose_name = 'Tax Review'
        verbose_name_plural = 'Tax Reviews'
        ordering = ['-date']  # Show newest reviews first

    def __str__(self):
        return f"Review by {self.name} - {self.rating} stars"