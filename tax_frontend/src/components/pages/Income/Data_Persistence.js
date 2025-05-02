import { useState, useEffect } from 'react';

export const useFormPersist = (key, initialValue) => {
    const [data, setData] = useState(() => {
        const savedData = localStorage.getItem(key);
        return savedData ? JSON.parse(savedData) : initialValue;
    });

    useEffect(() => {
        localStorage.setItem(key, JSON.stringify(data));
    }, [key, data]);

    return [data, setData];
};

export const useIncomeData = () => {
    const [incomeData, setIncomeData] = useState({
        summaryData: [],
        assessableIncome: 0,
        taxableIncome: 0,
        totalTaxPayable: 0
    });

    const calculateTaxLiability = (income) => {
        if (income <= 1200000) return income * 0.06;
        if (income <= 2400000) return 72000 + (income - 1200000) * 0.12;
        if (income <= 3600000) return 216000 + (income - 2400000) * 0.18;
        if (income <= 4800000) return 432000 + (income - 3600000) * 0.24;
        if (income <= 6000000) return 720000 + (income - 4800000) * 0.30;
        return 1080000 + (income - 6000000) * 0.36;
    };

    const processIncomeCategory = (category, data) => {
        switch(category) {
            case 'employment':
                return processEmploymentIncome(data);
            case 'investment':
                return processInvestmentIncome(data);
            case 'business':
                return processBusinessIncome(data);
            case 'terminal':
                return processTerminalBenefits(data);
            case 'other':
                return processOtherIncome(data);
            default:
                return null;
        }
    };

    const processEmploymentIncome = (data) => {
        const summary = {
            category: 'Employment Income',
            amount: 0,
            entries: [],
            deductions: []
        };

        // Process primary employment entries
        if (data.primaryEntries?.length) {
            data.primaryEntries.forEach(entry => {
                summary.entries.push({
                    type: 'Primary Employment',
                    name: entry.name,
                    amount: Number(entry.amount)
                });
                summary.amount += Number(entry.amount);
            });
        }

        // Process secondary employment entries
        if (data.secondaryEntries?.length) {
            data.secondaryEntries.forEach(entry => {
                summary.entries.push({
                    type: 'Secondary Employment',
                    name: entry.name,
                    amount: Number(entry.amount)
                });
                summary.amount += Number(entry.amount);
            });
        }

        // Process APIT entries
        if (data.apitEntries?.length) {
            summary.deductions = data.apitEntries.map(entry => ({
                name: entry.name || 'APIT Deduction',
                amount: Number(entry.amount)
            }));
        }

        return summary.amount > 0 ? summary : null;
    };

    const processInvestmentIncome = (data) => {
        const summary = {
            category: 'Investment Income',
            amount: 0,
            entries: []
        };

        // Process interest income
        if (data.interestEntries?.length) {
            data.interestEntries.forEach(entry => {
                summary.entries.push({
                    type: 'Interest',
                    name: entry.name,
                    amount: Number(entry.amount)
                });
                summary.amount += Number(entry.amount);
            });
        }

        // Process dividend income
        if (data.dividendEntries?.length) {
            data.dividendEntries.forEach(entry => {
                summary.entries.push({
                    type: 'Dividend',
                    name: entry.name,
                    amount: Number(entry.amount)
                });
                summary.amount += Number(entry.amount);
            });
        }

        // Process rental income
        if (data.rentEntries?.length) {
            data.rentEntries.forEach(entry => {
                summary.entries.push({
                    type: 'Rental',
                    name: entry.name,
                    amount: Number(entry.amount)
                });
                summary.amount += Number(entry.amount);
            });
        }

        // Process capital gains
        if (data.capitalGainEntries?.length) {
            data.capitalGainEntries.forEach(entry => {
                summary.entries.push({
                    type: 'Capital Gains',
                    name: entry.name,
                    amount: Number(entry.amount)
                });
                summary.amount += Number(entry.amount);
            });
        }

        return summary.amount > 0 ? summary : null;
    };

    const processBusinessIncome = (data) => {
        const summary = {
            category: 'Business Income',
            amount: 0,
            entries: [],
            deductions: []
        };

        // Process main business entries
        if (data.businessEntries?.length) {
            data.businessEntries.forEach(entry => {
                summary.entries.push({
                    type: 'Business Income',
                    name: entry.name || 'Business Revenue',
                    amount: Number(entry.amount)
                });
                summary.amount += Number(entry.amount);
            });
        }

        // Process partnership entries if any
        if (data.partnershipEntries?.length) {
            data.partnershipEntries.forEach(entry => {
                summary.entries.push({
                    type: 'Partnership Income',
                    name: entry.name || 'Partnership Share',
                    amount: Number(entry.amount)
                });
                summary.amount += Number(entry.amount);
            });
        }

        // Process WHT deductions if any
        if (data.whtEntries?.length) {
            summary.deductions = data.whtEntries.map(entry => ({
                name: entry.name || 'WHT Deduction',
                amount: Number(entry.amount)
            }));
        }

        return summary.amount > 0 ? summary : null;
    };

    const processTerminalBenefits = (data) => {
        const summary = {
            category: 'Terminal Benefits',
            amount: 0,
            entries: [],
            deductions: [], // Added deductions array for consistency
            description: 'End of service and retirement benefits',
            totalAmount: 0
        };

        // Process commuted pension entries
        if (data.commutedEntries?.length) {
            let commutedTotal = 0;
            data.commutedEntries.forEach(entry => {
                if (entry.amount) {
                    summary.entries.push({
                        type: 'Commuted Pension',
                        name: entry.name || 'Commuted Pension',
                        amount: Number(entry.amount),
                        description: 'Lump sum received instead of regular pension payments (Exempt up to Rs. 10,000,000)'
                    });
                    commutedTotal += Number(entry.amount);
                }
            });
            summary.amount += commutedTotal;
        }

        // Process gratuity entries
        if (data.gratuityEntries?.length) {
            let gratuityTotal = 0;
            data.gratuityEntries.forEach(entry => {
                if (entry.amount) {
                    summary.entries.push({
                        type: 'Retiring Gratuity',
                        name: entry.name || 'Retiring Gratuity',
                        amount: Number(entry.amount),
                        description: 'Retirement benefit based on years of service (Exempt up to Rs. 2,000,000)'
                    });
                    gratuityTotal += Number(entry.amount);
                }
            });
            summary.amount += gratuityTotal;
        }

        // Process compensation entries
        if (data.compensationEntries?.length) {
            let compensationTotal = 0;
            data.compensationEntries.forEach(entry => {
                if (entry.amount) {
                    summary.entries.push({
                        type: 'Compensation for Loss of Office',
                        name: entry.name || 'Compensation',
                        amount: Number(entry.amount),
                        description: 'Payment for termination under approved scheme (Exempt up to Rs. 2,000,000)'
                    });
                    compensationTotal += Number(entry.amount);
                }
            });
            summary.amount += compensationTotal;
        }

        // Process ETF entries
        if (data.etfEntries?.length) {
            let etfTotal = 0;
            data.etfEntries.forEach(entry => {
                if (entry.amount) {
                    summary.entries.push({
                        type: 'ETF Payment',
                        name: entry.name || 'ETF Payment',
                        amount: Number(entry.amount),
                        description: 'Employee Trust Fund benefits (Subject to special tax rates)'
                    });
                    etfTotal += Number(entry.amount);
                }
            });
            summary.amount += etfTotal;
        }

        // Process other terminal benefit entries
        if (data.otherEntries?.length) {
            let otherTotal = 0;
            data.otherEntries.forEach(entry => {
                if (entry.amount) {
                    summary.entries.push({
                        type: 'Other Terminal Benefits',
                        name: entry.name || 'Other Benefits',
                        amount: Number(entry.amount),
                        description: 'Other retirement or end of service benefits'
                    });
                    otherTotal += Number(entry.amount);
                }
            });
            summary.amount += otherTotal;
        }

        // Add subtotals to summary
        summary.subtotals = [
            {
                type: 'Total Commuted Pension',
                amount: summary.entries
                    .filter(entry => entry.type === 'Commuted Pension')
                    .reduce((sum, entry) => sum + entry.amount, 0)
            },
            {
                type: 'Total Gratuity',
                amount: summary.entries
                    .filter(entry => entry.type === 'Retiring Gratuity')
                    .reduce((sum, entry) => sum + entry.amount, 0)
            },
            {
                type: 'Total Compensation',
                amount: summary.entries
                    .filter(entry => entry.type === 'Compensation for Loss of Office')
                    .reduce((sum, entry) => sum + entry.amount, 0)
            },
            {
                type: 'Total ETF',
                amount: summary.entries
                    .filter(entry => entry.type === 'ETF Payment')
                    .reduce((sum, entry) => sum + entry.amount, 0)
            }
        ].filter(subtotal => subtotal.amount > 0);

        summary.totalAmount = summary.amount;

        return summary.amount > 0 ? summary : null;
    };

    const processOtherIncome = (data) => {
        const summary = {
            category: 'Other Income',
            amount: 0,
            entries: []
        };

        // Process service income
        if (data.serviceEntries?.length) {
            data.serviceEntries.forEach(entry => {
                summary.entries.push({
                    type: 'Service Income',
                    name: entry.name,
                    amount: Number(entry.amount)
                });
                summary.amount += Number(entry.amount);
            });
        }

        // Process royalty income
        if (data.royaltyEntries?.length) {
            data.royaltyEntries.forEach(entry => {
                summary.entries.push({
                    type: 'Royalty Income',
                    name: entry.name,
                    amount: Number(entry.amount)
                });
                summary.amount += Number(entry.amount);
            });
        }

        return summary.amount > 0 ? summary : null;
    };

    useEffect(() => {
        const handleStorageChange = () => {
            const selectedCategories = JSON.parse(sessionStorage.getItem('selectedCategories') || '[]');
            let newSummaryData = [];
            let totalIncome = 0;

            selectedCategories.forEach(category => {
                const data = JSON.parse(sessionStorage.getItem(`${category}IncomeData`));
                if (data) {
                    const categorySummary = processIncomeCategory(category, data);
                    if (categorySummary) {
                        newSummaryData.push(categorySummary);
                        totalIncome += categorySummary.amount;
                    }
                }
            });

            const taxLiability = calculateTaxLiability(totalIncome);
            setIncomeData({
                summaryData: newSummaryData,
                assessableIncome: totalIncome,
                taxableIncome: totalIncome,
                totalTaxPayable: taxLiability
            });
        };

        handleStorageChange();
        window.addEventListener('storage', handleStorageChange);
        window.addEventListener('incomeDataUpdated', handleStorageChange);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('incomeDataUpdated', handleStorageChange);
        };
    }, []);

    return incomeData;
};