CREATE DATABASE tax;
USE tax;

CREATE TABLE tax_rates (
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
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert sample data
INSERT INTO tax_rates (period_type, bracket_order, rate, bracket_limit, relief_amount, effective_from) VALUES
-- Monthly rates
('monthly', 1, 6.00, 83333.33, 150000.00, '2024-01-01'),
('monthly', 2, 18.00, 41666.67, NULL, '2024-01-01'),
('monthly', 3, 24.00, 41666.67, NULL, '2024-01-01'),
('monthly', 4, 30.00, 41666.67, NULL, '2024-01-01'),
('monthly', 5, 36.00, 999999999.99, NULL, '2024-01-01'),

-- Quarterly rates
('quarterly', 1, 6.00, 250000.00, 450000.00, '2024-01-01'),
('quarterly', 2, 18.00, 125000.00, NULL, '2024-01-01'),
('quarterly', 3, 24.00, 125000.00, NULL, '2024-01-01'),
('quarterly', 4, 30.00, 125000.00, NULL, '2024-01-01'),
('quarterly', 5, 36.00, 999999999.99, NULL, '2024-01-01'),

-- Annual rates
('annually', 1, 6.00, 1000000.00, 1800000.00, '2024-01-01'),
('annually', 2, 18.00, 500000.00, NULL, '2024-01-01'),
('annually', 3, 24.00, 500000.00, NULL, '2024-01-01'),
('annually', 4, 30.00, 500000.00, NULL, '2024-01-01'),
('annually', 5, 36.00, 999999999.99, NULL, '2024-01-01');