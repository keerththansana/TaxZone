from django.db import connection # type: ignore

def refresh_db_connection():
    if connection.connection and not connection.is_usable():
        connection.close()