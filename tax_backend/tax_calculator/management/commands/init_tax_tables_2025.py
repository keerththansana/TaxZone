from django.core.management.base import BaseCommand # type: ignore
from django.db import connection # type: ignore
from datetime import date

class Command(BaseCommand):
    help = 'Initialize tax rate tables'

    def handle(self, *args, **options):
        try:
            with connection.cursor() as cursor:
                # Drop existing tables if they exist
                cursor.execute("DROP TABLE IF EXISTS employment_tax_rates_2025")
                cursor.execute("DROP TABLE IF EXISTS professional_tax_rates_2025")
                cursor.execute("DROP TABLE IF EXISTS business_tax_rates_2025")
                cursor.execute("DROP TABLE IF EXISTS foreign_tax_rates_2025")
                cursor.execute("DROP TABLE IF EXISTS rental_tax_rates_2025")
                cursor.execute("DROP TABLE IF EXISTS rental_tax_parameters_2025")
                cursor.execute("DROP TABLE IF EXISTS dividend_tax_rates_2025")
                cursor.execute("DROP TABLE IF EXISTS interest_tax_rates_2025")
                cursor.execute("DROP TABLE IF EXISTS royalty_tax_rates_2025")
                cursor.execute("DROP TABLE IF EXISTS pension_tax_rates_2025")
                cursor.execute("DROP TABLE IF EXISTS capital_gain_tax_rates_2025")

                # Create employment tax rates table
                cursor.execute("""
                    CREATE TABLE employment_tax_rates_2025 (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        period_type VARCHAR(10) NOT NULL,
                        bracket_order INT NOT NULL,
                        rate DECIMAL(5,2) NOT NULL,
                        bracket_limit DECIMAL(12,2) NOT NULL,
                        relief_amount DECIMAL(12,2),
                        is_active BOOLEAN DEFAULT TRUE,
                        effective_from DATE DEFAULT (CURRENT_DATE),
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                        UNIQUE KEY period_bracket (period_type, bracket_order)
                    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
                """)

                # Insert employment tax rates with correct brackets
                cursor.execute("""
                    INSERT INTO employment_tax_rates_2025
                    (period_type, bracket_order, rate, bracket_limit, relief_amount)
                    VALUES 
                    -- Monthly rates
                    ('monthly', 1, 6.00, 83333.33, 150000.00),
                    ('monthly', 2, 18.00, 41666.67, NULL),
                    ('monthly', 3, 24.00, 41666.67, NULL),
                    ('monthly', 4, 30.00, 41666.67, NULL),
                    ('monthly', 5, 36.00, 99999999.99, NULL),
                    
                    -- Quarterly rates
                    ('quarterly', 1, 6.00, 250000.00, 450000.00),
                    ('quarterly', 2, 18.00, 125000.00, NULL),
                    ('quarterly', 3, 24.00, 125000.00, NULL),
                    ('quarterly', 4, 30.00, 125000.00, NULL),
                    ('quarterly', 5, 36.00, 99999999.99, NULL),
                    
                    -- Annual rates
                    ('annually', 1, 6.00, 1000000.00, 1800000.00),
                    ('annually', 2, 18.00, 500000.00, NULL),
                    ('annually', 3, 24.00, 500000.00, NULL),
                    ('annually', 4, 30.00, 500000.00, NULL),
                    ('annually', 5, 36.00, 99999999.99, NULL)
                """)

                # Create professional tax rates table with same structure
                cursor.execute("""
                    CREATE TABLE professional_tax_rates_2025 (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        period_type VARCHAR(10) NOT NULL,
                        bracket_order INT NOT NULL,
                        rate DECIMAL(5,2) NOT NULL,
                        bracket_limit DECIMAL(12,2) NOT NULL,
                        relief_amount DECIMAL(12,2),
                        is_active BOOLEAN DEFAULT TRUE,
                        effective_from DATE DEFAULT (CURRENT_DATE),
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                        UNIQUE KEY period_bracket (period_type, bracket_order)
                    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
                """)

                # Create business tax rates table
                cursor.execute("""
                    CREATE TABLE business_tax_rates_2025 (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        period_type VARCHAR(10) NOT NULL,
                        bracket_order INT NOT NULL,
                        rate DECIMAL(5,2) NOT NULL,
                        bracket_limit DECIMAL(12,2) NOT NULL,
                        relief_amount DECIMAL(12,2),
                        is_active BOOLEAN DEFAULT TRUE,
                        business_type VARCHAR(20) DEFAULT 'general',
                        is_flat_rate BOOLEAN DEFAULT FALSE,
                        effective_from DATE DEFAULT (CURRENT_DATE),
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                        UNIQUE KEY period_bracket_type (period_type, bracket_order, business_type)
                    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
                """)

                # Insert rates for professional tax rates
                tax_rates_sql = """
                    INSERT INTO {table_name} 
                    (period_type, bracket_order, rate, bracket_limit, relief_amount, is_active)
                    VALUES 
                    -- Monthly rates
                    ('monthly', 1, 6.00, 83333.33, 150000.00, 1),
                    ('monthly', 2, 18.00, 41666.67, NULL, 1),
                    ('monthly', 3, 24.00, 41666.67, NULL, 1),
                    ('monthly', 4, 30.00, 41666.67, NULL, 1),
                    ('monthly', 5, 36.00, 99999999.99, NULL, 1),
                    
                    -- Quarterly rates
                    ('quarterly', 1, 6.00, 250000.00, 450000.00, 1),
                    ('quarterly', 2, 18.00, 125000.00, NULL, 1),
                    ('quarterly', 3, 24.00, 125000.00, NULL, 1),
                    ('quarterly', 4, 30.00, 125000.00, NULL, 1),
                    ('quarterly', 5, 36.00, 99999999.99, NULL, 1),
                    
                    -- Annual rates
                    ('annually', 1, 6.00, 1000000.00, 1800000.00, 1),
                    ('annually', 2, 18.00, 500000.00, NULL, 1),
                    ('annually', 3, 24.00, 500000.00, NULL, 1),
                    ('annually', 4, 30.00, 500000.00, NULL, 1),
                    ('annually', 5, 36.00, 99999999.99, NULL, 1)
                """
                cursor.execute(tax_rates_sql.format(table_name='professional_tax_rates_2025'))

                # Insert business tax rates
                cursor.execute("""
                    INSERT INTO business_tax_rates_2025
                    (period_type, bracket_order, rate, bracket_limit, relief_amount, business_type, is_flat_rate)
                    VALUES 
                    -- Regular business rates (monthly)
                    ('monthly', 1, 6.00, 83333.33, 150000.00, 'general', 0),
                    ('monthly', 2, 18.00, 41666.67, NULL, 'general', 0),
                    ('monthly', 3, 24.00, 41666.67, NULL, 'general', 0),
                    ('monthly', 4, 30.00, 41666.67, NULL, 'general', 0),
                    ('monthly', 5, 36.00, 99999999.99, NULL, 'general', 0),
                    
                    -- Special business rate (monthly)
                    ('monthly', 1, 45.00, 99999999.99, 0.00, 'special', 1),
                    
                    -- Regular business rates (quarterly)
                    ('quarterly', 1, 6.00, 250000.00, 450000.00, 'general', 0),
                    ('quarterly', 2, 18.00, 125000.00, NULL, 'general', 0),
                    ('quarterly', 3, 24.00, 125000.00, NULL, 'general', 0),
                    ('quarterly', 4, 30.00, 125000.00, NULL, 'general', 0),
                    ('quarterly', 5, 36.00, 99999999.99, NULL, 'general', 0),
                    
                    -- Special business rate (quarterly)
                    ('quarterly', 1, 45.00, 99999999.99, 0.00, 'special', 1),
                    
                    -- Regular business rates (annually)
                    ('annually', 1, 6.00, 1000000.00, 1800000.00, 'general', 0),
                    ('annually', 2, 18.00, 500000.00, NULL, 'general', 0),
                    ('annually', 3, 24.00, 500000.00, NULL, 'general', 0),
                    ('annually', 4, 30.00, 500000.00, NULL, 'general', 0),
                    ('annually', 5, 36.00, 99999999.99, NULL, 'general', 0),
                    
                    -- Special business rate (annually)
                    ('annually', 1, 45.00, 99999999.99, 0.00, 'special', 1)
                """)

                # Drop and create foreign tax rates table
                cursor.execute("DROP TABLE IF EXISTS foreign_tax_rates_2025")
                cursor.execute("""
                    CREATE TABLE foreign_tax_rates_2025 (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        period_type VARCHAR(10) NOT NULL,
                        bracket_order INT NOT NULL,
                        rate DECIMAL(5,2) NOT NULL,
                        bracket_limit DECIMAL(12,2) NOT NULL,
                        relief_amount DECIMAL(12,2),
                        foreign_type VARCHAR(20) NOT NULL,
                        is_flat_rate BOOLEAN DEFAULT FALSE,
                        is_active BOOLEAN DEFAULT TRUE,
                        UNIQUE KEY period_bracket_type (period_type, bracket_order, foreign_type)
                    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
                """)

                # Insert data for both types of foreign income
                cursor.execute("""
                    INSERT INTO foreign_tax_rates_2025 
                    (period_type, bracket_order, rate, bracket_limit, relief_amount, foreign_type, is_flat_rate)
                    VALUES 
                    -- Bank remitted foreign income (15% flat rate)
                    ('monthly', 1, 15.00, 99999999.99, 0.00, 'remitted', TRUE),
                    ('quarterly', 1, 15.00, 99999999.99, 0.00, 'remitted', TRUE),
                    ('annually', 1, 15.00, 99999999.99, 0.00, 'remitted', TRUE),

                    -- Other foreign income (same as employment income)
                    ('monthly', 1, 6.00, 83333.33, 150000.00, 'other', FALSE),
                    ('monthly', 2, 18.00, 41666.67, NULL, 'other', FALSE),
                    ('monthly', 3, 24.00, 41666.67, NULL, 'other', FALSE),
                    ('monthly', 4, 30.00, 41666.67, NULL, 'other', FALSE),
                    ('monthly', 5, 36.00, 99999999.99, NULL, 'other', FALSE),
                    
                    -- Quarterly rates for other foreign income
                    ('quarterly', 1, 6.00, 250000.00, 450000.00, 'other', FALSE),
                    ('quarterly', 2, 18.00, 125000.00, NULL, 'other', FALSE),
                    ('quarterly', 3, 24.00, 125000.00, NULL, 'other', FALSE),
                    ('quarterly', 4, 30.00, 125000.00, NULL, 'other', FALSE),
                    ('quarterly', 5, 36.00, 99999999.99, NULL, 'other', FALSE),
                    
                    -- Annual rates for other foreign income
                    ('annually', 1, 6.00, 1000000.00, 1800000.00, 'other', FALSE),
                    ('annually', 2, 18.00, 500000.00, NULL, 'other', FALSE),
                    ('annually', 3, 24.00, 500000.00, NULL, 'other', FALSE),
                    ('annually', 4, 30.00, 500000.00, NULL, 'other', FALSE),
                    ('annually', 5, 36.00, 99999999.99, NULL, 'other', FALSE)
                """)

                # Create rental tax rates table with proper structure
                cursor.execute("""
                    CREATE TABLE rental_tax_rates_2025 (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        period_type VARCHAR(10) NOT NULL,
                        bracket_order INT NOT NULL,
                        rate DECIMAL(5,2) NOT NULL,
                        bracket_limit DECIMAL(12,2) NOT NULL,
                        relief_amount DECIMAL(12,2),
                        is_active BOOLEAN DEFAULT TRUE,
                        is_flat_rate BOOLEAN DEFAULT FALSE,
                        effective_from DATE DEFAULT '2025-04-01',
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                        UNIQUE KEY period_bracket (period_type, bracket_order)
                    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
                """)

                # Insert rental tax rates
                cursor.execute("""
                    INSERT INTO rental_tax_rates_2025 
                    (period_type, bracket_order, rate, bracket_limit, relief_amount)
                    VALUES 
                    -- Monthly rates
                    ('monthly', 1, 6.00, 83333.33, 150000.00),
                    ('monthly', 2, 18.00, 41666.67, NULL),
                    ('monthly', 3, 24.00, 41666.67, NULL),
                    ('monthly', 4, 30.00, 41666.67, NULL),
                    ('monthly', 5, 36.00, 99999999.99, NULL),
                    
                    -- Quarterly rates
                    ('quarterly', 1, 6.00, 250000.00, 450000.00),
                    ('quarterly', 2, 18.00, 125000.00, NULL),
                    ('quarterly', 3, 24.00, 125000.00, NULL),
                    ('quarterly', 4, 30.00, 125000.00, NULL),
                    ('quarterly', 5, 36.00, 99999999.99, NULL),
                    
                    -- Annual rates
                    ('annually', 1, 6.00, 1000000.00, 1800000.00),
                    ('annually', 2, 18.00, 500000.00, NULL),
                    ('annually', 3, 24.00, 500000.00, NULL),
                    ('annually', 4, 30.00, 500000.00, NULL),
                    ('annually', 5, 36.00, 99999999.99, NULL)
                """)

                # Create rental tax parameters table
                cursor.execute("""
                    CREATE TABLE rental_tax_parameters_2025 (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        period_type VARCHAR(10) NOT NULL,
                        rental_relief_percentage DECIMAL(5,2) DEFAULT 25.00,
                        wht_threshold DECIMAL(12,2),
                        wht_rate DECIMAL(5,2) DEFAULT 10.00,
                        relief_amount DECIMAL(12,2),
                        is_active BOOLEAN DEFAULT TRUE,
                        effective_from DATE DEFAULT (CURRENT_DATE),
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                        UNIQUE KEY period_type_unique (period_type)
                    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
                """)

                # Create dividend tax rates table
                cursor.execute("""
                    CREATE TABLE dividend_tax_rates_2025 (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        period_type VARCHAR(10) NOT NULL,
                        bracket_order INT NOT NULL,
                        rate DECIMAL(5,2) NOT NULL,
                        bracket_limit DECIMAL(12,2) NOT NULL,
                        relief_amount DECIMAL(12,2),
                        is_active BOOLEAN DEFAULT TRUE,
                        is_flat_rate BOOLEAN DEFAULT TRUE,
                        effective_from DATE DEFAULT '2025-04-01',
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                        UNIQUE KEY period_bracket (period_type, bracket_order)
                    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
                """)

                # Insert dividend tax rates (15% flat rate for 2025)
                cursor.execute("""
                    INSERT INTO dividend_tax_rates_2025
                    (period_type, bracket_order, rate, bracket_limit, relief_amount)
                    VALUES 
                    -- Monthly rates
                    ('monthly', 1, 15.00, 99999999.99, 0.00),
                    -- Quarterly rates
                    ('quarterly', 1, 15.00, 99999999.99, 0.00),
                    -- Annual rates
                    ('annually', 1, 15.00, 99999999.99, 0.00)
                """)

                # Create interest tax rates table
                cursor.execute("""
                    CREATE TABLE interest_tax_rates_2025 (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        period_type VARCHAR(10) NOT NULL,
                        bracket_order INT NOT NULL,
                        rate DECIMAL(5,2) NOT NULL,
                        bracket_limit DECIMAL(12,2) NOT NULL,
                        relief_amount DECIMAL(12,2),
                        wht_rate DECIMAL(5,2),
                        wht_threshold DECIMAL(12,2),
                        is_active BOOLEAN DEFAULT TRUE,
                        is_flat_rate BOOLEAN DEFAULT TRUE,
                        effective_from DATE DEFAULT '2025-04-01',
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                        UNIQUE KEY period_bracket (period_type, bracket_order)
                    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
                """)

                # Insert interest tax rates (10% flat rate for 2025)
                cursor.execute("""
                    INSERT INTO interest_tax_rates_2025
                    (period_type, bracket_order, rate, bracket_limit, relief_amount, wht_rate, wht_threshold)
                    VALUES 
                    -- Monthly rates
                    ('monthly', 1, 10.00, 99999999.99, 0.00, 10.00, 150000.00),
                    -- Quarterly rates
                    ('quarterly', 1, 10.00, 99999999.99, 0.00, 10.00, 450000.00),
                    -- Annual rates
                    ('annually', 1, 10.00, 99999999.99, 0.00, 10.00, 1800000.00)
                """)

                # Create royalty tax rates table
                cursor.execute("""
                    CREATE TABLE royalty_tax_rates_2025 (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        period_type VARCHAR(10) NOT NULL,
                        bracket_order INT NOT NULL,
                        rate DECIMAL(5,2) NOT NULL,
                        bracket_limit DECIMAL(12,2) NOT NULL,
                        relief_amount DECIMAL(12,2),
                        is_active BOOLEAN DEFAULT TRUE,
                        is_flat_rate BOOLEAN DEFAULT FALSE,
                        effective_from DATE DEFAULT '2025-04-01',
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                        UNIQUE KEY period_bracket (period_type, bracket_order)
                    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
                """)

                # Insert royalty tax rates (same as employment income)
                cursor.execute("""
                    INSERT INTO royalty_tax_rates_2025 
                    (period_type, bracket_order, rate, bracket_limit, relief_amount)
                    VALUES 
                    -- Monthly rates
                    ('monthly', 1, 6.00, 83333.33, 150000.00),
                    ('monthly', 2, 18.00, 41666.67, NULL),
                    ('monthly', 3, 24.00, 41666.67, NULL),
                    ('monthly', 4, 30.00, 41666.67, NULL),
                    ('monthly', 5, 36.00, 99999999.99, NULL),
                    
                    -- Quarterly rates
                    ('quarterly', 1, 6.00, 250000.00, 450000.00),
                    ('quarterly', 2, 18.00, 125000.00, NULL),
                    ('quarterly', 3, 24.00, 125000.00, NULL),
                    ('quarterly', 4, 30.00, 125000.00, NULL),
                    ('quarterly', 5, 36.00, 99999999.99, NULL),
                    
                    -- Annual rates
                    ('annually', 1, 6.00, 1000000.00, 1800000.00),
                    ('annually', 2, 18.00, 500000.00, NULL),
                    ('annually', 3, 24.00, 500000.00, NULL),
                    ('annually', 4, 30.00, 500000.00, NULL),
                    ('annually', 5, 36.00, 99999999.99, NULL)
                """)

                # Create pension tax rates table
                cursor.execute("""
                    CREATE TABLE pension_tax_rates_2025 (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        period_type VARCHAR(10) NOT NULL,
                        bracket_order INT NOT NULL,
                        rate DECIMAL(5,2) NOT NULL,
                        bracket_limit DECIMAL(12,2) NOT NULL,
                        relief_amount DECIMAL(12,2),
                        is_active BOOLEAN DEFAULT TRUE,
                        is_flat_rate BOOLEAN DEFAULT FALSE,
                        effective_from DATE DEFAULT '2025-04-01',
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                        UNIQUE KEY period_bracket (period_type, bracket_order)
                    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
                """)

                # Insert pension tax rates for 2025/2026
                cursor.execute("""
                    INSERT INTO pension_tax_rates_2025 
                    (period_type, bracket_order, rate, bracket_limit, relief_amount)
                    VALUES 
                    -- Monthly rates (2025/2026)
                    ('monthly', 1, 0.00, 833333.33, 0.00),    -- Up to LKR 833,333
                    ('monthly', 2, 6.00, 833333.33, NULL),    -- LKR 833,334 – 1,666,666
                    ('monthly', 3, 12.00, 99999999.99, NULL), -- Above LKR 1,666,666
                    
                    -- Quarterly rates (2025/2026)
                    ('quarterly', 1, 0.00, 2500000.00, 0.00),  -- Up to LKR 2.5 million
                    ('quarterly', 2, 6.00, 2500000.00, NULL),  -- LKR 2.5M – 5M
                    ('quarterly', 3, 12.00, 99999999.99, NULL), -- Above LKR 5 million
                    
                    -- Annual rates (2025/2026)
                    ('annually', 1, 0.00, 10000000.00, 0.00),  -- Up to LKR 10 million
                    ('annually', 2, 6.00, 10000000.00, NULL),  -- LKR 10M – 20M
                    ('annually', 3, 12.00, 99999999.99, NULL)  -- Above LKR 20 million
                """)

                # Insert rental parameters
                cursor.execute("""
                    INSERT INTO rental_tax_parameters_2025
                    (period_type, rental_relief_percentage, wht_threshold, wht_rate, relief_amount)
                    VALUES 
                    ('monthly', 25.00, 100000.00, 10.00, 150000.00),
                    ('quarterly', 25.00, 300000.00, 10.00, 450000.00),
                    ('annually', 25.00, 1200000.00, 10.00, 1800000.00)
                """)

                # Create capital gain tax rates table
                cursor.execute("""
                    CREATE TABLE capital_gain_tax_rates_2025 (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        period_type VARCHAR(10) NOT NULL,
                        bracket_order INT NOT NULL,
                        rate DECIMAL(5,2) NOT NULL,
                        bracket_limit DECIMAL(12,2) NOT NULL,
                        relief_amount DECIMAL(12,2),
                        is_active BOOLEAN DEFAULT TRUE,
                        is_flat_rate BOOLEAN DEFAULT TRUE,
                        effective_from DATE DEFAULT '2025-04-01',
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                        UNIQUE KEY period_bracket (period_type, bracket_order)
                    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
                """)

                # Insert capital gains tax rates for 2025/2026 (15% flat rate)
                cursor.execute("""
                    INSERT INTO capital_gain_tax_rates_2025
                    (period_type, bracket_order, rate, bracket_limit, relief_amount, is_active, is_flat_rate)
                    VALUES 
                    -- Monthly rates
                    ('monthly', 1, 15.00, 99999999.99, 0.00, TRUE, TRUE),
                    -- Quarterly rates
                    ('quarterly', 1, 15.00, 99999999.99, 0.00, TRUE, TRUE),
                    -- Annual rates
                    ('annually', 1, 15.00, 99999999.99, 0.00, TRUE, TRUE)
                """)

                self.stdout.write(self.style.SUCCESS('Successfully initialized tax rates tables'))

        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error: {str(e)}'))
            raise e