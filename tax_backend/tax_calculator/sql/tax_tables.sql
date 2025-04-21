-- Income Types Table
CREATE TABLE income_types (
    id INT PRIMARY KEY AUTO_INCREMENT,
    type_code VARCHAR(20) UNIQUE NOT NULL,
    type_name VARCHAR(100) NOT NULL,
    has_period BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tax Periods Table
CREATE TABLE tax_periods (
    id INT PRIMARY KEY AUTO_INCREMENT,
    period_code VARCHAR(20) UNIQUE NOT NULL,
    period_name VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tax Rates Table
CREATE TABLE tax_rates (
    id INT PRIMARY KEY AUTO_INCREMENT,
    income_type_id INT NOT NULL,
    period_id INT NOT NULL,
    bracket_order INT NOT NULL,
    rate DECIMAL(5,2) NOT NULL,
    bracket_limit DECIMAL(12,2) NOT NULL,
    relief_amount DECIMAL(12,2),
    effective_from DATE NOT NULL,
    effective_to DATE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (income_type_id) REFERENCES income_types(id),
    FOREIGN KEY (period_id) REFERENCES tax_periods(id),
    UNIQUE KEY unique_bracket (income_type_id, period_id, bracket_order, effective_from)
);