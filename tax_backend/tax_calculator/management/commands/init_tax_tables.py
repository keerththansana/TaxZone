from django.core.management.base import BaseCommand # type: ignore
from django.db import connection # type: ignore
from datetime import date

class Command(BaseCommand):
    help = 'Initialize tax rate tables'

    def handle(self, *args, **options):
        try:
            with connection.cursor() as cursor:
                # Drop existing tables if they exist
                cursor.execute("DROP TABLE IF EXISTS employment_tax_rates")
                cursor.execute("DROP TABLE IF EXISTS professional_tax_rates")
                cursor.execute("DROP TABLE IF EXISTS business_tax_rates")
                cursor.execute("DROP TABLE IF EXISTS foreign_tax_rates")
                cursor.execute("DROP TABLE IF EXISTS rental_tax_rates")
                cursor.execute("DROP TABLE IF EXISTS rental_tax_parameters")
                cursor.execute("DROP TABLE IF EXISTS dividend_tax_rates")
                cursor.execute("DROP TABLE IF EXISTS interest_tax_rates")
                cursor.execute("DROP TABLE IF EXISTS royalty_tax_rates")
                cursor.execute("DROP TABLE IF EXISTS pension_tax_rates")
                cursor.execute("DROP TABLE IF EXISTS capital_gain_tax_rates")

                # Create employment tax rates table
                cursor.execute("""
                    CREATE TABLE employment_tax_rates (
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
                    INSERT INTO employment_tax_rates 
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
                    CREATE TABLE professional_tax_rates (
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
                    CREATE TABLE business_tax_rates (
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
                cursor.execute(tax_rates_sql.format(table_name='professional_tax_rates'))

                # Insert business tax rates
                cursor.execute("""
                    INSERT INTO business_tax_rates 
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
                cursor.execute("DROP TABLE IF EXISTS foreign_tax_rates")
                cursor.execute("""
                    CREATE TABLE foreign_tax_rates (
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
                    INSERT INTO foreign_tax_rates 
                    (period_type, bracket_order, rate, bracket_limit, relief_amount, foreign_type, is_flat_rate)
                    VALUES 
                    -- Remitted foreign income (15% flat rate)
                    ('monthly', 1, 15.00, 99999999.99, 0.00, 'remitted', 1),
                    ('quarterly', 1, 15.00, 99999999.99, 0.00, 'remitted', 1),
                    ('annually', 1, 15.00, 99999999.99, 0.00, 'remitted', 1),

                    -- Other foreign income (progressive rates - matching employment income)
                    ('monthly', 1, 6.00, 83333.33, 150000.00, 'other', 0),
                    ('monthly', 2, 18.00, 41666.67, NULL, 'other', 0),
                    ('monthly', 3, 24.00, 41666.67, NULL, 'other', 0),
                    ('monthly', 4, 30.00, 41666.67, NULL, 'other', 0),
                    ('monthly', 5, 36.00, 99999999.99, NULL, 'other', 0),
                    
                    -- Quarterly rates for other foreign income
                    ('quarterly', 1, 6.00, 250000.00, 450000.00, 'other', 0),
                    ('quarterly', 2, 18.00, 125000.00, NULL, 'other', 0),
                    ('quarterly', 3, 24.00, 125000.00, NULL, 'other', 0),
                    ('quarterly', 4, 30.00, 125000.00, NULL, 'other', 0),
                    ('quarterly', 5, 36.00, 99999999.99, NULL, 'other', 0),
                    
                    -- Annual rates for other foreign income
                    ('annually', 1, 6.00, 1000000.00, 1800000.00, 'other', 0),
                    ('annually', 2, 18.00, 500000.00, NULL, 'other', 0),
                    ('annually', 3, 24.00, 500000.00, NULL, 'other', 0),
                    ('annually', 4, 30.00, 500000.00, NULL, 'other', 0),
                    ('annually', 5, 36.00, 99999999.99, NULL, 'other', 0)
                """)

                # Create rental tax rates table
                cursor.execute("""
                    CREATE TABLE rental_tax_rates (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        period_type VARCHAR(10) NOT NULL,
                        bracket_order INT NOT NULL,
                        rate DECIMAL(5,2) NOT NULL,
                        bracket_limit DECIMAL(12,2) NOT NULL,
                        relief_amount DECIMAL(12,2),
                        is_active BOOLEAN DEFAULT TRUE,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                        UNIQUE KEY period_bracket (period_type, bracket_order)
                    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
                """)

                # Insert rental tax rates
                cursor.execute("""
                    INSERT INTO rental_tax_rates 
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
                    CREATE TABLE rental_tax_parameters (
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
                    CREATE TABLE dividend_tax_rates (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        rate DECIMAL(5,2) NOT NULL,
                        is_active BOOLEAN DEFAULT TRUE,
                        effective_from DATE DEFAULT (CURRENT_DATE),
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                        UNIQUE KEY rate_effective (rate, effective_from)
                    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
                """)

                # Insert dividend tax rate (15%)
                cursor.execute("""
                    INSERT INTO dividend_tax_rates 
                    (rate, is_active, effective_from)
                    VALUES 
                    (15.00, 1, '2025-04-01')
                """)

                # Create interest tax rates table
                cursor.execute("""
                    CREATE TABLE interest_tax_rates (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        period_type VARCHAR(10) NOT NULL,
                        rate DECIMAL(5,2) NOT NULL,
                        bracket_limit DECIMAL(12,2) NOT NULL,
                        relief_amount DECIMAL(12,2),
                        wht_rate DECIMAL(5,2) NOT NULL,
                        exemption_limit DECIMAL(12,2) NOT NULL,
                        is_active BOOLEAN DEFAULT TRUE,
                        effective_from DATE DEFAULT (CURRENT_DATE),
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                        UNIQUE KEY period_rate (period_type, rate)
                    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
                """)

                # Insert interest tax parameters (effective April 1, 2025)
                cursor.execute("""
                    INSERT INTO interest_tax_rates 
                    (period_type, rate, bracket_limit, relief_amount, wht_rate, exemption_limit, effective_from)
                    VALUES 
                    -- Monthly rates
                    ('monthly', 10.00, 99999999.99, 150000.00, 10.00, 150000.00, '2025-04-01'),
                    
                    -- Quarterly rates
                    ('quarterly', 10.00, 99999999.99, 450000.00, 10.00, 450000.00, '2025-04-01'),
                    
                    -- Annual rates
                    ('annually', 10.00, 99999999.99, 1800000.00, 10.00, 1800000.00, '2025-04-01')
                """)

                # Create royalty tax rates table
                cursor.execute("""
                    CREATE TABLE royalty_tax_rates (
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

                # Insert progressive tax rates for royalty income
                cursor.execute("""
                    INSERT INTO royalty_tax_rates 
                    (period_type, bracket_order, rate, bracket_limit, relief_amount)
                    VALUES
                    ('monthly', 1, 0, 100000, 100000),
                    ('monthly', 2, 6, 41667, NULL),
                    ('monthly', 3, 12, 41667, NULL),
                    ('monthly', 4, 18, 41667, NULL),
                    ('monthly', 5, 24, 41667, NULL),
                    ('monthly', 6, 30, 41667, NULL),
                    ('quarterly', 1, 0, 300000, 300000),
                    ('quarterly', 2, 6, 125000, NULL),
                    ('quarterly', 3, 12, 125000, NULL),
                    ('quarterly', 4, 18, 125000, NULL),
                    ('quarterly', 5, 24, 125000, NULL),
                    ('quarterly', 6, 30, 125000, NULL),
                    ('annually', 1, 0, 1200000, 1200000),
                    ('annually', 2, 6, 500000, NULL),
                    ('annually', 3, 12, 500000, NULL),
                    ('annually', 4, 18, 500000, NULL),
                    ('annually', 5, 24, 500000, NULL),
                    ('annually', 6, 30, 500000, NULL)
                """)

                # Create pension tax rates table
                cursor.execute("""
                    CREATE TABLE pension_tax_rates (
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

                # Insert progressive tax rates for pension income
                cursor.execute("""
                    INSERT INTO pension_tax_rates 
                    (period_type, bracket_order, rate, bracket_limit, relief_amount)
                    VALUES
                    ('monthly', 1, 0, 100000, 100000),
                    ('monthly', 2, 6, 41667, NULL),
                    ('monthly', 3, 12, 41667, NULL),
                    ('monthly', 4, 18, 41667, NULL),
                    ('monthly', 5, 24, 41667, NULL),
                    ('monthly', 6, 30, 41667, NULL),
                    ('quarterly', 1, 0, 300000, 300000),
                    ('quarterly', 2, 6, 125000, NULL),
                    ('quarterly', 3, 12, 125000, NULL),
                    ('quarterly', 4, 18, 125000, NULL),
                    ('quarterly', 5, 24, 125000, NULL),
                    ('quarterly', 6, 30, 125000, NULL),
                    ('annually', 1, 0, 1200000, 1200000),
                    ('annually', 2, 6, 500000, NULL),
                    ('annually', 3, 12, 500000, NULL),
                    ('annually', 4, 18, 500000, NULL),
                    ('annually', 5, 24, 500000, NULL),
                    ('annually', 6, 30, 500000, NULL)
                """)

                # Insert rental parameters
                cursor.execute("""
                    INSERT INTO rental_tax_parameters 
                    (period_type, rental_relief_percentage, wht_threshold, wht_rate, relief_amount)
                    VALUES 
                    ('monthly', 25.00, 100000.00, 10.00, 150000.00),
                    ('quarterly', 25.00, 300000.00, 10.00, 450000.00),
                    ('annually', 25.00, 1200000.00, 10.00, 1800000.00)
                """)

                # Create capital gain tax rates table
                cursor.execute("""
                    CREATE TABLE capital_gain_tax_rates (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        period_type VARCHAR(10) NOT NULL,
                        rate DECIMAL(5,2) NOT NULL,
                        bracket_limit DECIMAL(12,2) NOT NULL DEFAULT 99999999.99,
                        relief_amount DECIMAL(12,2) DEFAULT 0.00,
                        is_flat_rate BOOLEAN DEFAULT TRUE,
                        is_active BOOLEAN DEFAULT TRUE,
                        effective_from DATE DEFAULT (CURRENT_DATE),
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                        UNIQUE KEY period_rate_effective (period_type, rate, effective_from)
                    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
                """)

                # Insert capital gains tax rates (15% flat rate for all periods)
                cursor.execute("""
                    INSERT INTO capital_gain_tax_rates 
                    (period_type, rate, bracket_limit, relief_amount, is_flat_rate, effective_from)
                    VALUES 
                    -- Monthly rates
                    ('monthly', 15.00, 99999999.99, 0.00, TRUE, '2025-04-01'),
                    
                    -- Quarterly rates
                    ('quarterly', 15.00, 99999999.99, 0.00, TRUE, '2025-04-01'),
                    
                    -- Annual rates
                    ('annually', 15.00, 99999999.99, 0.00, TRUE, '2025-04-01')
                """)

                self.stdout.write(self.style.SUCCESS('Successfully initialized tax rates tables'))

        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error: {str(e)}'))
            raise e