import mysql.connector # type: ignore
import os
from pathlib import Path

def init_database():
    # Database connection parameters
    config = {
        'host': 'localhost',
        'user': 'root',
        'password': 'your_mysql_root_password'  # Replace with your MySQL root password
    }

    try:
        # Connect to MySQL
        connection = mysql.connector.connect(**config)
        cursor = connection.cursor()

        # Get the SQL file path
        base_dir = Path(__file__).resolve().parent.parent
        sql_file_path = os.path.join(base_dir, 'sql', 'init_db.sql')

        # Read and execute SQL commands
        with open(sql_file_path, 'r') as file:
            sql_commands = file.read().split(';')
            
            for command in sql_commands:
                if command.strip():
                    cursor.execute(command)
            
            connection.commit()
            print("Database initialized successfully!")

    except Exception as e:
        print(f"Error initializing database: {str(e)}")

    finally:
        if 'connection' in locals() and connection.is_connected():
            cursor.close()
            connection.close()

if __name__ == "__main__":
    init_database()