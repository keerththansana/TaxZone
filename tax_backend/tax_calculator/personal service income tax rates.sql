CREATE TABLE personal_service_tax_rates (
    id INT PRIMARY KEY AUTO_INCREMENT,
    period_type ENUM('monthly', 'quarterly', 'annually') NOT NULL,
    bracket_order INT NOT NULL,
    rate DECIMAL(5,2) NOT NULL,
    bracket_limit DECIMAL(12,2) NOT NULL,
    relief_amount DECIMAL(12,2),
    effective_from DATE NOT NULL,
    effective_to DATE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_bracket (period_type, bracket_order, effective_from)
);

-- Insert tax rates for personal service income (2024 rates)
INSERT INTO personal_service_tax_rates 
(period_type, bracket_order, rate, bracket_limit, relief_amount, effective_from, is_active) VALUES
-- Annual rates
('annually', 1, 6.00, 1200000.00, 1800000.00, '2024-04-01', 1),
('annually', 2, 12.00, 1200000.00, NULL, '2024-04-01', 1),
('annually', 3, 18.00, 1200000.00, NULL, '2024-04-01', 1),
('annually', 4, 24.00, 1200000.00, NULL, '2024-04-01', 1),
('annually', 5, 30.00, 1200000.00, NULL, '2024-04-01', 1),
('annually', 6, 36.00, 999999999.99, NULL, '2024-04-01', 1),

-- Monthly rates
('monthly', 1, 6.00, 100000.00, 150000.00, '2024-04-01', 1),
('monthly', 2, 12.00, 100000.00, NULL, '2024-04-01', 1),
('monthly', 3, 18.00, 100000.00, NULL, '2024-04-01', 1),
('monthly', 4, 24.00, 100000.00, NULL, '2024-04-01', 1),
('monthly', 5, 30.00, 100000.00, NULL, '2024-04-01', 1),
('monthly', 6, 36.00, 999999999.99, NULL, '2024-04-01', 1),

-- Quarterly rates
('quarterly', 1, 6.00, 300000.00, 450000.00, '2024-04-01', 1),
('quarterly', 2, 12.00, 300000.00, NULL, '2024-04-01', 1),
('quarterly', 3, 18.00, 300000.00, NULL, '2024-04-01', 1),
('quarterly', 4, 24.00, 300000.00, NULL, '2024-04-01', 1),
('quarterly', 5, 30.00, 300000.00, NULL, '2024-04-01', 1),
('quarterly', 6, 36.00, 999999999.99, NULL, '2024-04-01', 1);

-- Check if tax rates exist for the selected type and period
SELECT COUNT(*) 
FROM tax_rates tr
JOIN income_types it ON tr.income_type_id = it.id
JOIN tax_periods tp ON tr.period_id = tp.id
WHERE it.type_code = 'employment'  -- Replace with your tax type
AND tp.period_code = 'annually'    -- Replace with your period
AND tr.is_active = 1;

-- If no records found, insert tax rates
INSERT INTO tax_rates (
    income_type_id, 
    period_id,
    bracket_order,
    rate,
    bracket_limit,
    relief_amount,
    effective_from,
    is_active
)
SELECT 
    it.id,
    tp.id,
    1,
    6.00,
    1200000.00,
    1800000.00,
    CURRENT_DATE(),
    1
FROM income_types it
JOIN tax_periods tp ON 1=1
WHERE it.type_code = 'employment'
AND tp.period_code = 'annually';