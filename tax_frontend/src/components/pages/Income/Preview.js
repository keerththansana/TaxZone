import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, FileText } from 'lucide-react';
import styles from './Preview.module.css';
import TaxationMenu from './Taxation_Menu';

const Preview = () => {
    const [summaryData, setSummaryData] = useState([]);
    const [assessableIncome, setAssessableIncome] = useState(0);
    const [taxableIncome, setTaxableIncome] = useState(0);
    const [taxLiability, setTaxLiability] = useState(0);
    const [totalTaxPayable, setTotalTaxPayable] = useState(0);
    const [reliefs, setReliefs] = useState({});
    const [qualifyingPayments, setQualifyingPayments] = useState({});
    const [creditsAvailable, setCreditsAvailable] = useState({});
    const [selectedCategories, setSelectedCategories] = useState([]);
    const [categoryData, setCategoryData] = useState({});
    const [employmentDetails, setEmploymentDetails] = useState({
        totalIncome: 0,
        apitDeductions: 0,
    });
    const navigate = useNavigate();

    // Add event listener for storage changes
    useEffect(() => {
        const handleStorageChange = (e) => {
            if (e.key && e.key.includes('IncomeData')) {
                const categories = JSON.parse(sessionStorage.getItem('selectedCategories') || '[]');
                loadCategoryData(categories);
            }
        };

        // Listen for storage changes
        window.addEventListener('storage', handleStorageChange);

        // Initial load
        const categories = JSON.parse(sessionStorage.getItem('selectedCategories') || '[]');
        loadCategoryData(categories);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
        };
    }, []);

    // Update the useEffect for employment data sync
    useEffect(() => {
        const handleEmploymentDataUpdate = () => {
            try {
                const empData = JSON.parse(sessionStorage.getItem('employmentIncomeData'));
                if (empData) {
                    // Calculate total from primary employment
                    const primaryTotal = (empData.primaryEntries || []).reduce(
                        (sum, entry) => sum + (Number(entry.amount) || 0),
                        0
                    );

                    // Calculate total from secondary employment
                    const secondaryTotal = (empData.secondaryEntries || []).reduce(
                        (sum, entry) => sum + (Number(entry.amount) || 0),
                        0
                    );

                    // Set total employment income
                    const totalEmploymentIncome = primaryTotal + secondaryTotal;

                    // Calculate APIT if present
                    const apitTotal = (empData.apitEntries || []).reduce(
                        (sum, entry) => sum + (Number(entry.amount) || 0),
                        0
                    );

                    setEmploymentDetails({
                        totalIncome: totalEmploymentIncome,
                        apitDeductions: apitTotal,
                    });

                    // Update summary data
                    updateSummaryData(totalEmploymentIncome, apitTotal);
                }
            } catch (error) {
                console.error('Error processing employment data:', error);
            }
        };

        // Add event listener for storage changes
        window.addEventListener('storage', handleEmploymentDataUpdate);
        // Initial load
        handleEmploymentDataUpdate();

        return () => window.removeEventListener('storage', handleEmploymentDataUpdate);
    }, []);

    // Update the useEffect for data sync
    useEffect(() => {
        const handleDataChange = () => {
            try {
                // Get selected categories
                const categories = JSON.parse(sessionStorage.getItem('selectedCategories') || '[]');
                let totalIncome = 0;
                let newSummaryData = [];

                // Process each selected category
                categories.forEach((category) => {
                    const data = JSON.parse(sessionStorage.getItem(`${category}IncomeData`) || '{}');

                    switch (category) {
                        case 'employment':
                            if (data) {
                                const primaryTotal = (data.primaryEntries || []).reduce(
                                    (sum, entry) => sum + (Number(entry.amount) || 0),
                                    0
                                );
                                const secondaryTotal = (data.secondaryEntries || []).reduce(
                                    (sum, entry) => sum + (Number(entry.amount) || 0),
                                    0
                                );
                                const empTotal = primaryTotal + secondaryTotal;

                                if (empTotal > 0) {
                                    newSummaryData.push({
                                        category: 'Employment Income',
                                        amount: empTotal,
                                    });
                                    totalIncome += empTotal;

                                    // Handle APIT if present
                                    const apitTotal = (data.apitEntries || []).reduce(
                                        (sum, entry) => sum + (Number(entry.amount) || 0),
                                        0
                                    );
                                    if (apitTotal > 0) {
                                        setCreditsAvailable((prev) => ({
                                            ...prev,
                                            APIT: apitTotal,
                                        }));
                                    }
                                }
                            }
                            break;

                        case 'business':
                            if (data) {
                                const busTotal = Object.values(data).reduce((sum, entries) => {
                                    if (Array.isArray(entries)) {
                                        return sum + entries.reduce(
                                            (entrySum, entry) => entrySum + (Number(entry.amount) || 0),
                                            0
                                        );
                                    }
                                    return sum;
                                }, 0);

                                if (busTotal > 0) {
                                    newSummaryData.push({
                                        category: 'Business Income',
                                        amount: busTotal,
                                    });
                                    totalIncome += busTotal;
                                }
                            }
                            break;

                        // Add similar cases for other income types
                    }
                });

                // Update state with new data
                setSummaryData(newSummaryData);
                setAssessableIncome(totalIncome);

                // Calculate deductions and tax
                const reliefTotal = Object.values(reliefs).reduce((sum, val) => sum + (Number(val) || 0), 0);
                const qualifyingTotal = Object.values(qualifyingPayments).reduce((sum, entries) => {
                    if (Array.isArray(entries)) {
                        return sum + entries.reduce((entrySum, entry) => entrySum + (Number(entry.amount) || 0), 0);
                    }
                    return sum;
                }, 0);

                // Calculate taxable income
                const taxableAmount = Math.max(0, totalIncome - reliefTotal - qualifyingTotal);
                setTaxableIncome(taxableAmount);

                // Calculate tax liability
                const liability = calculateTaxLiability(taxableAmount);
                setTaxLiability(liability);

                // Calculate final tax payable
                const creditsTotal = Object.values(creditsAvailable).reduce((sum, val) => sum + (Number(val) || 0), 0);
                setTotalTaxPayable(Math.max(0, liability - creditsTotal));
            } catch (error) {
                console.error('Error updating preview:', error);
            }
        };

        // Add event listeners
        window.addEventListener('storage', handleDataChange);
        document.addEventListener('visibilitychange', handleDataChange);

        // Initial load
        handleDataChange();

        return () => {
            window.removeEventListener('storage', handleDataChange);
            document.removeEventListener('visibilitychange', handleDataChange);
        };
    }, [reliefs, qualifyingPayments, creditsAvailable]);

    const loadCategoryData = (categories) => {
        const data = {};
        let summaryItems = [];
        let totalIncome = 0;
        let creditsData = {};

        // Process each selected category
        categories.forEach((category) => {
            const storageKey = `${category}IncomeData`;
            const rawData = sessionStorage.getItem(storageKey);

            if (rawData) {
                const categoryData = JSON.parse(rawData);

                switch (category) {
                    case 'employment':
                        if (hasValidEntries(categoryData)) {
                            const empTotal = calculateEmploymentTotal(categoryData);
                            if (empTotal > 0) {
                                summaryItems.push({
                                    category: 'Employment Income',
                                    amount: empTotal,
                                });
                                totalIncome += empTotal;

                                // Add APIT if present
                                if (categoryData.apitEntries?.length > 0) {
                                    const apitTotal = calculateTotal(categoryData.apitEntries);
                                    if (apitTotal > 0) {
                                        creditsData['APIT'] = apitTotal;
                                    }
                                }
                            }
                            data[category] = categoryData;
                        }
                        break;

                    // Similar cases for other income types
                    // ...existing switch cases...
                }
            }
        });

        // Update state with new data
        setCategoryData(data);
        setSummaryData(summaryItems);
        setAssessableIncome(totalIncome);
        setCreditsAvailable(creditsData);

        // Recalculate tax
        updateTaxCalculations(totalIncome, creditsData);
    };

    const getCategoryLabel = (category) => {
        const labels = {
            employment: 'Employment Income',
            business: 'Business Income',
            investment: 'Investment Income',
            other: 'Other Income',
            terminal: 'Terminal Benefits',
            qualifying: 'Qualifying Payments',
        };
        return labels[category] || category;
    };

    const hasValidEntries = (data) => {
        if (!data) return false;
        return Object.values(data).some((entries) => {
            if (Array.isArray(entries)) {
                return entries.some((entry) => Number(entry.amount) > 0);
            }
            return false;
        });
    };

    useEffect(() => {
        let summaryItems = [];
        let totalIncome = 0;

        Object.entries(categoryData).forEach(([category, data]) => {
            switch (category) {
                case 'employment':
                    const empData = JSON.parse(sessionStorage.getItem('employmentIncomeData'));
                    if (empData) {
                        const empTotal = calculateEmploymentTotal(empData);
                        if (empTotal > 0) {
                            summaryItems.push({
                                category: 'Employment Income',
                                amount: empTotal,
                            });
                            totalIncome += empTotal;

                            // Add APIT deductions if present
                            if (empData.apitEntries?.length > 0) {
                                const apitTotal = calculateTotal(empData.apitEntries);
                                if (apitTotal > 0) {
                                    setCreditsAvailable((prev) => ({
                                        ...prev,
                                        APIT: apitTotal,
                                    }));
                                }
                            }
                        }
                    }
                    break;

                case 'business':
                    const busData = JSON.parse(sessionStorage.getItem('businessIncomeData'));
                    if (busData) {
                        const busTotal = calculateBusinessTotal(busData);
                        if (busTotal > 0) {
                            summaryItems.push({
                                category: 'Business Income',
                                amount: busTotal,
                            });
                            totalIncome += busTotal;
                        }
                    }
                    break;

                case 'investment':
                    const invData = JSON.parse(sessionStorage.getItem('investmentIncomeData'));
                    if (invData) {
                        const invTotal = calculateInvestmentTotal(invData);
                        if (invTotal > 0) {
                            summaryItems.push({
                                category: 'Investment Income',
                                amount: invTotal,
                            });
                            totalIncome += invTotal;
                        }
                    }
                    break;

                // Add other cases for remaining income types
            }
        });

        setSummaryData(summaryItems);
        setAssessableIncome(totalIncome);

        // Calculate taxable income after deductions
        const reliefTotal = Object.values(reliefs).reduce((sum, val) => sum + Number(val), 0);
        const qualifyingTotal = Object.values(qualifyingPayments).reduce((sum, entries) => {
            if (Array.isArray(entries)) {
                return sum + entries.reduce((entrySum, entry) => entrySum + Number(entry.amount || 0), 0);
            }
            return sum;
        }, 0);

        const taxableAmount = Math.max(0, totalIncome - reliefTotal - qualifyingTotal);
        setTaxableIncome(taxableAmount);

        // Calculate tax liability
        const liability = calculateTaxLiability(taxableAmount);
        setTaxLiability(liability);

        // Calculate final tax payable
        const creditsTotal = Object.values(creditsAvailable).reduce((sum, val) => sum + Number(val), 0);
        setTotalTaxPayable(Math.max(0, liability - creditsTotal));
    }, [categoryData, reliefs, qualifyingPayments, creditsAvailable]);

    const calculateTotal = (entries) => {
        return entries.reduce((sum, entry) => sum + (Number(entry.amount) || 0), 0);
    };

    const calculateTaxLiability = (income) => {
        if (income <= 1200000) return income * 0.06;
        if (income <= 2400000) return 72000 + (income - 1200000) * 0.12;
        if (income <= 3600000) return 216000 + (income - 2400000) * 0.18;
        if (income <= 4800000) return 432000 + (income - 3600000) * 0.24;
        if (income <= 6000000) return 720000 + (income - 4800000) * 0.30;
        return 1080000 + (income - 6000000) * 0.36;
    };

    // Helper functions for calculating totals
    const calculateEmploymentTotal = (data) => {
        const primary = data.primaryEntries?.reduce((sum, entry) => sum + (Number(entry.amount) || 0), 0) || 0;
        const secondary = data.secondaryEntries?.reduce((sum, entry) => sum + (Number(entry.amount) || 0), 0) || 0;
        return primary + secondary;
    };

    const calculateBusinessTotal = (data) => {
        return Object.values(data).reduce((sum, entries) => {
            if (Array.isArray(entries)) {
                return sum + entries.reduce((entrySum, entry) => entrySum + (Number(entry.amount) || 0), 0);
            }
            return sum;
        }, 0);
    };

    const calculateDeductions = (data) => {
        if (!data) return 0;
        return Object.values(data).reduce((sum, entry) => sum + (Number(entry.amount) || 0), 0);
    };

    // Add this helper function for investment total
    const calculateInvestmentTotal = (data) => {
        const interestTotal = data.interestEntries?.reduce((sum, entry) => sum + (Number(entry.amount) || 0), 0) || 0;
        const dividendTotal = data.dividendEntries?.reduce((sum, entry) => sum + (Number(entry.amount) || 0), 0) || 0;
        const rentTotal = data.rentEntries?.reduce((sum, entry) => sum + (Number(entry.amount) || 0), 0) || 0;

        return interestTotal + dividendTotal + rentTotal;
    };

    const updateTaxCalculations = () => {
        // Get current data from state
        const totalIncome = employmentDetails.totalIncome || 0;

        // Calculate tax credits
        const apitDeductions = employmentDetails.apitDeductions || 0;
        const totalCredits = apitDeductions;

        // Calculate taxable income
        const taxableAmount = Math.max(0, totalIncome);
        setTaxableIncome(taxableAmount);

        // Calculate tax liability
        const liability = calculateTaxLiability(taxableAmount);
        setTaxLiability(liability);

        // Calculate final tax payable
        const finalTax = Math.max(0, liability - totalCredits);
        setTotalTaxPayable(finalTax);
    };

    // Update the summary data update function
    const updateSummaryData = (income, deductions) => {
        setSummaryData((prev) => {
            const newData = prev.filter((item) => item.category !== 'Employment Income');
            if (income > 0) {
                newData.push({
                    category: 'Employment Income',
                    amount: income,
                });
            }
            return newData;
        });

        // Update tax credits if APIT exists
        if (deductions > 0) {
            setCreditsAvailable((prev) => ({
                ...prev,
                APIT: deductions,
            }));
        }

        // Update assessable income
        setAssessableIncome(income);

        // Recalculate tax
        const taxableAmount = Math.max(0, income);
        setTaxableIncome(taxableAmount);
        const liability = calculateTaxLiability(taxableAmount);
        setTaxLiability(liability);
        setTotalTaxPayable(Math.max(0, liability - deductions));
    };

    // Update the render section to show real-time status
    return (
        <div className={styles.previewContainer}>
            <TaxationMenu />
            <div className={styles.contentWrapper}>
                <div className={styles.header}>
                    <h1>Tax Return Summary</h1>
                    <div className={styles.actions}>
                        <button className={styles.actionButton}>
                            <Download size={16} />
                            Download PDF
                        </button>
                    </div>
                </div>

                <div className={styles.documentContainer}>
                    <div className={styles.document}>
                        <div className={styles.documentHeader}>
                            <FileText size={24} />
                            <h2>Calculation of Income Tax Liability</h2>
                        </div>

                        <table className={styles.taxTable}>
                            <thead>
                                <tr>
                                    <th>Category</th>
                                    <th>Rs.</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr className={styles.deductionRow}>
                                    <td>Less: Personal Relief (annually)</td>
                                    <td className={styles.negative}>
                                        (Rs. 1,800,000.00)
                                    </td>
                                </tr>
                                {selectedCategories.includes('employment') && (
                                    <>
                                        <tr className={employmentDetails.totalIncome > 0 ? styles.completedRow : styles.pendingRow}>
                                            <td>Employment Income</td>
                                            <td>
                                                {employmentDetails.totalIncome > 0 ? `Rs. ${employmentDetails.totalIncome.toLocaleString()}` : <span className={styles.pending}>Complete employment form...</span>}
                                            </td>
                                        </tr>
                                        {employmentDetails.apitDeductions > 0 && (
                                            <tr className={styles.deductionRow}>
                                                <td>APIT Deductions</td>
                                                <td className={styles.negative}>
                                                    (Rs. {employmentDetails.apitDeductions.toLocaleString()})
                                                </td>
                                            </tr>
                                        )}
                                    </>
                                )}
                                {selectedCategories.map((category) => {
                                    const data = categoryData[category];
                                    const isPending = !data;
                                    const label = getCategoryLabel(category);

                                    if (isPending) {
                                        return (
                                            <tr key={category} className={styles.pendingRow}>
                                                <td>{label}</td>
                                                <td className={styles.pending}>Pending completion...</td>
                                            </tr>
                                        );
                                    }
                                    return null;
                                })}
                                {summaryData.map((item, index) => (
                                    <tr key={`summary-${index}`} className={styles.completedRow}>
                                        <td>{item.category}</td>
                                        <td>Rs. {item.amount.toLocaleString()}</td>
                                    </tr>
                                ))}
                                {assessableIncome > 0 && (
                                    <>
                                        <tr className={styles.totalRow}>
                                            <td>Total Assessable Income</td>
                                            <td>Rs. {assessableIncome.toLocaleString()}</td>
                                        </tr>
                                        <tr className={styles.totalRow}>
                                            <td>Taxable Income</td>
                                            <td>Rs. {taxableIncome.toLocaleString()}</td>
                                        </tr>
                                        <tr className={styles.totalRow}>
                                            <td>Tax Payable</td>
                                            <td>Rs. {totalTaxPayable.toLocaleString()}</td>
                                        </tr>
                                    </>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Preview;