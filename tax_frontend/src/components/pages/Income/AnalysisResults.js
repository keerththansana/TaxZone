import React from 'react';
import styles from './AnalysisResults.module.css';

const AnalysisResults = ({ results, onClose }) => {
    return (
        <div className={styles.overlay}>
            <div className={styles.container}>
                <div className={styles.header}>
                    <h1>Tax Document Analysis Results</h1>
                    <button onClick={onClose} className={styles.closeButton}>×</button>
                </div>
                <div className={styles.content}>
                    {results.map((result, index) => (
                        <div key={index} className={styles.resultCard}>
                            <h2>{result.filename}</h2>
                            {result.error ? (
                                <div className={styles.error}>{result.error}</div>
                            ) : (
                                <div className={styles.analysis}>
                                    <div className={styles.section}>
                                        <h3>Document Type</h3>
                                        <p>{result.analysis.document_type || 'Unknown'}</p>
                                    </div>

                                    <div className={styles.section}>
                                        <h3>Income Items</h3>
                                        {result.analysis.income_items?.length > 0 ? (
                                            <ul>
                                                {result.analysis.income_items.map((item, i) => (
                                                    <li key={i}>
                                                        {item.category}: Rs. {Number(item.amount).toLocaleString()}
                                                    </li>
                                                ))}
                                            </ul>
                                        ) : (
                                            <p>No income items found</p>
                                        )}
                                    </div>

                                    <div className={styles.section}>
                                        <h3>Deductions</h3>
                                        {result.analysis.deductions?.length > 0 ? (
                                            <ul>
                                                {result.analysis.deductions.map((item, i) => (
                                                    <li key={i}>
                                                        {item.type}: Rs. {Number(item.amount).toLocaleString()}
                                                    </li>
                                                ))}
                                            </ul>
                                        ) : (
                                            <p>No deductions found</p>
                                        )}
                                    </div>

                                    <div className={styles.totalIncome}>
                                        <h3>Total Assessable Income</h3>
                                        <p>Rs. {Number(result.analysis.total_assessable_income || 0).toLocaleString()}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default AnalysisResults;