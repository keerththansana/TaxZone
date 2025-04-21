DROP DATABASE IF EXISTS tax;
CREATE DATABASE tax CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE tax;

CREATE TABLE tax_rates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tax_type VARCHAR(20) NOT NULL,
    period_type VARCHAR(10) NOT NULL,
    bracket_order INT NOT NULL,
    rate DECIMAL(5,2) NOT NULL,
    bracket_limit DECIMAL(12,2) NOT NULL,
    relief_amount DECIMAL(12,2),
    effective_from DATE DEFAULT CURRENT_DATE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert employment tax rates
INSERT INTO tax_rates 
(tax_type, period_type, bracket_order, rate, bracket_limit, relief_amount, is_active)
VALUES
('employment', 'annually', 1, 6.00, 1200000.00, 1800000.00, 1),
('employment', 'annually', 2, 12.00, 1200000.00, NULL, 1),
('employment', 'annually', 3, 18.00, 1200000.00, NULL, 1),
('employment', 'annually', 4, 24.00, 1200000.00, NULL, 1),
('employment', 'annually', 5, 30.00, 1200000.00, NULL, 1),
('employment', 'annually', 6, 36.00, 999999999.99, NULL, 1);