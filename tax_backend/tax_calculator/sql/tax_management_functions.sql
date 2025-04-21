DELIMITER //

-- Function to update tax rate
CREATE PROCEDURE update_tax_rate(
    IN p_income_type VARCHAR(20),
    IN p_period VARCHAR(20),
    IN p_bracket INT,
    IN p_new_rate DECIMAL(5,2),
    IN p_new_relief DECIMAL(12,2)
)
BEGIN
    DECLARE v_income_type_id INT;
    DECLARE v_period_id INT;
    DECLARE v_current_date DATE;
    
    -- Get IDs
    SELECT id INTO v_income_type_id FROM income_types WHERE type_code = p_income_type;
    SELECT id INTO v_period_id FROM tax_periods WHERE period_code = p_period;
    SET v_current_date = CURDATE();
    
    -- Deactivate current rate
    UPDATE tax_rates 
    SET is_active = false,
        effective_to = v_current_date
    WHERE income_type_id = v_income_type_id
        AND period_id = v_period_id
        AND bracket_order = p_bracket
        AND is_active = true;
        
    -- Insert new rate
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
        v_income_type_id,
        v_period_id,
        p_bracket,
        p_new_rate,
        bracket_limit,
        CASE WHEN p_bracket = 1 THEN p_new_relief ELSE NULL END,
        v_current_date,
        true
    FROM tax_rates
    WHERE income_type_id = v_income_type_id
        AND period_id = v_period_id
        AND bracket_order = p_bracket
        AND effective_to = v_current_date;
END //

DELIMITER ;

-- Example usage to update tax rates
CALL update_tax_rate('employment', 'annually', 1, 6.00, 1800000.00);
CALL update_tax_rate('employment', 'annually', 2, 12.00, NULL);