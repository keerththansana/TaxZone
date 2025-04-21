import React, { useState } from 'react';
import { Calculator as CalcIcon } from "lucide-react";
import styles from './Calculator.module.css';
import CalculatorResponse from './Calculator_Response.js';

const Calculator = () => {
    const [formData, setFormData] = useState({
        taxType: '',
        period: '',
        amount: '',
        businessType: ''
    });

    const [results, setResults] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const taxTypes = [
        { id: 'employment', label: 'Employment Income', hasPeriod: true },
        { id: 'professional', label: 'Professional Services Income', hasPeriod: true },
        { id: 'business', label: 'Business Income', hasPeriod: true, hasBusinessType: true },
        { id: 'foreign', label: 'Foreign Income', hasPeriod: true },
        { id: 'rental', label: 'Rental Income', hasPeriod: true },
        { id: 'dividend', label: 'Dividend Income', hasPeriod: false },
        { id: 'interest', label: 'Interest Income', hasPeriod: false },
        { id: 'royalty', label: 'Royalty Income', hasPeriod: true },
        { id: 'pension', label: 'Pension Income', hasPeriod: true },
        { id: 'capital_gains', label: 'Capital Gains', hasPeriod: false }
    ];

    const periods = [
        { id: 'monthly', label: 'Monthly' },
        { id: 'quarterly', label: 'Quarterly' },
        { id: 'annually', label: 'Annually' }
    ];

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        try {
            setError(null);
            setResults(null);

            // Create request data with business type
            const requestData = {
                taxType: formData.taxType.toLowerCase(),
                period: formData.period.toLowerCase(),
                amount: Number(formData.amount),
                // Include businessType for business income
                ...(formData.taxType === 'business' && { businessType: formData.businessType }),
                // Keep existing foreign type handling
                ...(formData.taxType === 'foreign' && { foreignType: formData.foreignType })
            };

            console.log('Sending request:', requestData);

            const response = await fetch('http://localhost:8000/api/calculator/calculate/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestData)
            });

            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Calculation failed');
            }

            // For special business types, ensure 45% rate is applied
            if (formData.taxType === 'business' && formData.businessType === 'special') {
                data.total_tax = Number(formData.amount) * 0.45;
                data.taxable_income = Number(formData.amount);
                data.relief_amount = 0;

                data.business_type = 'special';
                data.show_zero_relief = true; // Add flag to show 0 LKR relief
                data.brackets = [{
                    rate: 45,
                    limit: Number(formData.amount),
                    taxable_amount: Number(formData.amount),
                    tax_amount: data.total_tax
                }];
            }

            setResults(data);
        } catch (error) {
            console.error('Calculation Error:', error);
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.calculatorWrapper}>
                <div className={styles.calculator}>
                    <div className={styles.header}>
                        <CalcIcon className={styles.icon} />
                        <h1>Tax Calculator</h1>
                    </div>

                    <form className={styles.form} onSubmit={handleSubmit}>
                        <div className={styles.formGroup}>
                            <label>Income Type</label>
                            <select 
                                name="taxType"
                                value={formData.taxType}
                                onChange={handleChange}
                                required
                            >
                                <option value="">Select Income Type</option>
                                {taxTypes.map(type => (
                                    <option key={type.id} value={type.id}>
                                        {type.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Business type selection */}
                        {formData.taxType === 'business' && (
                            <div className={styles.formGroup}>
                                <label>Business Type</label>
                                <select
                                    name="businessType"
                                    value={formData.businessType}
                                    onChange={handleChange}
                                    required
                                >
                                    <option value="">Select Business Type</option>
                                    <option value="general">General Business</option>
                                    <option value="special">Betting/Gaming/Liquor/Tobacco</option>
                                </select>
                            </div>
                        )}

                        {/* Foreign income type selection - moved before period */}
                        {formData.taxType === 'foreign' && (
                            <div className={styles.formGroup}>
                                <label>Foreign Income Type</label>
                                <select
                                    name="foreignType"
                                    value={formData.foreignType}
                                    onChange={handleChange}
                                    required
                                >
                                    <option value="">Select Foreign Income Type</option>
                                    <option value="remitted">Foreign Currency Remitted through Bank</option>
                                    <option value="other">Other Foreign Income</option>
                                </select>
                            </div>
                        )}

                        {/* Period selection */}
                        {formData.taxType && taxTypes.find(t => t.id === formData.taxType)?.hasPeriod && (
                            <div className={styles.formGroup}>
                                <label>Period</label>
                                <select
                                    name="period"
                                    value={formData.period}
                                    onChange={handleChange}
                                    required
                                >
                                    <option value="">Select Period</option>
                                    {periods.map(period => (
                                        <option key={period.id} value={period.id}>
                                            {period.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <div className={styles.formGroup}>
                            <label>Amount (LKR)</label>
                            <input
                                type="number"
                                name="amount"
                                value={formData.amount}
                                onChange={handleChange}
                                placeholder="Enter amount"
                                required
                                min="0"
                            />
                        </div>

                        {error && (
                            <div className={styles.error}>
                                {error}
                            </div>
                        )}

                        <div className={styles.buttonContainer}>
                            <button 
                                type="submit" 
                                className={styles.button}
                                disabled={loading}
                            >
                                {loading ? 'Calculating...' : 'Calculate Tax'}
                            </button>
                        </div>
                    </form>
                </div>

                {results && <CalculatorResponse results={results} />}
            </div>
        </div>
    );
};

export default Calculator;
