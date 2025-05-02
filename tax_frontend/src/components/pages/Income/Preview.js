import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, FileText } from 'lucide-react';
import styles from './Preview.module.css';
import TaxationMenu from './Taxation_Menu';

const Preview = () => {
    const [summaryData, setSummaryData] = useState([]);
    const [assessableIncome, setAssessableIncome] = useState(0);
    const [taxableIncome, setTaxableIncome] = useState(0);
    const [totalTaxPayable, setTotalTaxPayable] = useState(0);

    // Single useEffect to load all data
    useEffect(() => {
        const loadAllData = () => {
            const selectedCategories = JSON.parse(sessionStorage.getItem('selectedCategories') || '[]');
            let newSummaryData = [];
            let totalIncome = 0;

            // Enhanced Employment Income handling
            if (selectedCategories.includes('employment')) {
                const employmentData = JSON.parse(sessionStorage.getItem('employmentIncomeData'));
                if (employmentData) {
                    let employmentSummary = {
                        category: 'Employment Income',
                        amount: 0,
                        entries: []
                    };

                    // Process primary employment entries
                    if (employmentData.primaryEntries?.length > 0) {
                        employmentData.primaryEntries.forEach(entry => {
                            employmentSummary.entries.push({
                                type: 'Primary Employment',
                                name: entry.name,
                                amount: Number(entry.amount)
                            });
                            employmentSummary.amount += Number(entry.amount);
                        });
                    }

                    // Process secondary employment entries
                    if (employmentData.secondaryEntries?.length > 0) {
                        employmentData.secondaryEntries.forEach(entry => {
                            employmentSummary.entries.push({
                                type: 'Secondary Employment',
                                name: entry.name,
                                amount: Number(entry.amount)
                            });
                            employmentSummary.amount += Number(entry.amount);
                        });
                    }

                    // Process APIT entries if any
                    if (employmentData.apitEntries?.length > 0) {
                        employmentSummary.deductions = employmentData.apitEntries.map(entry => ({
                            name: entry.name || 'APIT Deduction',
                            amount: Number(entry.amount)
                        }));
                    }

                    if (employmentSummary.amount > 0) {
                        newSummaryData.push(employmentSummary);
                        totalIncome += employmentSummary.amount;
                    }
                }
            }

            // Add Business Income handling
            if (selectedCategories.includes('business')) {
                const businessData = JSON.parse(sessionStorage.getItem('businessIncomeData'));
                if (businessData) {
                    let businessSummary = {
                        category: 'Business Income',
                        amount: 0,
                        entries: []
                    };

                    // Process sole proprietorship entries
                    if (businessData.soleProprietorshipEntries?.length) {
                        businessData.soleProprietorshipEntries.forEach(entry => {
                            businessSummary.entries.push({
                                type: 'Sole Proprietorship',
                                name: entry.name,
                                amount: Number(entry.amount)
                            });
                            businessSummary.amount += Number(entry.amount);
                        });
                    }

                    // Process partnership entries
                    if (businessData.partnershipEntries?.length) {
                        businessData.partnershipEntries.forEach(entry => {
                            businessSummary.entries.push({
                                type: 'Partnership Business',
                                name: entry.name,
                                amount: Number(entry.amount)
                            });
                            businessSummary.amount += Number(entry.amount);
                        });
                    }

                    // Process trust entries
                    if (businessData.trustEntries?.length) {
                        businessData.trustEntries.forEach(entry => {
                            businessSummary.entries.push({
                                type: 'Trust Beneficiary',
                                name: entry.name,
                                amount: Number(entry.amount)
                            });
                            businessSummary.amount += Number(entry.amount);
                        });
                    }

                    // Process betting entries
                    if (businessData.bettingEntries?.length) {
                        businessData.bettingEntries.forEach(entry => {
                            businessSummary.entries.push({
                                type: 'Betting & Gaming',
                                name: entry.name,
                                amount: Number(entry.amount)
                            });
                            businessSummary.amount += Number(entry.amount);
                        });
                    }

                    // Process other business entries
                    if (businessData.otherEntries?.length) {
                        businessData.otherEntries.forEach(entry => {
                            businessSummary.entries.push({
                                type: 'Other Business',
                                name: entry.name,
                                amount: Number(entry.amount)
                            });
                            businessSummary.amount += Number(entry.amount);
                        });
                    }

                    // Process deductions if any
                    if (businessData.deductionEntries) {
                        businessSummary.deductions = Object.values(businessData.deductionEntries)
                            .map(entry => ({
                                name: entry.name || 'Business Deduction',
                                amount: Number(entry.amount)
                            }))
                            .filter(entry => entry.amount > 0);
                    }

                    if (businessSummary.amount > 0) {
                        newSummaryData.push(businessSummary);
                        totalIncome += businessSummary.amount;
                    }
                }
            }

            // Handle Investment Income
            if (selectedCategories.includes('investment')) {
                const investmentData = JSON.parse(sessionStorage.getItem('investmentIncomeData'));
                if (investmentData) {
                    let investmentSummary = {
                        category: 'Investment Income',
                        amount: 0,
                        entries: [],
                        deductions: []
                    };

                    // Process interest income
                    if (investmentData.interestEntries?.length) {
                        investmentData.interestEntries.forEach(entry => {
                            if (entry.amount) {
                                investmentSummary.entries.push({
                                    type: 'Interest Income',
                                    name: entry.name,
                                    amount: Number(entry.amount)
                                });
                                investmentSummary.amount += Number(entry.amount);
                            }
                        });
                    }

                    // Process dividend income
                    if (investmentData.dividendEntries?.length) {
                        investmentData.dividendEntries.forEach(entry => {
                            if (entry.amount) {
                                investmentSummary.entries.push({
                                    type: 'Dividend Income',
                                    name: entry.name,
                                    amount: Number(entry.amount)
                                });
                                investmentSummary.amount += Number(entry.amount);
                            }
                        });
                    }

                    // Process rental income
                    if (investmentData.rentEntries?.length) {
                        investmentData.rentEntries.forEach(entry => {
                            if (entry.amount) {
                                investmentSummary.entries.push({
                                    type: 'Rental Income',
                                    name: entry.name,
                                    amount: Number(entry.amount)
                                });
                                investmentSummary.amount += Number(entry.amount);
                            }
                        });
                    }

                    // Process capital gains
                    if (investmentData.capitalGainEntries?.length) {
                        investmentData.capitalGainEntries.forEach(entry => {
                            if (entry.amount) {
                                investmentSummary.entries.push({
                                    type: 'Capital Gains',
                                    name: entry.name,
                                    amount: Number(entry.amount)
                                });
                                investmentSummary.amount += Number(entry.amount);
                            }
                        });
                    }

                    // Process AIT deductions
                    if (investmentData.taxDeductions?.length) {
                        investmentSummary.deductions = investmentData.taxDeductions.map(entry => ({
                            name: entry.source || 'AIT Deduction',
                            amount: Number(entry.amount)
                        })).filter(deduction => deduction.amount > 0);
                    }

                    if (investmentSummary.amount > 0) {
                        newSummaryData.push(investmentSummary);
                        totalIncome += investmentSummary.amount;
                    }
                }
            }

            // Handle Other Income
            if (selectedCategories.includes('other')) {
                const otherData = JSON.parse(sessionStorage.getItem('otherIncomeData'));
                if (otherData) {
                    let otherSummary = {
                        category: 'Other Income',
                        amount: 0,
                        entries: [],
                        deductions: [],
                        description: 'Income from various other sources including services, royalties, and more'
                    };

                    // Process service income with descriptions
                    if (otherData.serviceEntries?.length) {
                        otherData.serviceEntries.forEach(entry => {
                            if (entry.amount) {
                                otherSummary.entries.push({
                                    type: 'Service Income',
                                    name: entry.name,
                                    amount: Number(entry.amount),
                                    description: 'Professional or service-based income subject to WHT'
                                });
                                otherSummary.amount += Number(entry.amount);
                            }
                        });
                    }

                    // Process royalty income with descriptions
                    if (otherData.royaltyEntries?.length) {
                        otherData.royaltyEntries.forEach(entry => {
                            if (entry.amount) {
                                otherSummary.entries.push({
                                    type: 'Royalty Income',
                                    name: entry.name,
                                    amount: Number(entry.amount),
                                    description: 'Income from intellectual property rights and patents'
                                });
                                otherSummary.amount += Number(entry.amount);
                            }
                        });
                    }

                    // Process resource payments with descriptions
                    if (otherData.resourceEntries?.length) {
                        otherData.resourceEntries.forEach(entry => {
                            if (entry.amount) {
                                otherSummary.entries.push({
                                    type: 'Natural Resource Payment',
                                    name: entry.name,
                                    amount: Number(entry.amount),
                                    description: 'Income from exploitation of natural resources'
                                });
                                otherSummary.amount += Number(entry.amount);
                            }
                        });
                    }

                    // Process gem sales with descriptions
                    if (otherData.gemEntries?.length) {
                        otherData.gemEntries.forEach(entry => {
                            if (entry.amount) {
                                otherSummary.entries.push({
                                    type: 'Gem Sale Income',
                                    name: entry.name,
                                    amount: Number(entry.amount),
                                    description: 'Income from sale of gems at National Gem & Jewellery Authority auctions'
                                });
                                otherSummary.amount += Number(entry.amount);
                            }
                        });
                    }

                    // Process other entries with descriptions
                    if (otherData.otherEntries?.length) {
                        otherData.otherEntries.forEach(entry => {
                            if (entry.amount) {
                                otherSummary.entries.push({
                                    type: 'Other Miscellaneous Income',
                                    name: entry.name,
                                    amount: Number(entry.amount),
                                    description: 'Other taxable income not falling under specific categories'
                                });
                                otherSummary.amount += Number(entry.amount);
                            }
                        });
                    }

                    // Process WHT deductions with descriptions
                    if (otherData.whtEntries?.length) {
                        otherSummary.deductions = otherData.whtEntries
                            .filter(entry => entry.amount)
                            .map(entry => ({
                                name: entry.name || 'WHT Deduction',
                                amount: Number(entry.amount),
                                description: 'Withholding Tax deducted at source as per Section 84 of the Inland Revenue Act'
                            }));
                    }

                    if (otherSummary.amount > 0) {
                        newSummaryData.push(otherSummary);
                        totalIncome += otherSummary.amount;
                    }
                }
            }

            // Handle Qualifying Payments
            if (selectedCategories.includes('qualifying')) {
                const qualifyingData = JSON.parse(sessionStorage.getItem('qualifyingPaymentsData'));
                if (qualifyingData) {
                    let qualifyingSummary = {
                        category: 'Qualifying Payments & Relief',
                        amount: 0,
                        entries: [],
                        deductions: [],
                        description: 'Tax deductible payments and qualifying relief'
                    };

                    // Process donation entries
                    if (qualifyingData.donationEntries?.length) {
                        qualifyingData.donationEntries.forEach(entry => {
                            if (entry.amount) {
                                qualifyingSummary.entries.push({
                                    type: 'Donations',
                                    name: entry.name,
                                    amount: Number(entry.amount),
                                    description: 'Approved charitable donations (up to 1/3 of taxable income or Rs. 75,000)'
                                });
                                qualifyingSummary.amount += Number(entry.amount);
                            }
                        });
                    }

                    // Process Samurdhi entries
                    if (qualifyingData.samurdhiEntries?.length) {
                        qualifyingData.samurdhiEntries.forEach(entry => {
                            if (entry.amount) {
                                qualifyingSummary.entries.push({
                                    type: 'Samurdhi Shop Setup',
                                    name: entry.name,
                                    amount: Number(entry.amount),
                                    description: 'Shop setup expenses for Samurdhi beneficiary families'
                                });
                                qualifyingSummary.amount += Number(entry.amount);
                            }
                        });
                    }

                    // Process solar installation entries
                    if (qualifyingData.solarEntries?.length) {
                        qualifyingData.solarEntries.forEach(entry => {
                            if (entry.amount) {
                                qualifyingSummary.entries.push({
                                    type: 'Solar Installation',
                                    name: entry.name,
                                    amount: Number(entry.amount),
                                    description: 'Solar power system installation expenses (max Rs. 600,000)'
                                });
                                qualifyingSummary.amount += Number(entry.amount);
                            }
                        });
                    }

                    // Process cinema industry entries
                    if (qualifyingData.cinemaEntries?.length) {
                        qualifyingData.cinemaEntries.forEach(entry => {
                            if (entry.amount) {
                                qualifyingSummary.entries.push({
                                    type: 'Cinema Industry Investment',
                                    name: entry.name,
                                    amount: Number(entry.amount),
                                    description: 'Investment in film production or cinema development'
                                });
                                qualifyingSummary.amount += Number(entry.amount);
                            }
                        });
                    }

                    // Process housing construction entries
                    if (qualifyingData.housingEntries?.length) {
                        qualifyingData.housingEntries.forEach(entry => {
                            if (entry.amount) {
                                qualifyingSummary.entries.push({
                                    type: 'Low-Income Housing',
                                    name: entry.name,
                                    amount: Number(entry.amount),
                                    description: 'Construction of houses for low-income families'
                                });
                                qualifyingSummary.amount += Number(entry.amount);
                            }
                        });
                    }

                    // Process other qualifying payment entries
                    if (qualifyingData.otherEntries?.length) {
                        qualifyingData.otherEntries.forEach(entry => {
                            if (entry.amount) {
                                qualifyingSummary.entries.push({
                                    type: 'Other Qualifying Payment',
                                    name: entry.name,
                                    amount: Number(entry.amount),
                                    description: 'Other approved tax-deductible payments'
                                });
                                qualifyingSummary.amount += Number(entry.amount);
                            }
                        });
                    }

                    if (qualifyingSummary.amount > 0) {
                        newSummaryData.push(qualifyingSummary);
                        // Update taxable income by subtracting qualifying payments
                        totalIncome = Math.max(0, totalIncome - qualifyingSummary.amount);
                    }
                }
            }

            // New Terminal Benefits section
            if (selectedCategories.includes('terminal')) {
                const terminalData = JSON.parse(sessionStorage.getItem('terminalBenefitsData'));
                if (terminalData) {
                    let terminalSummary = {
                        category: 'Terminal Benefits',
                        amount: 0,
                        entries: [],
                        description: 'End of service and retirement benefits'
                    };

                    // Process commuted pension entries
                    if (terminalData.commutedEntries?.length) {
                        terminalData.commutedEntries.forEach(entry => {
                            if (entry.amount) {
                                terminalSummary.entries.push({
                                    type: 'Commuted Pension',
                                    name: entry.name || 'Commuted Pension',
                                    amount: Number(entry.amount),
                                    description: 'Lump sum received instead of regular pension payments'
                                });
                                terminalSummary.amount += Number(entry.amount);
                            }
                        });
                    }

                    // Process gratuity entries
                    if (terminalData.gratuityEntries?.length) {
                        terminalData.gratuityEntries.forEach(entry => {
                            if (entry.amount) {
                                terminalSummary.entries.push({
                                    type: 'Retiring Gratuity',
                                    name: entry.name || 'Retiring Gratuity',
                                    amount: Number(entry.amount),
                                    description: 'One-time payment received upon retirement'
                                });
                                terminalSummary.amount += Number(entry.amount);
                            }
                        });
                    }

                    // Process compensation entries
                    if (terminalData.compensationEntries?.length) {
                        terminalData.compensationEntries.forEach(entry => {
                            if (entry.amount) {
                                terminalSummary.entries.push({
                                    type: 'Compensation for Loss of Office',
                                    name: entry.name || 'Compensation',
                                    amount: Number(entry.amount),
                                    description: 'Payment received for loss of employment under a uniform scheme'
                                });
                                terminalSummary.amount += Number(entry.amount);
                            }
                        });
                    }

                    // Process ETF entries
                    if (terminalData.etfEntries?.length) {
                        terminalData.etfEntries.forEach(entry => {
                            if (entry.amount) {
                                terminalSummary.entries.push({
                                    type: 'ETF Payment',
                                    name: entry.name || 'ETF Payment',
                                    amount: Number(entry.amount),
                                    description: 'Amount received from the Employees Trust Fund'
                                });
                                terminalSummary.amount += Number(entry.amount);
                            }
                        });
                    }

                    // Process other terminal benefit entries
                    if (terminalData.otherEntries?.length) {
                        terminalData.otherEntries.forEach(entry => {
                            if (entry.amount) {
                                terminalSummary.entries.push({
                                    type: 'Other Terminal Benefits',
                                    name: entry.name || 'Other Benefits',
                                    amount: Number(entry.amount),
                                    description: 'Other retirement or end of service benefits'
                                });
                                terminalSummary.amount += Number(entry.amount);
                            }
                        });
                    }

                    if (terminalSummary.amount > 0) {
                        // Add terminal benefits after employment income
                        const empIndex = newSummaryData.findIndex(item => item.category === 'Employment Income');
                        if (empIndex !== -1) {
                            newSummaryData.splice(empIndex + 1, 0, terminalSummary);
                        } else {
                            newSummaryData.push(terminalSummary);
                        }
                        totalIncome += terminalSummary.amount;
                    }
                }
            }

            // Update state with calculated values
            setSummaryData(newSummaryData);
            setAssessableIncome(totalIncome);
            setTaxableIncome(totalIncome);
            setTotalTaxPayable(calculateTaxLiability(totalIncome));
        };

        loadAllData();
    }, []);

    // Tax calculation helper function
    const calculateTaxLiability = (income) => {
        if (income <= 1200000) return income * 0.06;
        if (income <= 2400000) return 72000 + (income - 1200000) * 0.12;
        if (income <= 3600000) return 216000 + (income - 2400000) * 0.18;
        if (income <= 4800000) return 432000 + (income - 3600000) * 0.24;
        if (income <= 6000000) return 720000 + (income - 4800000) * 0.30;
        return 1080000 + (income - 6000000) * 0.36;
    };

    // Rest of your component remains the same...
    const handleDownload = () => {
        const docContent = {
            assessableIncome,
            taxableIncome,
            totalTaxPayable,
            summaryData
        };
        
        // Create PDF or Excel download
        // Implementation depends on your preferred format
    };

    const handlePrint = () => {
        window.print();
    };

    // Update the render section to show detailed breakdown
    return (
        <div className={styles.previewContainer}>
            <TaxationMenu />
            <div className={styles.contentWrapper}>
                <div className={styles.header}>
                    <h1>Tax Return Summary</h1>
                    <div className={styles.actions}>
                        <button className={styles.actionButton} onClick={handleDownload}>
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
                                    <th>Description</th>
                                    <th>Rs.</th>
                                </tr>
                            </thead>
                            <tbody>
                                {summaryData.map((category, index) => (
                                    <React.Fragment key={`category-${index}`}>
                                        {/* Category Header */}
                                        <tr className={styles.categoryRow}>
                                            <td colSpan="2">{category.category}</td>
                                            <td>Rs. {Number(category.amount).toLocaleString()}</td>
                                        </tr>
                                        
                                        {/* Income Entries */}
                                        {category.entries?.map((entry, i) => (
                                            <tr key={`entry-${i}`} className={styles.detailRow}>
                                                <td>{entry.type}</td>
                                                <td>{entry.name}</td>
                                                <td>Rs. {Number(entry.amount).toLocaleString()}</td>
                                            </tr>
                                        ))}

                                        {/* Deductions if any */}
                                        {category.deductions?.length > 0 && (
                                            <>
                                                <tr className={styles.subheaderRow}>
                                                    <td colSpan="2">Tax Deductions (APIT)</td>
                                                    <td></td>
                                                </tr>
                                                {category.deductions.map((deduction, i) => (
                                                    <tr key={`deduction-${i}`} className={styles.deductionRow}>
                                                        <td></td>
                                                        <td>{deduction.name}</td>
                                                        <td>Rs. {Number(deduction.amount).toLocaleString()}</td>
                                                    </tr>
                                                ))}
                                            </>
                                        )}
                                    </React.Fragment>
                                ))}

                                {/* Totals Section */}
                                <tr className={styles.totalRow}>
                                    <td colSpan="2">Total Assessable Income</td>
                                    <td>Rs. {Number(assessableIncome).toLocaleString()}</td>
                                </tr>
                                <tr className={styles.totalRow}>
                                    <td colSpan="2">Taxable Income</td>
                                    <td>Rs. {Number(taxableIncome).toLocaleString()}</td>
                                </tr>
                                <tr className={styles.totalRow}>
                                    <td colSpan="2">Tax Payable</td>
                                    <td>Rs. {Number(totalTaxPayable).toLocaleString()}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Preview;