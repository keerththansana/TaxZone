-- First, truncate the existing table
TRUNCATE TABLE business_tax_rates;

-- Insert the new tax rates that match employment income tax structure
INSERT INTO business_tax_rates 
(period_type, bracket_order, rate, bracket_limit, relief_amount, business_type, is_flat_rate)
VALUES 
-- Regular business rates (monthly)
('monthly', 1, 6.00, 83333.33, 150000.00, 'general', 0),
('monthly', 2, 12.00, 41666.67, NULL, 'general', 0),
('monthly', 3, 18.00, 41666.67, NULL, 'general', 0),
('monthly', 4, 24.00, 41666.67, NULL, 'general', 0),
('monthly', 5, 30.00, 41666.67, NULL, 'general', 0),
('monthly', 6, 36.00, 99999999.99, NULL, 'general', 0),

-- Special business rate (monthly)
('monthly', 1, 45.00, 99999999.99, 0.00, 'special', 1),

-- Regular business rates (quarterly)
('quarterly', 1, 6.00, 250000.00, 450000.00, 'general', 0),
('quarterly', 2, 12.00, 125000.00, NULL, 'general', 0),
('quarterly', 3, 18.00, 125000.00, NULL, 'general', 0),
('quarterly', 4, 24.00, 125000.00, NULL, 'general', 0),
('quarterly', 5, 30.00, 125000.00, NULL, 'general', 0),
('quarterly', 6, 36.00, 99999999.99, NULL, 'general', 0),

-- Special business rate (quarterly)
('quarterly', 1, 45.00, 99999999.99, 0.00, 'special', 1),

-- Regular business rates (annually)
('annually', 1, 6.00, 1000000.00, 1800000.00, 'general', 0),
('annually', 2, 12.00, 500000.00, NULL, 'general', 0),
('annually', 3, 18.00, 500000.00, NULL, 'general', 0),
('annually', 4, 24.00, 500000.00, NULL, 'general', 0),
('annually', 5, 30.00, 500000.00, NULL, 'general', 0),
('annually', 6, 36.00, 99999999.99, NULL, 'general', 0),

-- Special business rate (annually)
('annually', 1, 45.00, 99999999.99, 0.00, 'special', 1); 