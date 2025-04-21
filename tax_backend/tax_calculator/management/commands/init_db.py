from django.core.management.base import BaseCommand # type: ignore
from django.conf import settings # type: ignore
import os
import mysql.connector # type: ignore

class Command(BaseCommand):
    help = 'Initialize database with tax rates'

    def handle(self, *args, **kwargs):
        try:
            # Connect to MySQL
            connection = mysql.connector.connect(
                host=settings.DATABASES['default']['HOST'],
                user=settings.DATABASES['default']['USER'],
                password=settings.DATABASES['default']['PASSWORD']
            )
            cursor = connection.cursor()

            # Read and execute SQL script
            sql_file_path = os.path.join(
                settings.BASE_DIR, 
                'tax_calculator', 
                'sql', 
                'init_database.sql'
            )

            with open(sql_file_path, 'r') as sql_file:
                sql_commands = sql_file.read()
                
            # Execute each command separately
            for command in sql_commands.split(';'):
                if command.strip():
                    cursor.execute(command)
            
            connection.commit()
            self.stdout.write(self.style.SUCCESS('Successfully initialized database'))

        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error: {str(e)}'))

        finally:
            if connection.is_connected():
                cursor.close()
                connection.close()