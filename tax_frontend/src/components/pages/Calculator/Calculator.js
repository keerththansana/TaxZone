import React, { useState } from 'react';
import { Calculator as CalcIcon } from "lucide-react";
import Header from '../../common/Header/Header';
import styles from './Calculator.module.css';
import CalculatorResponse from './Calculator_Response.js';
//import AuthPrompt from '../../common/AuthPrompt/AuthPrompt';

const Calculator = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [formData, setFormData] = useState({
        taxYear: '2024/2025',
        taxType: '',
        period: '',
        amount: '',
        businessType: '',
        foreignType: ''
    });
    const [results, setResults] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    //if (!isAuthenticated) {
    //   return <AuthPrompt service="Tax Calculator" />;
    //}

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

    // Add tax years array
    const taxYears = [
        { id: '2024/2025', label: '2024/2025' },
        { id: '2025/2026', label: '2025/2026' }
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
        setLoading(true);
        setError(null);

        try {
            const response = await fetch('http://localhost:8000/api/calculator/calculate/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...formData,
                    amount: Number(formData.amount),
                    taxYear: formData.taxYear,
                    foreignType: formData.foreignType
                })
            });

            const data = await response.json();
            
            if (data.success) {
                setResults(data);
            } else {
                setError(data.error || 'Calculation failed');
            }
        } catch (err) {
            setError('Failed to calculate tax');
            console.error('Calculation error:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        
        <div className="calculator-page">
            <Header />
            <div className={styles.container}>
                <div className={styles.calculatorWrapper}>
                    <div className={styles.calculator}>
                        <div className={styles.header}>
                            <CalcIcon className={styles.icon} />
                            <h1>Tax Calculator</h1>
                        </div>
                        <div><p className={styles.note}>
                                <em>Note: This calculation is for guidance only and is not a final tax assessment.</em>
                            </p></div>

                        <form className={styles.form} onSubmit={handleSubmit}>
                            <div className={styles.formGroup}>
                                <label>Tax Year</label>
                                <select
                                    name="taxYear"
                                    value={formData.taxYear}
                                    onChange={handleChange}
                                    required
                                >
                                    {taxYears.map(year => (
                                        <option key={year.id} value={year.id}>
                                            {year.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

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
            
        </div>
        
    );
};

export default Calculator;
