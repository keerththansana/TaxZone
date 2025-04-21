-- Insert Income Types
INSERT INTO income_types (type_code, type_name, has_period) VALUES
('employment', 'Employment Income', true),
('professional', 'Professional Services Income', true),
('business', 'Business Income', true),
('investment', 'Investment Income', true),
('rental', 'Rental Income', true),
('dividend', 'Dividend Income', false),
('interest', 'Interest Income', false),
('royalty', 'Royalty Income', true),
('pension', 'Pension Income', true),
('capital_gains', 'Capital Gains', false);

-- Insert Tax Periods
INSERT INTO tax_periods (period_code, period_name) VALUES
('monthly', 'Monthly'),
('quarterly', 'Quarterly'),
('annually', 'Annually');

-- Insert Tax Rates for Employment Income (Example)
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
    CASE tp.period_code
        WHEN 'annually' THEN 1200000.00
        WHEN 'quarterly' THEN 300000.00
        WHEN 'monthly' THEN 100000.00
    END,
    CASE tp.period_code
        WHEN 'annually' THEN 1800000.00
        WHEN 'quarterly' THEN 450000.00
        WHEN 'monthly' THEN 150000.00
    END,
    '2024-04-01',
    true
FROM income_types it
CROSS JOIN tax_periods tp
WHERE it.type_code = 'employment';