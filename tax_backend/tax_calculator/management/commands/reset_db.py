from django.core.management.base import BaseCommand # type: ignore
from django.db import connection # type: ignore
from django.conf import settings # type: ignore

class Command(BaseCommand):
    help = 'Reset the database and initialize tax rates'

    def handle(self, *args, **kwargs):
        with connection.cursor() as cursor:
            # Get database name from settings
            db_name = settings.DATABASES['default']['NAME']
            
            # Drop and recreate database
            cursor.execute(f"DROP DATABASE IF EXISTS {db_name}")
            cursor.execute(f"CREATE DATABASE {db_name}")
            
            self.stdout.write(
                self.style.SUCCESS(f'Successfully reset database: {db_name}')
            )