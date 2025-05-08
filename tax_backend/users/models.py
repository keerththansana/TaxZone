from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone

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