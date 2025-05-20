from django.core.management.base import BaseCommand # type: ignore
from django.db import connection # type: ignore
from datetime import date

class Command(BaseCommand):
    help = 'Initialize tax rate tables for 2024'

    def handle(self, *args, **options):
        try:
            with connection.cursor() as cursor:
                # Drop existing tables first
                tables = [
                    'employment_tax_rates_2024',
                    'professional_tax_rates_2024',
                    'business_tax_rates_2024',
                    'foreign_tax_rates_2024',
                    'rental_tax_rates_2024',
                    'rental_tax_parameters_2024',
                    'dividend_tax_rates_2024',
                    'interest_tax_rates_2024',
                    'royalty_tax_rates_2024',
                    'pension_tax_rates_2024',
                    'capital_gain_tax_rates_2024'
                ]

                # Drop existing tables
                for table in tables:
                    cursor.execute(f"DROP TABLE IF EXISTS {table}")

                # Create business tax rates table first
                cursor.execute("""
                    CREATE TABLE business_tax_rates_2024 (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        period_type VARCHAR(10) NOT NULL,
                        bracket_order INT NOT NULL,
                        rate DECIMAL(5,2) NOT NULL,
                        bracket_limit DECIMAL(12,2) NOT NULL,
                        relief_amount DECIMAL(12,2),
                        business_type VARCHAR(20) DEFAULT 'general',
                        is_active BOOLEAN DEFAULT TRUE,
                        is_flat_rate BOOLEAN DEFAULT FALSE,
                        effective_from DATE DEFAULT '2024-04-01',
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                        UNIQUE KEY period_bracket_type (period_type, bracket_order, business_type)
                    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
                """)

                # Create employment tax rates table
                cursor.execute("""
                    CREATE TABLE employment_tax_rates_2024 (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        period_type VARCHAR(10) NOT NULL,
                        bracket_order INT NOT NULL,
                        rate DECIMAL(5,2) NOT NULL,
                        bracket_limit DECIMAL(12,2) NOT NULL,
                        relief_amount DECIMAL(12,2),
                        is_active BOOLEAN DEFAULT TRUE,
                        is_flat_rate BOOLEAN DEFAULT FALSE,
                        effective_from DATE DEFAULT '2024-04-01',
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                        UNIQUE KEY period_bracket (period_type, bracket_order)
                    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
                """)

                # Update the employment tax rates insert statement
                cursor.execute("""
                    INSERT INTO employment_tax_rates_2024
                    (period_type, bracket_order, rate, bracket_limit, relief_amount)
                    VALUES 
                    -- Monthly rates (2024)
                    -- First 100,000 is tax-free relief, so start brackets after that
                    ('monthly', 1, 6.00, 41666.67, 100000.00),   -- First 500,000 (after relief)
                    ('monthly', 2, 12.00, 41666.67, NULL),       -- Next 500,000
                    ('monthly', 3, 18.00, 41666.67, NULL),       -- Next 500,000
                    ('monthly', 4, 24.00, 41666.67, NULL),       -- Next 500,000
                    ('monthly', 5, 30.00, 41666.67, NULL),       -- Next 500,000
                    ('monthly', 6, 36.00, 99999999.99, NULL),    -- Above 2,500,000
                    
                    -- Quarterly rates (2024)
                    -- First 300,000 is tax-free relief (100,000 * 3)
                    ('quarterly', 1, 6.00, 125000.00, 300000.00), -- First 1,500,000 (after relief)
                    ('quarterly', 2, 12.00, 125000.00, NULL),     -- Next 1,500,000
                    ('quarterly', 3, 18.00, 125000.00, NULL),     -- Next 1,500,000
                    ('quarterly', 4, 24.00, 125000.00, NULL),     -- Next 1,500,000
                    ('quarterly', 5, 30.00, 125000.00, NULL),     -- Next 1,500,000
                    ('quarterly', 6, 36.00, 99999999.99, NULL),   -- Above 7,500,000
                    
                    -- Annual rates (2024)
                    -- First 1,200,000 is tax-free relief (100,000 * 12)
                    ('annually', 1, 6.00, 500000.00, 1200000.00), -- First 6,000,000 (after relief)
                    ('annually', 2, 12.00, 500000.00, NULL),      -- Next 6,000,000
                    ('annually', 3, 18.00, 500000.00, NULL),      -- Next 6,000,000
                    ('annually', 4, 24.00, 500000.00, NULL),      -- Next 6,000,000
                    ('annually', 5, 30.00, 500000.00, NULL),      -- Next 6,000,000
                    ('annually', 6, 36.00, 99999999.99, NULL)     -- Above 30,000,000
                """)

                # Add after employment tax rates table creation and before business tax rates
                cursor.execute("""
                    CREATE TABLE professional_tax_rates_2024 (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        period_type VARCHAR(10) NOT NULL,
                        bracket_order INT NOT NULL,
                        rate DECIMAL(5,2) NOT NULL,
                        bracket_limit DECIMAL(12,2) NOT NULL,
                        relief_amount DECIMAL(12,2),
                        is_active BOOLEAN DEFAULT TRUE,
                        is_flat_rate BOOLEAN DEFAULT FALSE,
                        effective_from DATE DEFAULT '2024-04-01',
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                        UNIQUE KEY period_bracket (period_type, bracket_order)
                    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
                """)

                # Insert professional tax rates - same as employment rates for 2024
                cursor.execute("""
                    INSERT INTO professional_tax_rates_2024
                    (period_type, bracket_order, rate, bracket_limit, relief_amount)
                    VALUES 
                    -- Monthly rates (2024)
                    ('monthly', 1, 6.00, 41666.67, 100000.00),   -- First 500,000 (after relief)
                    ('monthly', 2, 12.00, 41666.67, NULL),       -- Next 500,000
                    ('monthly', 3, 18.00, 41666.67, NULL),       -- Next 500,000
                    ('monthly', 4, 24.00, 41666.67, NULL),       -- Next 500,000
                    ('monthly', 5, 30.00, 41666.67, NULL),       -- Next 500,000
                    ('monthly', 6, 36.00, 99999999.99, NULL),    -- Above 2,500,000
                    
                    -- Quarterly rates (2024)
                    ('quarterly', 1, 6.00, 125000.00, 300000.00), -- First 1,500,000 (after relief)
                    ('quarterly', 2, 12.00, 125000.00, NULL),     -- Next 1,500,000
                    ('quarterly', 3, 18.00, 125000.00, NULL),     -- Next 1,500,000
                    ('quarterly', 4, 24.00, 125000.00, NULL),     -- Next 1,500,000
                    ('quarterly', 5, 30.00, 125000.00, NULL),     -- Next 1,500,000
                    ('quarterly', 6, 36.00, 99999999.99, NULL),   -- Above 7,500,000
                    
                    -- Annual rates (2024)
                    ('annually', 1, 6.00, 500000.00, 1200000.00), -- First 6,000,000 (after relief)
                    ('annually', 2, 12.00, 500000.00, NULL),      -- Next 6,000,000
                    ('annually', 3, 18.00, 500000.00, NULL),      -- Next 6,000,000
                    ('annually', 4, 24.00, 500000.00, NULL),      -- Next 6,000,000
                    ('annually', 5, 30.00, 500000.00, NULL),      -- Next 6,000,000
                    ('annually', 6, 36.00, 99999999.99, NULL)     -- Above 30,000,000
                """)

                # Insert business tax rates
                cursor.execute("""
                    INSERT INTO business_tax_rates_2024
                    (period_type, bracket_order, rate, bracket_limit, relief_amount, business_type, is_flat_rate)
                    VALUES 
                    -- Regular business rates - Monthly (2024)
                    ('monthly', 1, 6.00, 41666.67, 100000.00, 'general', FALSE),
                    ('monthly', 2, 12.00, 41666.67, NULL, 'general', FALSE),
                    ('monthly', 3, 18.00, 41666.67, NULL, 'general', FALSE),
                    ('monthly', 4, 24.00, 41666.67, NULL, 'general', FALSE),
                    ('monthly', 5, 30.00, 41666.67, NULL, 'general', FALSE),
                    ('monthly', 6, 36.00, 99999999.99, NULL, 'general', FALSE),
                    
                    -- Regular business rates - Quarterly (2024)
                    ('quarterly', 1, 6.00, 125000.00, 300000.00, 'general', FALSE),
                    ('quarterly', 2, 12.00, 125000.00, NULL, 'general', FALSE),
                    ('quarterly', 3, 18.00, 125000.00, NULL, 'general', FALSE),
                    ('quarterly', 4, 24.00, 125000.00, NULL, 'general', FALSE),
                    ('quarterly', 5, 30.00, 125000.00, NULL, 'general', FALSE),
                    ('quarterly', 6, 36.00, 99999999.99, NULL, 'general', FALSE),
                    
                    -- Regular business rates - Annual (2024)
                    ('annually', 1, 6.00, 500000.00, 1200000.00, 'general', FALSE),
                    ('annually', 2, 12.00, 500000.00, NULL, 'general', FALSE),
                    ('annually', 3, 18.00, 500000.00, NULL, 'general', FALSE),
                    ('annually', 4, 24.00, 500000.00, NULL, 'general', FALSE),
                    ('annually', 5, 30.00, 500000.00, NULL, 'general', FALSE),
                    ('annually', 6, 36.00, 99999999.99, NULL, 'general', FALSE),
                    
                    -- Special business rates (40% flat rate for 2024)
                    ('monthly', 1, 40.00, 99999999.99, 0.00, 'special', TRUE),
                    ('quarterly', 1, 40.00, 99999999.99, 0.00, 'special', TRUE),
                    ('annually', 1, 40.00, 99999999.99, 0.00, 'special', TRUE)
                """)

                # Create foreign tax rates table
                cursor.execute("""
                    CREATE TABLE foreign_tax_rates_2024 (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        period_type VARCHAR(10) NOT NULL,
                        bracket_order INT NOT NULL,
                        rate DECIMAL(5,2) NOT NULL,
                        bracket_limit DECIMAL(12,2) NOT NULL,
                        relief_amount DECIMAL(12,2),
                        foreign_type VARCHAR(20) NOT NULL,
                        is_flat_rate BOOLEAN DEFAULT FALSE,
                        is_active BOOLEAN DEFAULT TRUE,
                        effective_from DATE DEFAULT '2024-04-01',
                        UNIQUE KEY period_bracket_type (period_type, bracket_order, foreign_type)
                    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
                """)

                # Insert foreign tax rates
                cursor.execute("""
                    INSERT INTO foreign_tax_rates_2024 
                    (period_type, bracket_order, rate, bracket_limit, relief_amount, foreign_type, is_flat_rate)
                    VALUES 
                    -- Foreign income is tax exempt for 2024
                    ('monthly', 1, 0.00, 99999999.99, 0.00, 'remitted', TRUE),
                    ('quarterly', 1, 0.00, 99999999.99, 0.00, 'remitted', TRUE),
                    ('annually', 1, 0.00, 99999999.99, 0.00, 'remitted', TRUE)
                """)

                # Create rental tax rates table
                cursor.execute("""
                    CREATE TABLE rental_tax_rates_2024 (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        period_type VARCHAR(10) NOT NULL,
                        bracket_order INT NOT NULL,
                        rate DECIMAL(5,2) NOT NULL,
                        bracket_limit DECIMAL(12,2) NOT NULL,
                        relief_amount DECIMAL(12,2),
                        is_active BOOLEAN DEFAULT TRUE,
                        is_flat_rate BOOLEAN DEFAULT FALSE,
                        effective_from DATE DEFAULT '2024-04-01',
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                        UNIQUE KEY period_bracket (period_type, bracket_order)
                    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
                """)

                # Insert rental tax rates
                cursor.execute("""
                    INSERT INTO rental_tax_rates_2024
                    (period_type, bracket_order, rate, bracket_limit, relief_amount)
                    VALUES 
                    -- Monthly rates (based on taxable income after 25% deduction)
                    ('monthly', 1, 6.00, 41666.67, 100000.00),   -- First 500,000 of taxable income
                    ('monthly', 2, 12.00, 41666.67, NULL),       -- Next 500,000 of taxable income
                    ('monthly', 3, 18.00, 41666.67, NULL),       -- Next 500,000 of taxable income
                    ('monthly', 4, 24.00, 41666.67, NULL),       -- Next 500,000 of taxable income
                    ('monthly', 5, 30.00, 41666.67, NULL),       -- Next 500,000 of taxable income
                    ('monthly', 6, 36.00, 99999999.99, NULL),    -- Above 2,500,000 of taxable income

                    -- Quarterly rates (based on taxable income after 25% deduction)
                    ('quarterly', 1, 6.00, 125000.00, 300000.00), -- First 1,500,000 of taxable income
                    ('quarterly', 2, 12.00, 125000.00, NULL),     -- Next 1,500,000 of taxable income
                    ('quarterly', 3, 18.00, 125000.00, NULL),     -- Next 1,500,000 of taxable income
                    ('quarterly', 4, 24.00, 125000.00, NULL),     -- Next 1,500,000 of taxable income
                    ('quarterly', 5, 30.00, 125000.00, NULL),     -- Next 1,500,000 of taxable income
                    ('quarterly', 6, 36.00, 99999999.99, NULL),   -- Above 7,500,000 of taxable income
                    
                    -- Annual rates (based on taxable income after 25% deduction)
                    ('annually', 1, 6.00, 500000.00, 1200000.00), -- First 6,000,000 of taxable income
                    ('annually', 2, 12.00, 500000.00, NULL),      -- Next 6,000,000 of taxable income
                    ('annually', 3, 18.00, 500000.00, NULL),      -- Next 6,000,000 of taxable income
                    ('annually', 4, 24.00, 500000.00, NULL),      -- Next 6,000,000 of taxable income
                    ('annually', 5, 30.00, 500000.00, NULL),      -- Next 6,000,000 of taxable income
                    ('annually', 6, 36.00, 99999999.99, NULL)     -- Above 30,000,000 of taxable income
                """)

                # Update rental tax parameters table creation
                cursor.execute("""
                    CREATE TABLE rental_tax_parameters_2024 (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        parameter_name VARCHAR(50) NOT NULL,
                        parameter_value DECIMAL(5,2) NOT NULL,
                        is_active BOOLEAN DEFAULT TRUE,
                        effective_from DATE DEFAULT '2024-04-01',
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                        UNIQUE KEY param_name (parameter_name)
                    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
                """)

                # Insert rental parameters with correct relief rate
                cursor.execute("""
                    INSERT INTO rental_tax_parameters_2024
                    (parameter_name, parameter_value)
                    VALUES 
                    ('rental_relief_rate', 25.00),
                    ('wht_rate', 10.00)
                """)

                # Create dividend tax rates table
                cursor.execute("""
                    CREATE TABLE dividend_tax_rates_2024 (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        period_type VARCHAR(10) NOT NULL,
                        bracket_order INT NOT NULL,
                        rate DECIMAL(5,2) NOT NULL,
                        bracket_limit DECIMAL(12,2) NOT NULL,
                        relief_amount DECIMAL(12,2),  -- Added relief_amount column
                        is_active BOOLEAN DEFAULT TRUE,
                        is_flat_rate BOOLEAN DEFAULT TRUE,
                        effective_from DATE DEFAULT '2024-04-01',
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
                """)

                # Insert dividend tax rates (14% flat rate for 2024)
                cursor.execute("""
                    INSERT INTO dividend_tax_rates_2024
                    (period_type, bracket_order, rate, bracket_limit, relief_amount)
                    VALUES 
                    -- Monthly rates
                    ('monthly', 1, 14.00, 99999999.99, 0.00),
                    -- Quarterly rates
                    ('quarterly', 1, 14.00, 99999999.99, 0.00),
                    -- Annual rates
                    ('annually', 1, 14.00, 99999999.99, 0.00)
                """)

                # Update interest tax rates table creation
                cursor.execute("""
                    CREATE TABLE interest_tax_rates_2024 (
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
                        effective_from DATE DEFAULT '2024-04-01',
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
                """)

                # Update interest tax rates insert
                cursor.execute("""
                    INSERT INTO interest_tax_rates_2024
                    (period_type, bracket_order, rate, bracket_limit, relief_amount, wht_rate, wht_threshold)
                    VALUES 
                    ('monthly', 1, 14.00, 99999999.99, 0.00, 10.00, 150000.00),
                    ('quarterly', 1, 14.00, 99999999.99, 0.00, 10.00, 450000.00),
                    ('annually', 1, 14.00, 99999999.99, 0.00, 10.00, 1800000.00)
                """)

                # Create capital gains tax rates table
                cursor.execute("""
                    CREATE TABLE capital_gain_tax_rates_2024 (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        period_type VARCHAR(10) NOT NULL,
                        bracket_order INT NOT NULL,
                        rate DECIMAL(5,2) NOT NULL,
                        bracket_limit DECIMAL(12,2) NOT NULL,
                        relief_amount DECIMAL(12,2),
                        is_active BOOLEAN DEFAULT TRUE,
                        is_flat_rate BOOLEAN DEFAULT TRUE,
                        effective_from DATE DEFAULT '2024-04-01',
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                        UNIQUE KEY period_bracket (period_type, bracket_order)
                    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
                """)

                # Insert capital gains tax rates for all periods
                cursor.execute("""
                    INSERT INTO capital_gain_tax_rates_2024
                    (period_type, bracket_order, rate, bracket_limit, relief_amount, is_active, is_flat_rate)
                    VALUES 
                    -- Annual rates (capital gains are typically annual)
                    ('annually', 1, 10.00, 99999999.99, 0.00, TRUE, TRUE),
                    -- Monthly rates
                    ('monthly', 1, 10.00, 99999999.99, 0.00, TRUE, TRUE),
                    -- Quarterly rates
                    ('quarterly', 1, 10.00, 99999999.99, 0.00, TRUE, TRUE)
                """)

                # First clear existing data
                cursor.execute("TRUNCATE TABLE rental_tax_rates_2024")

                # Insert rental tax rates with brackets for final taxable amount
                cursor.execute("""
                    INSERT INTO rental_tax_rates_2024
                    (period_type, bracket_order, rate, bracket_limit, relief_amount)
                    VALUES 
                    -- Monthly rates (brackets apply to amount after 25% deduction AND relief)
                    ('monthly', 1, 6.00, 41666.67, 100000.00),   -- First bracket
                    ('monthly', 2, 12.00, 41666.67, NULL),       -- Second bracket
                    ('monthly', 3, 18.00, 41666.67, NULL),       -- Third bracket
                    ('monthly', 4, 24.00, 41666.67, NULL),       -- Fourth bracket
                    ('monthly', 5, 30.00, 41666.67, NULL),       -- Fifth bracket
                    ('monthly', 6, 36.00, 99999999.99, NULL),    -- Final bracket

                    -- Quarterly rates (brackets apply to amount after 25% deduction AND relief)
                    ('quarterly', 1, 6.00, 125000.00, 300000.00), -- First bracket
                    ('quarterly', 2, 12.00, 125000.00, NULL),     -- Second bracket
                    ('quarterly', 3, 18.00, 125000.00, NULL),     -- Third bracket
                    ('quarterly', 4, 24.00, 125000.00, NULL),     -- Fourth bracket
                    ('quarterly', 5, 30.00, 125000.00, NULL),     -- Fifth bracket
                    ('quarterly', 6, 36.00, 99999999.99, NULL),   -- Final bracket

                    -- Annual rates (brackets apply to amount after 25% deduction AND relief)
                    ('annually', 1, 6.00, 500000.00, 1200000.00), -- First bracket
                    ('annually', 2, 12.00, 500000.00, NULL),      -- Next bracket
                    ('annually', 3, 18.00, 500000.00, NULL),      -- Next bracket
                    ('annually', 4, 24.00, 500000.00, NULL),      -- Next bracket
                    ('annually', 5, 30.00, 500000.00, NULL),      -- Next bracket
                    ('annually', 6, 36.00, 99999999.99, NULL)     -- Final bracket
                """)

                self.stdout.write(self.style.SUCCESS('Successfully initialized 2024 tax rates tables'))

        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error: {str(e)}'))
            raise e