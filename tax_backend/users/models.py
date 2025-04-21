from django.contrib.auth.models import AbstractUser
from django.db import models

class CustomUser(AbstractUser):
    google_id = models.CharField(max_length=255, null=True, blank=True)
    picture = models.URLField(max_length=500, null=True, blank=True)
    
    class Meta:
        db_table = 'users'
        
    def __str__(self):
        return self.email or self.username 