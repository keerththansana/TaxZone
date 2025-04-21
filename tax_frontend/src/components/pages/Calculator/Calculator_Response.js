import React from 'react';
import styles from './Calculator.module.css';

const CalculatorResponse = ({ results }) => {
    if (!results) return null;

    const formatCurrency = (amount) => {
        // Handle null, undefined, or empty string
        if (amount == null || amount === '') return 'LKR 0.00';
        
        // Convert string to number and handle possible string inputs
        const numberAmount = typeof amount === 'string' ? parseFloat(amount) : Number(amount);
        
        // Check if it's a valid number
        if (isNaN(numberAmount)) return 'LKR 0.00';
        
        try {
            return new Intl.NumberFormat('en-LK', {
                style: 'currency',
                currency: 'LKR',
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }).format(numberAmount);
        } catch (error) {
            console.error('Currency formatting error:', error);
            return `LKR ${numberAmount.toFixed(2)}`;
        }
    };

    const calculateTaxRate = (tax, income) => {
        if (!income || income === 0) return 0;
        return ((tax / income) * 100).toFixed(2);
    };

    return (
        <div className={styles.resultSection}>
            <div className={styles.resultHeader}>
                <h2>Tax Calculation - {results.period}</h2>
            </div>

            <div className={styles.resultContent}>
                <div className={styles.topSummary}>
                    <div className={styles.summaryRow}>
                        <span>Gross Income:</span>
                        <span>{formatCurrency(results.gross_income)}</span>
                    </div>
                    
                    {/* Show tax relief for employment, professional, and general business income */}
                    {(results.tax_type === 'employment' || 
                      results.tax_type === 'professional' || 
                      (results.tax_type === 'business' && results.business_type === 'general')) && (
                        <div className={styles.summaryRow}>
                            <span>Less: Personal Relief ({results.period}):</span>
                            <span className={styles.relief}>
                                ({formatCurrency(results.gross_income - results.taxable_income)})
                            </span>
                        </div>
                    )}
                    
                    {/* Special business type (betting/gaming) relief */}
                    {results.tax_type === 'business' && results.business_type === 'special' && (
                        <div className={styles.summaryRow}>
                            <span>Less: Tax Relief:</span>
                            <span className={styles.relief}>
                                ({formatCurrency(0)})
                            </span>
                        </div>
                    )}
                    
                    {/* Rental income section */}
                    {results.tax_type === 'rental' && (
                        <>
                            <div className={styles.summaryRow}>
                                <span>Less: Rental Income Relief (25%):</span>
                                <span className={styles.relief}>
                                    ({formatCurrency(results.rental_relief)})
                                </span>
                            </div>
                            <div className={styles.summaryRow}>
                                <span>Net Rental Income after 25% Relief:</span>
                                <span>{formatCurrency(results.net_rental_income)}</span>
                            </div>
                            <div className={styles.summaryRow}>
                                <span>Less: Standard Relief ({results.period}):</span>
                                <span className={styles.relief}>
                                    ({formatCurrency(results.relief_amount)})
                                </span>
                            </div>

                            {results.wht_applicable && (
                                <div className={styles.summaryRow}>
                                    <span>Withholding Tax (WHT):</span>
                                    <span className={styles.wht}>
                                        {formatCurrency(results.wht_amount)}
                                    </span>
                                </div>
                            )}
                        </>
                    )}

                    {/* Add foreign income relief */}
                    {results.tax_type === 'foreign' && (
                        <div className={styles.summaryRow}>
                            <span>Less: Tax Relief ({results.period}):</span>
                            <span className={styles.relief}>
                                {results.foreignType === 'remitted' ? (
                                    `(${formatCurrency(0)})`
                                ) : (
                                    `(${formatCurrency(results.relief_amount)})`
                                )}
                            </span>
                        </div>
                    )}

                    {/* Dividend income section */}
                    {results.tax_type === 'dividend' && (
                        <div className={styles.summaryRow}>
                            <span>Less: Tax Relief:</span>
                            <span className={styles.relief}>
                                ({formatCurrency(0)})
                            </span>
                        </div>
                    )}

                    {/* Interest income section */}
                    {results.tax_type === 'interest' && (
                        <>
                            <div className={styles.summaryRow}>
                                <span>Less: Tax Relief:</span>
                                <span className={styles.relief}>
                                    ({formatCurrency(0)})
                                </span>
                            </div>
                            {results.wht_applicable ? (
                                <>
                                    <div className={styles.summaryRow}>
                                        <span>Withholding Tax (WHT) @ 10%:</span>
                                        <span className={styles.wht}>
                                            {formatCurrency(results.wht_amount)}
                                        </span>
                                    </div>
                                    <div className={styles.infoNote}>
                                        * WHT is an advance payment of tax. Final liability depends on total income.
                                        {results.gross_income <= results.wht_threshold && 
                                            " You may be exempt if monthly income is below LKR 150,000."}
                                    </div>
                                </>
                            ) : (
                                <div className={styles.infoNote}>
                                    * No WHT applicable as income is below threshold (LKR 150,000)
                                </div>
                            )}
                        </>
                    )}

                    {/* Royalty income section */}
                    {results.tax_type === 'royalty' && (
                        <div className={styles.summaryRow}>
                            <span>Less: Tax Relief ({results.period}):</span>
                            <span className={styles.relief}>
                                ({formatCurrency(results.relief_amount)})
                            </span>
                        </div>
                    )}

                    {/* Pension income section */}
                    {results.tax_type === 'pension' && (
                        <div className={styles.summaryRow}>
                            <span>Less: Tax Relief ({results.period}):</span>
                            <span className={styles.relief}>
                                ({formatCurrency(results.relief_amount)})
                            </span>
                        </div>
                    )}
                    
                    {/* Capital gains section */}
                    {results.tax_type === 'capital_gains' && (
                        <div className={styles.summaryRow}>
                            <span>Less: Tax Relief:</span>
                            <span className={styles.relief}>
                                ({formatCurrency(0)})
                            </span>
                        </div>
                    )}

                    <div className={`${styles.summaryRow} ${styles.highlight}`}>
                        <span>Taxable Income:</span>
                        <span>{formatCurrency(results.taxable_income)}</span>
                    </div>
                </div>

                <div className={styles.taxTable}>
                    <table>
                        <thead>
                            <tr>
                                <th>Income Type</th>
                                <th>Rate</th>
                                <th>Taxable Amount</th>
                                <th>Tax Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            {results.tax_type === 'dividend' ? (
                                <tr>
                                    <td>Dividend Income</td>
                                    <td className={styles.rateColumn}>{`${results.brackets[0].rate}%`}</td>
                                    <td className={styles.amountColumn}>
                                        {formatCurrency(results.taxable_income)}
                                    </td>
                                    <td className={styles.amountColumn}>
                                        {formatCurrency(results.total_tax)}
                                    </td>
                                </tr>
                            ) : (
                                results.brackets
                                    .filter(bracket => bracket.taxable_amount > 0)
                                    .map((bracket, index) => (
                                        <tr key={index}>
                                            <td className={styles.rangeColumn}>
                                                {bracket.rate === 0 ? 
                                                    `First ${formatCurrency(bracket.limit)} (Tax Free Relief)` :
                                                    index === results.brackets.filter(b => b.taxable_amount > 0).length - 1 ?
                                                        `Exceeding ${formatCurrency(bracket.cumulative_limit)}` :
                                                        `${formatCurrency(bracket.cumulative_limit)} - ${formatCurrency(bracket.next_limit)}`
                                                }
                                            </td>
                                            <td className={styles.rateColumn}>
                                                {`${bracket.rate}%`}
                                            </td>
                                            <td className={styles.amountColumn}>
                                                {formatCurrency(bracket.taxable_amount)}
                                            </td>
                                            <td className={styles.amountColumn}>
                                                {formatCurrency(bracket.tax_amount)}
                                            </td>
                                        </tr>
                                    ))
                            )}
                            {/* Total Tax Row */}
                            <tr className={styles.totalRow}>
                                <td colSpan="3" className={styles.totalLabel}>Total Tax Payable</td>
                                <td className={`${styles.amountColumn} ${styles.totalAmount}`}>
                                    {formatCurrency(results.total_tax)}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

            </div>
        </div>
    );
};

// Make sure to export the component
export default CalculatorResponse;