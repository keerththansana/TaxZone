import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, FileText, ChevronDown, Plus, Trash2 } from 'lucide-react';
import Header from '../../common/Header/Header';
import styles from './Preview.module.css';
import TaxationMenu from './Taxation_Menu';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import html2canvas from 'html2canvas';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import docx from 'docx';
import { useFormPersist } from './Data_Persistence';
import TaxLogo from '../../../assets/taxlogodark (2).png';
import AnalysisResults from './AnalysisResults';

// First, add a constant for category order
const CATEGORY_ORDER = [
    'Employment Income',
    'Business Income',
    'Investment Income',
    'Other Income',
    'Qualifying Payments & Relief',
    'Terminal Benefits'
];

// Add this helper function at the top of the file
const calculateTotalAmount = (category) => {
    if (!category?.entries) return 0;
    return category.entries.reduce((sum, entry) => sum + (Number(entry.amount) || 0), 0);
};

// Add this helper function at the top of the file
const hasEntries = (category) => {
    return category?.entries?.length > 0 && category.entries.some(entry => Number(entry.amount) > 0);
};

// Add tax bracket configurations
const TAX_BRACKETS = {
    '2024/2025': [
        { limit: 500000, rate: 0.06 },
        { limit: 1000000, rate: 0.12 },
        { limit: 1500000, rate: 0.18 },
        { limit: 2000000, rate: 0.24 },
        { limit: 2500000, rate: 0.30 },
        { limit: Infinity, rate: 0.36 }
    ],
    '2025/2026': [
        { limit: 1000000, rate: 0.06 },
        { limit: 1500000, rate: 0.18 },
        { limit: 2000000, rate: 0.24 },
        { limit: 2500000, rate: 0.30 },
        { limit: Infinity, rate: 0.36 }
    ]
};

// Add this constant at the top of the file
const PERSONAL_RELIEF_AMOUNTS = {
    '2024/2025': 1200000,
    '2025/2026': 1800000
};

// Add these components before the Preview component
const EditableCell = ({ value, onChange, type = "text" }) => {
    return (
        <input
            type={type}
            value={value}
            onChange={(e) => {
                const newValue = type === "number" ? 
                    Number(e.target.value) || 0 : 
                    e.target.value;
                onChange(newValue);
            }}
            className={styles.editableCell}
        />
    );
};

const EditableRow = ({ entry, onUpdate, onDelete, isEditing }) => {
    if (!isEditing) {
        return (
            <tr className={styles.bulletRow}>
                <td className={styles.bulletCell}>•</td>
                <td>{entry.name}</td>
                <td className={styles.amountColumn}>
                    {Number(entry.amount).toLocaleString()}
                </td>
            </tr>
        );
    }

    return (
        <tr className={styles.bulletRow}>
            <td className={styles.bulletCell}>
                <button 
                    onClick={onDelete}
                    className={styles.deleteButton}
                >
                    ×
                </button>
            </td>
            <td>
                <EditableCell
                    value={entry.name}
                    onChange={(value) => onUpdate({ ...entry, name: value })}
                />
            </td>
            <td className={styles.amountColumn}>
                <EditableCell
                    value={entry.amount}
                    onChange={(value) => onUpdate({ ...entry, amount: Number(value) })}
                    type="number"
                />
            </td>
        </tr>
    );
};

const Preview = () => {
    const [summaryData, setSummaryData] = useState([]);
    const [assessableIncome, setAssessableIncome] = useState(0);
    const [taxableIncome, setTaxableIncome] = useState(0);
    const [totalTaxPayable, setTotalTaxPayable] = useState(0);
    const [taxYear, setTaxYear] = useState('2024/2025');
    const [balanceTaxPayable, setBalanceTaxPayable] = useState(0);
    const [userDetails, setUserDetails] = useState({
        fullName: '',
        tinNumber: '',
        date: '',
        time: ''
    });

    // Add state for relief entries
    const [reliefEntries, setReliefEntries] = useState([
        { name: 'Expenditure Relief', amount: 0 },
        { name: 'Rent Relief', amount: 225000 },
        { name: 'Personal Relief', amount: 1200000 },
        { name: 'Solar Panel', amount: 200000 }
    ]);

    // Update the deductions state
    const [deductions, setDeductions] = useState({
        apit: 0,
        ait: 0,
        paidTax: 0,
        wht: 0
    });

    // Add state for tax brackets breakdown
    const [taxBracketBreakdown, setTaxBracketBreakdown] = useState([]);

    // Add these state variables at the beginning of the Preview component
    const [isEditing, setIsEditing] = useState(false);
    const [editableData, setEditableData] = useState({
        categories: [],
        deductions: {},
        taxBrackets: []
    });

    // Add these states at the beginning of the Preview component
    const [history, setHistory] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(-1);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

    // Add these new states for download menu
    const [showDownloadMenu, setShowDownloadMenu] = useState(false);
    const downloadMenuRef = useRef(null);

    const navigate = useNavigate();

    const [showAnalysisResults, setShowAnalysisResults] = useState(false);
    const [analysisResults, setAnalysisResults] = useState([]);

    const handleOpenAnalysis = () => {
        const stored = sessionStorage.getItem('last_analysis');
        setAnalysisResults(stored ? JSON.parse(stored) : []);
        setShowAnalysisResults(true);
    };

    // Add useEffect to load user details and set current date/time
    useEffect(() => {
        const fullName = sessionStorage.getItem('taxationFullName') || 'N/A';
        const tinNumber = sessionStorage.getItem('taxationTinNumber') || 'N/A';
        const now = new Date();
        const date = now.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
        const time = now.toLocaleTimeString('en-GB', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
        setUserDetails({ fullName, tinNumber, date, time });
    }, []);

    // Add these handlers in the Preview component
    const handleAddRow = (categoryIndex) => {
        const newData = [...summaryData];
        
        setSummaryData(newData);
        recalculateAll(newData); // Add this function call
    };

    const handleUpdateRow = (categoryIndex, entryIndex, updatedEntry) => {
        const newData = [...summaryData];
        newData[categoryIndex].entries[entryIndex] = updatedEntry;
        
        // Recalculate category total
        newData[categoryIndex].amount = newData[categoryIndex].entries.reduce(
            (sum, entry) => sum + Number(entry.amount || 0), 
            0
        );
        
        setSummaryData(newData);
        recalculateAll(newData); // Add this function call
    };

    const handleDeleteRow = (categoryIndex, entryIndex) => {
        const newData = [...summaryData];
        newData[categoryIndex].entries.splice(entryIndex, 1);
        
        // Recalculate category total
        newData[categoryIndex].amount = newData[categoryIndex].entries.reduce(
            (sum, entry) => sum + Number(entry.amount || 0), 
            0
        );
        
        setSummaryData(newData);
        recalculateAll(newData); // Add this function call
    };

    // Single useEffect to load all data
    useEffect(() => {
        const loadAllData = () => {
            const selectedYear = sessionStorage.getItem('taxationYear') || '2024/2025';
            setTaxYear(selectedYear);
            const selectedCategories = JSON.parse(sessionStorage.getItem('selectedCategories') || '[]');
            let categoryData = new Map(); // Use Map to store category data
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
                        categoryData.set('Employment Income', employmentSummary);
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
                        categoryData.set('Business Income', businessSummary);
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
                        categoryData.set('Investment Income', investmentSummary);
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
                        categoryData.set('Other Income', otherSummary);
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

                    // Add Personal Relief first
                    const selectedYear = sessionStorage.getItem('taxationYear') || '2024/2025';
                    const personalReliefAmount = selectedYear === '2024/2025' ? 1200000 : 1800000;
                    
                    qualifyingSummary.entries.push({
                        type: 'Personal Relief',
                        name: 'Personal Relief',
                        amount: personalReliefAmount,
                        description: 'Standard personal relief for the tax year'
                    });
                    qualifyingSummary.amount += personalReliefAmount;

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
                        categoryData.set('Qualifying Payments & Relief', qualifyingSummary);
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
                        categoryData.set('Terminal Benefits', terminalSummary);
                        totalIncome += terminalSummary.amount;
                    }
                }
            }

            // After loading all category data, sort according to defined order
            const sortedSummaryData = Array.from(categoryData.values())
                .filter(category => category.amount > 0)
                .sort((a, b) => {
                    const orderA = CATEGORY_ORDER.indexOf(a.category);
                    const orderB = CATEGORY_ORDER.indexOf(b.category);
                    return orderA - orderB;
                });

            // Update state with sorted data
            setSummaryData(sortedSummaryData);
            setAssessableIncome(totalIncome);
            setTaxableIncome(totalIncome);
            setTotalTaxPayable(calculateTaxLiability(totalIncome, selectedYear));

            // Call loadDeductions at the end
            loadDeductions();
        };

        loadAllData();
    }, []);

    // Add a function to load deductions
    const loadDeductions = () => {
        let newDeductions = {
            apit: 0,
            ait: 0,
            paidTax: 0,
            wht: 0
        };

        try {
            // Load investment income deductions
            const investmentData = JSON.parse(sessionStorage.getItem('investmentIncomeData') || '{}');
            
            // Check for tax deductions in investmentData
            if (investmentData.taxDeductions && Array.isArray(investmentData.taxDeductions)) {
                investmentData.taxDeductions.forEach(deduction => {
                    if (deduction.type === 'AIT') {
                        newDeductions.ait += Number(deduction.amount) || 0;
                    } else if (deduction.type === 'Paid Tax') {
                        newDeductions.paidTax += Number(deduction.amount) || 0;
                    }
                });
            }

            // Load APIT from Employment Income
            const employmentData = JSON.parse(sessionStorage.getItem('employmentIncomeData') || '{}');
            if (employmentData.apitEntries?.length) {
                newDeductions.apit = employmentData.apitEntries.reduce((sum, entry) => 
                    sum + (Number(entry.amount) || 0), 0);
            }

            // Load WHT from Other Income
            const otherData = JSON.parse(sessionStorage.getItem('otherIncomeData') || '{}');
            if (otherData.whtEntries?.length) {
                newDeductions.wht = otherData.whtEntries.reduce((sum, entry) => 
                    sum + (Number(entry.amount) || 0), 0);
            }

            console.log('Investment Data:', investmentData);
            console.log('Processed Deductions:', newDeductions);
            
            setDeductions(newDeductions);
        } catch (error) {
            console.error('Error loading deductions:', error);
            console.error('Error details:', error.message);
        }
    };

    // Add function to calculate total tax credits
    const calculateTotalTaxCredits = () => {
        return (
            deductions.apit +
            deductions.ait +
            deductions.paidTax +
            deductions.wht
        );
    };

    // Update the loadReliefData function in useEffect
    useEffect(() => {
        const loadReliefData = () => {
            const selectedCategories = JSON.parse(sessionStorage.getItem('selectedCategories') || '[]');
            let reliefArray = [];

            // Only add personal relief if employment income is selected
            if (selectedCategories.includes('employment')) {
                const employmentData = JSON.parse(sessionStorage.getItem('employmentIncomeData') || '{}');
                const selectedYear = sessionStorage.getItem('taxationYear') || '2024/2025';
                const personalReliefAmount = selectedYear === '2024/2025' ? 1200000 : 1800000;
                
                const personalRelief = employmentData.totalEmploymentIncome <= personalReliefAmount 
                    ? employmentData.totalEmploymentIncome || 0 
                    : personalReliefAmount;

                if (personalRelief > 0) {
                    reliefArray.push({ name: 'Personal Relief', amount: personalRelief });
                }
            }

            // Only add rental relief if investment income is selected and has rental entries
            if (selectedCategories.includes('investment')) {
                const investmentData = JSON.parse(sessionStorage.getItem('investmentIncomeData') || '{}');
                const rentalIncome = investmentData?.rentEntries?.reduce((sum, entry) => 
                    sum + (Number(entry.amount) || 0), 0) || 0;
                
                if (rentalIncome > 0) {
                    const rentalRelief = Math.min(rentalIncome * 0.25, 225000);
                    reliefArray.push({ name: 'Rental Relief (25%)', amount: rentalRelief });
                }
            }

            // Only add solar panel relief if qualifying payments are selected and has solar entries
            if (selectedCategories.includes('qualifying')) {
                const qualifyingData = JSON.parse(sessionStorage.getItem('qualifyingPaymentsData') || '{}');
                const solarPanelAmount = qualifyingData?.solarEntries?.[0]?.amount || 0;
                
                if (solarPanelAmount > 0) {
                    reliefArray.push({ name: 'Solar Panel Installation', amount: Number(solarPanelAmount) });
                }
            }

            setReliefEntries(reliefArray);
        };

        loadReliefData();
    }, []);

    // Update the tax calculation function to be more reliable
    const calculateTaxLiability = (income, taxYear) => {
        const brackets = TAX_BRACKETS[taxYear];
        if (!brackets) {
            console.error('Invalid tax year:', taxYear);
            return 0;
        }

        let remainingIncome = Number(income);
        let totalTax = 0;
        let previousLimit = 0;
        let breakdown = [];

        for (const bracket of brackets) {
            const bracketAmount = bracket.limit - previousLimit;
            const taxableInBracket = Math.min(remainingIncome, bracketAmount);
            
            if (taxableInBracket <= 0) break;

            const taxInBracket = taxableInBracket * bracket.rate;
            totalTax += taxInBracket;

            breakdown.push({
                from: previousLimit,
                to: previousLimit + taxableInBracket,
                amount: taxableInBracket,
                rate: bracket.rate,
                tax: taxInBracket
            });

            remainingIncome -= taxableInBracket;
            previousLimit = bracket.limit;
        }

        setTaxBracketBreakdown(breakdown);
        return totalTax;
    };

    // Add this function after the state declarations
    const recalculateAll = (data) => {
        const currentData = data || summaryData;
        const selectedYear = sessionStorage.getItem('taxationYear') || '2024/2025';
        
        // Calculate Assessable Income (excluding Qualifying Payments & Relief)
        let totalAssessableIncome = 0;
        currentData.forEach(category => {
            if (!['Qualifying Payments & Relief'].includes(category.category)) {
                const categoryTotal = category.entries?.reduce((sum, entry) => 
                    sum + (Number(entry.amount) || 0), 0) || 0;
                totalAssessableIncome += categoryTotal;
            }
        });

        // Get Qualifying Payments & Relief
        const qualifyingPayments = currentData.find(cat => cat.category === 'Qualifying Payments & Relief');
        const qualifyingPaymentsTotal = qualifyingPayments?.entries?.reduce((sum, entry) => 
            sum + (Number(entry.amount) || 0), 0) || 0;

        // Always subtract Qualifying Payments from Assessable Income
        const calculatedTaxableIncome = Math.max(0, totalAssessableIncome - qualifyingPaymentsTotal);

        // Calculate tax liability with selected year
        const taxLiability = calculateTaxLiability(calculatedTaxableIncome, selectedYear);
        const totalTaxCredits = calculateTotalTaxCredits();

        // Calculate balance tax payable
        const calculatedBalanceTaxPayable = Math.max(0, taxLiability - totalTaxCredits);

        // Update states
        setAssessableIncome(totalAssessableIncome);
        setTaxableIncome(calculatedTaxableIncome);
        setTotalTaxPayable(taxLiability);
        setBalanceTaxPayable(calculatedBalanceTaxPayable);

        // Debug logging
        console.log('Tax Calculation Details:', {
            assessableIncome: totalAssessableIncome,
            qualifyingPaymentsTotal,
            taxableIncome: calculatedTaxableIncome,
            taxLiability,
            totalTaxCredits,
            balanceTaxPayable: calculatedBalanceTaxPayable
        });
    };

    // Update the loadAllData function to properly calculate values
    useEffect(() => {
        const loadAllData = () => {
            try {
                // Calculate Assessable Income
                let totalAssessableIncome = 0;

                // Sum up regular income categories
                summaryData.forEach(category => {
                    if (!['Qualifying Payments & Relief', 'Terminal Benefits'].includes(category.category)) {
                        const categoryTotal = category.entries?.reduce((sum, entry) => 
                            sum + (Number(entry.amount) || 0), 0) || 0;
                        totalAssessableIncome += categoryTotal;
                    }
                });

                // Calculate deductions
                const terminalBenefits = summaryData.find(cat => cat.category === 'Terminal Benefits');
                const terminalBenefitsTotal = terminalBenefits?.entries?.reduce((sum, entry) => 
                    sum + (Number(entry.amount) || 0), 0) || 0;

                const qualifyingPayments = summaryData.find(cat => cat.category === 'Qualifying Payments & Relief');
                const qualifyingPaymentsTotal = calculateTotalAmount(qualifyingPayments);

                // Calculate total deductions
                const totalDeductions = terminalBenefitsTotal + qualifyingPaymentsTotal;

                // Calculate Taxable Income
                const calculatedTaxableIncome = Math.max(0, totalAssessableIncome - totalDeductions);

                // Get selected tax year
                const selectedYear = sessionStorage.getItem('taxationYear') || '2024/2025';

                // Calculate tax liability
                const taxLiability = calculateTaxLiability(calculatedTaxableIncome, selectedYear);

                // Calculate total tax credits
                const totalTaxCredits = calculateTotalTaxCredits();

                // Calculate balance tax payable
                const calculatedBalanceTaxPayable = Math.max(0, taxLiability - totalTaxCredits);

                // Update all states at once
                setAssessableIncome(totalAssessableIncome);
                setTaxableIncome(calculatedTaxableIncome);
                setTotalTaxPayable(taxLiability);
                setBalanceTaxPayable(calculatedBalanceTaxPayable);

                // Debug logging
                console.log('Calculation Results:', {
                    totalAssessableIncome,
                    totalDeductions,
                    calculatedTaxableIncome,
                    taxLiability,
                    totalTaxCredits,
                    calculatedBalanceTaxPayable
                });
            } catch (error) {
                console.error('Error in loadAllData:', error);
            }
        };

        loadAllData();
    }, [summaryData, deductions]); // Add dependencies to ensure recalculation when data changes

    // Update the useEffect where data is loaded
    useEffect(() => {
        const loadAllData = () => {
            // ...existing loading code...

            // Calculate Assessable Income
            let totalAssessableIncome = 0;

            // Sum up regular income categories
            summaryData.forEach(category => {
                if (!['Qualifying Payments & Relief', 'Terminal Benefits'].includes(category.category)) {
                    totalAssessableIncome += calculateTotalAmount(category);
                }
            });

            // Calculate deductions
            let totalDeductions = 0;

            // Get Terminal Benefits total
            const terminalBenefits = summaryData.find(cat => cat.category === 'Terminal Benefits');
            const terminalBenefitsTotal = calculateTotalAmount(terminalBenefits);

            // Get Qualifying Payments total
            const qualifyingPayments = summaryData.find(cat => cat.category === 'Qualifying Payments & Relief');
            const qualifyingPaymentsTotal = calculateTotalAmount(qualifyingPayments);

            // Sum up all deductions
            totalDeductions = terminalBenefitsTotal + qualifyingPaymentsTotal;

            // Calculate Taxable Income
            const calculatedTaxableIncome = Math.max(0, totalAssessableIncome - totalDeductions);

            // Get selected tax year
            const selectedYear = sessionStorage.getItem('taxationYear') || '2024/2025';

            // Calculate tax liability with selected year
            const taxLiability = calculateTaxLiability(calculatedTaxableIncome, selectedYear);
            const totalTaxCredits = calculateTotalTaxCredits();
        
            // Calculate balance tax payable (cannot be negative)
            const calculatedBalanceTaxPayable = Math.max(0, taxLiability - totalTaxCredits);

            // Update state
            setAssessableIncome(totalAssessableIncome);
            setTaxableIncome(calculatedTaxableIncome);
            setTotalTaxPayable(taxLiability);
            setBalanceTaxPayable(calculatedBalanceTaxPayable);

            // Debug logs
            console.log('Assessable Income Components:', {
                employmentIncome: summaryData.find(cat => cat.category === 'Employment Income')?.amount || 0,
                businessIncome: summaryData.find(cat => cat.category === 'Business Income')?.amount || 0,
                investmentIncome: summaryData.find(cat => cat.category === 'Investment Income')?.amount || 0,
                otherIncome: summaryData.find(cat => cat.category === 'Other Income')?.amount || 0
            });
            console.log('Deduction Components:', {
                terminalBenefits: terminalBenefitsTotal,
                qualifyingPayments: qualifyingPaymentsTotal
            });
            console.log('Calculation Results:', {
                totalAssessableIncome,
                totalDeductions,
                calculatedTaxableIncome
            });
        };

        loadAllData();
    }, []);

    // Update the loadAllData function
    const loadAllData = () => {
        // ... existing loading code for categories ...

        // Calculate Assessable Income (after all data is loaded)
        let totalAssessableIncome = 0;
        let totalDeductions = 0;

        // Sum up regular income categories
        summaryData.forEach(category => {
            if (!['Qualifying Payments & Relief', 'Terminal Benefits'].includes(category.category)) {
                const categoryTotal = category.entries?.reduce((sum, entry) => 
                    sum + (Number(entry.amount) || 0), 0) || 0;
                totalAssessableIncome += categoryTotal;
            }
        });

        // Calculate deductions from Terminal Benefits and Qualifying Payments
        const terminalBenefits = summaryData.find(cat => cat.category === 'Terminal Benefits');
        const terminalBenefitsTotal = terminalBenefits?.entries?.reduce((sum, entry) => 
            sum + (Number(entry.amount) || 0), 0) || 0;

        const qualifyingPayments = summaryData.find(cat => cat.category === 'Qualifying Payments & Relief');
        const qualifyingPaymentsTotal = calculateTotalAmount(qualifyingPayments);

        // Sum up all deductions
        totalDeductions = terminalBenefitsTotal + qualifyingPaymentsTotal;

        // Calculate Taxable Income
        const calculatedTaxableIncome = Math.max(0, totalAssessableIncome - totalDeductions);

        // Get selected tax year
        const selectedYear = sessionStorage.getItem('taxationYear') || '2024/2025';

        // Calculate tax liability with selected year
        const taxLiability = calculateTaxLiability(calculatedTaxableIncome, selectedYear);
        const totalTaxCredits = calculateTotalTaxCredits();
        
        // Calculate balance tax payable (cannot be negative)
        const calculatedBalanceTaxPayable = Math.max(0, taxLiability - totalTaxCredits);

        // Update state with calculated values
        setAssessableIncome(totalAssessableIncome);
        setTaxableIncome(calculatedTaxableIncome);
        setTotalTaxPayable(taxLiability);
        setBalanceTaxPayable(calculatedBalanceTaxPayable);

        // Debug logs
        console.log('Calculation Details:', {
            totalAssessableIncome,
            terminalBenefitsTotal,
            qualifyingPaymentsTotal,
            totalDeductions,
            calculatedTaxableIncome
        });
    };

    // Add this useEffect
    useEffect(() => {
        if (!isEditing) {
            recalculateAll();
        }
    }, [isEditing]);

    // Add this useEffect after your other useEffect hooks
    useEffect(() => {
        loadDeductions();
    }, []); // Empty dependency array means this runs once when component mounts

    // Add click outside handler for download menu
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (downloadMenuRef.current && !downloadMenuRef.current.contains(event.target)) {
                setShowDownloadMenu(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleDownload = async (format) => {
        try {
          const element = document.querySelector(`.${styles.documentContainer}`);
          if (!element) {
            console.error('Preview container not found');
            return;
          }
      
          // Create a clone of the element to modify for download
          const clone = element.cloneNode(true);
          clone.style.width = '210mm';
          clone.style.padding = '20mm';
          clone.style.backgroundColor = 'white';
          document.body.appendChild(clone);
          clone.style.position = 'absolute';
          clone.style.left = '-9999px';
      
          // Capture the content
          const canvas = await html2canvas(clone, {
            scale: 2,
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff'
          });
      
          // Remove the clone
          document.body.removeChild(clone);
      
          // Prepare document data for database
          const documentData = {
            taxYear,
            assessableIncome,
            taxableIncome,
            totalTaxPayable,
            balanceTaxPayable,
            userDetails,
            summaryData,
            taxBracketBreakdown,
            deductions
          };
      
          switch (format) {
            case 'pdf':
              await downloadAsPDF(canvas);
              await saveToDatabase('pdf', documentData);
              break;
            case 'excel':
              await downloadAsExcel();
              await saveToDatabase('excel', documentData);
              break;
            case 'word':
              await downloadAsWord(canvas);
              await saveToDatabase('word', documentData);
              break;
            default:
              console.error('Unsupported format');
          }
        } catch (error) {
          console.error('Error downloading document:', error);
        }
      };

    const downloadAsPDF = async (canvas) => {
        const pdf = new jsPDF('p', 'mm', 'a4');
        const imgWidth = 210;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        const pageHeight = 297; // A4 height in mm
        const margin = 20; // Top and bottom margin in mm
        const contentHeight = pageHeight - (2 * margin); // Available space for content

        // Calculate number of pages needed
        const pageCount = Math.ceil(imgHeight / contentHeight);

        for (let i = 0; i < pageCount; i++) {
            // Add new page if not the first page
            if (i > 0) {
                pdf.addPage();
            }

            // Calculate position for this page
            const position = -(i * contentHeight);
            
            // Add image to page
            pdf.addImage(
                canvas.toDataURL('image/jpeg', 1.0),
                'JPEG',
                0,
                position,
                imgWidth,
                imgHeight
            );
        }

        pdf.save(`Tax_Calculation_${taxYear.replace('/', '_')}.pdf`);
    };

    const downloadAsExcel = () => {
        // Create workbook and worksheet
        const wb = XLSX.utils.book_new();

        // Prepare data for Excel
        const data = [
            ['Full Name:', userDetails.fullName],
            ['TIN Number:', userDetails.tinNumber],
            ['Year of Assessment:', taxYear],
            ['Date & Time:', `${userDetails.date} ${userDetails.time}`],
            [''],
            ['Calculation of Income Tax Liability - ' + taxYear],
            [''],
            ['Income Types and Deductions', '', 'Amount (Rs.)'],
            ['']
        ];

        // Add income categories
        summaryData.forEach(category => {
            if (category.category !== 'Qualifying Payments & Relief' && 
                category.category !== 'Terminal Benefits' && 
                hasEntries(category)) {
                data.push([category.category, '', category.amount]);
                category.entries?.forEach(entry => {
                    if (Number(entry.amount) > 0) {
                        data.push(['• ' + entry.name, '', entry.amount]);
                    }
                });
            }
        });

        data.push(['']);
        data.push(['Assessable Income', '', assessableIncome]);
        data.push(['']);

        // Add Terminal Benefits if any
        const terminalBenefits = summaryData.find(cat => cat.category === 'Terminal Benefits');
        if (terminalBenefits && hasEntries(terminalBenefits)) {
            data.push(['Terminal Benefits (Less)', '', '']);
            terminalBenefits.entries?.forEach(entry => {
                if (Number(entry.amount) > 0) {
                    data.push(['• ' + entry.name, '', entry.amount]);
                }
            });
        }

        // Add Relief & Qualifying Payments
        data.push(['']);
        data.push(['Relief & Qualifying Payments (Less)', '', '']);
        data.push(['• Personal Relief', '', PERSONAL_RELIEF_AMOUNTS[taxYear]]);

        // Add other qualifying payments
        const qualifyingPayments = summaryData.find(cat => cat.category === 'Qualifying Payments & Relief');
        if (qualifyingPayments) {
            qualifyingPayments.entries
                .filter(entry => !entry.type.includes('Personal Relief') && Number(entry.amount) > 0)
                .forEach(entry => {
                    data.push(['• ' + entry.name, '', entry.amount]);
                });
        }

        data.push(['']);
        data.push(['Taxable Income', '', taxableIncome]);
        data.push(['']);
        data.push(['Tax Liability Calculation', '', '']);

        // Add tax bracket breakdown
        taxBracketBreakdown.forEach(bracket => {
            data.push([
                `${bracket.from.toLocaleString()} - ${bracket.to.toLocaleString()} (${(bracket.rate * 100)}%)`,
                '',
                bracket.tax
            ]);
        });

        data.push(['']);
        data.push(['Total Tax Liability', '', totalTaxPayable]);
        data.push(['']);

        // Add tax deductions if any
        if (Object.values(deductions).some(value => value > 0)) {
            data.push(['Tax Deductions - Credits', '', '']);
            if (deductions.apit > 0) {
                data.push(['• APIT (Advanced Personal Income Tax)', '', deductions.apit]);
            }
            if (deductions.ait > 0) {
                data.push(['• AIT (Advance Income Tax)', '', deductions.ait]);
            }
            if (deductions.paidTax > 0) {
                data.push(['• Paid Tax', '', deductions.paidTax]);
            }
            if (deductions.wht > 0) {
                data.push(['• WHT (Withholding Tax)', '', deductions.wht]);
            }
        }

        data.push(['']);
        data.push(['Balance Tax Payable', '', balanceTaxPayable]);

        // Create worksheet
        const ws = XLSX.utils.aoa_to_sheet(data);

        // Set column widths
        ws['!cols'] = [
            { wch: 50 }, // First column - descriptions
            { wch: 10 }, // Second column - spacing
            { wch: 20 }  // Third column - amounts
        ];

        // Add worksheet to workbook
        XLSX.utils.book_append_sheet(wb, ws, 'Tax Calculation');

        // Generate Excel file
        XLSX.writeFile(wb, `Tax_Calculation_${taxYear.replace('/', '_')}.xlsx`);
    };

    const downloadAsWord = async (canvas) => {
        // Convert canvas to base64 image
        const imgData = canvas.toDataURL('image/png');
        
        // Create HTML content with exact preview layout
        const htmlContent = `
            <html xmlns:o="urn:schemas-microsoft-com:office:office" 
                  xmlns:w="urn:schemas-microsoft-com:office:word" 
                  xmlns="http://www.w3.org/TR/REC-html40">
            <head>
                <meta charset="utf-8">
                <title>Tax Calculation</title>
                <style>
                    body { 
                        font-family: Arial, sans-serif;
                        margin: 0;
                        padding: 20px;
                    }
                    .user-details {
                        margin-bottom: 20px;
                    }
                    .user-detail-row {
                        margin-bottom: 10px;
                    }
                    .user-detail-label {
                        font-weight: bold;
                        margin-right: 10px;
                    }
                    table {
                        width: 100%;
                        border-collapse: collapse;
                        margin-bottom: 20px;
                    }
                    td, th {
                        padding: 8px;
                        text-align: left;
                    }
                    .category-row {
                        font-weight: bold;
                        background-color: #f5f5f5;
                    }
                    .total-row {
                        font-weight: bold;
                        border-top: 2px solid #000;
                    }
                    .bullet-row td:first-child {
                        width: 20px;
                    }
                    .amount-column {
                        text-align: right;
                    }
                    .section-header {
                        font-weight: bold;
                        background-color: #f0f0f0;
                    }
                    .spacer-row {
                        height: 10px;
                    }
                </style>
            </head>
            <body>
                <div class="user-details">
                    <div class="user-detail-row">
                        <span class="user-detail-label">Full Name:</span>
                        <span>${userDetails.fullName}</span>
                    </div>
                    <div class="user-detail-row">
                        <span class="user-detail-label">TIN Number:</span>
                        <span>${userDetails.tinNumber}</span>
                    </div>
                    <div class="user-detail-row">
                        <span class="user-detail-label">Year of Assessment:</span>
                        <span>${taxYear}</span>
                    </div>
                    <div class="user-detail-row">
                        <span class="user-detail-label">Date & Time:</span>
                        <span>${userDetails.date} ${userDetails.time}</span>
                    </div>
                </div>

                <h1 style="text-align: center; margin-bottom: 20px;">Calculation of Income Tax Liability - ${taxYear}</h1>
                
                <table>
                    <thead>
                        <tr>
                            <th colspan="2">Income Types and Deductions</th>
                            <th>Amount (Rs.)</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${summaryData.map(category => {
                            if (category.category !== 'Qualifying Payments & Relief' && 
                                category.category !== 'Terminal Benefits' && 
                                hasEntries(category)) {
                                return `
                                    <tr class="category-row">
                                        <td colspan="2">${category.category}</td>
                                        <td class="amount-column">${Number(category.amount).toLocaleString()}</td>
                                    </tr>
                                    ${category.entries?.map(entry => 
                                        Number(entry.amount) > 0 ? `
                                            <tr class="bullet-row">
                                                <td>•</td>
                                                <td>${entry.name}</td>
                                                <td class="amount-column">${Number(entry.amount).toLocaleString()}</td>
                                            </tr>
                                        ` : ''
                                    ).join('')}
                                `;
                            }
                            return '';
                        }).join('')}
                        
                        <tr class="total-row">
                            <td colspan="2">Assessable Income</td>
                            <td class="amount-column">${Number(assessableIncome).toLocaleString()}</td>
                        </tr>
                        
                        <tr class="spacer-row"><td colspan="3"></td></tr>
                        <tr class="spacer-row"><td colspan="3"></td></tr>
                        
                        ${summaryData.find(cat => cat.category === 'Terminal Benefits')?.entries?.length > 0 ? `
                            <tr class="section-header">
                                <td colspan="3">Terminal Benefits (Less)</td>
                            </tr>
                            ${summaryData.find(cat => cat.category === 'Terminal Benefits')?.entries?.map(entry => 
                                Number(entry.amount) > 0 ? `
                                    <tr class="bullet-row">
                                        <td>•</td>
                                        <td>${entry.name}</td>
                                        <td class="amount-column">${Number(entry.amount).toLocaleString()}</td>
                                    </tr>
                                ` : ''
                            ).join('')}
                        ` : ''}
                        
                        <tr class="section-header">
                            <td colspan="3">Relief & Qualifying Payments (Less)</td>
                        </tr>
                        <tr class="bullet-row">
                            <td>•</td>
                            <td>Personal Relief</td>
                            <td className={styles.amountColumn}>
                                Rs. ${Number(PERSONAL_RELIEF_AMOUNTS[taxYear]).toLocaleString()}
                            </td>
                        </tr>
                        
                        ${summaryData.find(cat => cat.category === 'Qualifying Payments & Relief')?.entries
                            ?.filter(entry => !entry.type.includes('Personal Relief') && Number(entry.amount) > 0)
                            .map(entry => `
                                <tr class="bullet-row">
                                    <td>•</td>
                                    <td>${entry.name}</td>
                                    <td className={styles.amountColumn}>
                                        Rs. ${Number(entry.amount).toLocaleString()}
                                    </td>
                                </tr>
                            `).join('')}
                        
                        <tr class="total-row">
                            <td colspan="2">Taxable Income</td>
                            <td className={styles.amountColumn}>
                                Rs. ${Number(taxableIncome).toLocaleString()}
                            </td>
                        </tr>
                        
                        <tr class="spacer-row"><td colspan="3"></td></tr>
                        <tr class="spacer-row"><td colspan="3"></td></tr>
                        
                        <tr className={styles.sectionHeader + ' ' + styles.pageBreak}>
                            <td colSpan="3">Tax Liability Calculation</td>
                        </tr>

                        ${taxBracketBreakdown.map((bracket, index) => `
                            <tr key=${index} className={styles.bulletRow}>
                                <td className={styles.bulletCell}></td>
                                <td>
                                    ${bracket.from.toLocaleString()} - ${bracket.to.toLocaleString()} ---------- (${(bracket.rate * 100)}%)
                                </td>
                                <td className={styles.amountColumn}>
                                    ${Number(bracket.tax).toLocaleString()}
                                </td>
                            </tr>
                        `).join('')}
                        
                        <tr className={styles.totalRow}>
                            <td colSpan="2">Total Tax Liability</td>
                            <td className={styles.amountColumn}>
                                Rs. ${Number(totalTaxPayable).toLocaleString()}
                            </td>
                        </tr>
                        
                        ${Object.values(deductions).some(value => value > 0) ? `
                            <tr className={styles.spacerRow}>
                                <td colSpan="3"></td>
                            </tr>
                            <tr className={styles.spacerRow}>
                                <td colSpan="3"></td>
                            </tr>
                            
                            <tr className={styles.sectionHeader}>
                                <td colSpan="3">Tax Deductions - Credits</td>
                            </tr>
                            ${deductions.apit > 0 ? `
                                <tr className={styles.bulletRow}>
                                    <td className={styles.bulletCell}>•</td>
                                    <td>APIT (Advanced Personal Income Tax)</td>
                                    <td className={styles.amountColumn}>
                                        (${Number(deductions.apit).toLocaleString()})
                                    </td>
                                </tr>
                            ` : ''}
                            ${deductions.ait > 0 ? `
                                <tr className={styles.bulletRow}>
                                    <td className={styles.bulletCell}>•</td>
                                    <td>AIT (Advance Income Tax)</td>
                                    <td className={styles.amountColumn}>
                                        (${Number(deductions.ait).toLocaleString()})
                                    </td>
                                </tr>
                            ` : ''}
                            ${deductions.paidTax > 0 ? `
                                <tr className={styles.bulletRow}>
                                    <td className={styles.bulletCell}>•</td>
                                    <td>Paid Tax</td>
                                    <td className={styles.amountColumn}>
                                        (${Number(deductions.paidTax).toLocaleString()})
                                    </td>
                                </tr>
                            ` : ''}
                            ${deductions.wht > 0 ? `
                                <tr className={styles.bulletRow}>
                                    <td className={styles.bulletCell}>•</td>
                                    <td>WHT (Withholding Tax)</td>
                                    <td className={styles.amountColumn}>
                                        (${Number(deductions.wht).toLocaleString()})
                                    </td>
                                </tr>
                            ` : ''}
                        ` : ''}
                        
                        <tr className={styles.spacerRow}>
                            <td colSpan="3"></td>
                        </tr>
                        <tr className={styles.spacerRow}>
                            <td colSpan="3"></td>
                        </tr>
                        
                        <tr className={styles.totalRow}>
                            <td colSpan="2">Balance Tax Payable</td>
                            <td className={styles.amountColumn}>
                                Rs. ${Number(balanceTaxPayable).toLocaleString()}
                            </td>
                        </tr>
                    </tbody>
                </table>
            </body>
            </html>
        `;
        
        // Create blob and download
        const blob = new Blob([htmlContent], { type: 'application/msword' });
        saveAs(blob, `Tax_Calculation_${taxYear.replace('/', '_')}.doc`);
    };

    const handlePrint = () => {
        window.print();
    };

    const saveToDatabase = async (format, content) => {
      try {
        const accessToken = localStorage.getItem('accessToken'); // Get JWT token from localStorage
        
        if (!accessToken) {
          console.error('No authentication token found. Please log in again.');
          return;
        }

        // Create FormData to send both file and metadata
        const formData = new FormData();
        
        // Add metadata as JSON string so backend can extract user details
        const metadata = {
          content: content, // Pass the full content with userDetails
          format: format,
          taxYear: content.taxYear
        };
        
        formData.append('metadata', JSON.stringify(metadata));
        
        // Generate the actual document file based on format
        let documentBlob;
        let filename;
        
        if (format === 'pdf') {
          // For PDF, we need to generate it first
          const element = document.querySelector(`.${styles.documentContainer}`);
          if (element) {
            console.log('Generating PDF document...');
            const canvas = await html2canvas(element, {
              scale: 2,
              useCORS: true,
              logging: false,
              backgroundColor: '#ffffff'
            });
            
            // Convert canvas to blob
            canvas.toBlob((blob) => {
              if (blob) {
                console.log('PDF blob created, size:', blob.size);
                documentBlob = blob;
                filename = `Tax_Calculation_${content.taxYear.replace('/', '_')}.pdf`;
                formData.append('document', documentBlob, filename);
                
                // Send the request
                sendDocumentToServer(formData, accessToken);
              } else {
                console.error('Failed to create PDF blob');
                alert('Failed to generate PDF document. Please try again.');
              }
            }, 'application/pdf');
            return; // Exit early as we're handling this asynchronously
          } else {
            console.error('Document container element not found');
            alert('Document container not found. Please try again.');
            return;
          }
        } else if (format === 'excel') {
          console.log('Generating Excel document...');
          // For Excel, generate the file using the same logic as downloadAsExcel
          const wb = XLSX.utils.book_new();

          // Prepare data for Excel (same as downloadAsExcel function)
          const data = [
            ['Full Name:', content.userDetails.fullName],
            ['TIN Number:', content.userDetails.tinNumber],
            ['Year of Assessment:', content.taxYear],
            ['Date & Time:', `${content.userDetails.date} ${content.userDetails.time}`],
            [''],
            ['Calculation of Income Tax Liability - ' + content.taxYear],
            [''],
            ['Income Types and Deductions', '', 'Amount (Rs.)'],
            ['']
          ];

          // Add income categories
          content.summaryData.forEach(category => {
            if (category.category !== 'Qualifying Payments & Relief' && 
                category.category !== 'Terminal Benefits' && 
                hasEntries(category)) {
              data.push([category.category, '', category.amount]);
              category.entries?.forEach(entry => {
                if (Number(entry.amount) > 0) {
                  data.push(['• ' + entry.name, '', entry.amount]);
                }
              });
            }
          });

          data.push(['']);
          data.push(['Assessable Income', '', content.assessableIncome]);
          data.push(['']);

          // Add Terminal Benefits if any
          const terminalBenefits = content.summaryData.find(cat => cat.category === 'Terminal Benefits');
          if (terminalBenefits && hasEntries(terminalBenefits)) {
            data.push(['Terminal Benefits (Less)', '', '']);
            terminalBenefits.entries?.forEach(entry => {
              if (Number(entry.amount) > 0) {
                data.push(['• ' + entry.name, '', entry.amount]);
              }
            });
          }

          // Add Relief & Qualifying Payments
          data.push(['']);
          data.push(['Relief & Qualifying Payments (Less)', '', '']);
          data.push(['• Personal Relief', '', PERSONAL_RELIEF_AMOUNTS[content.taxYear]]);

          // Add other qualifying payments
          const qualifyingPayments = content.summaryData.find(cat => cat.category === 'Qualifying Payments & Relief');
          if (qualifyingPayments) {
            qualifyingPayments.entries
              .filter(entry => !entry.type.includes('Personal Relief') && Number(entry.amount) > 0)
              .forEach(entry => {
                data.push(['• ' + entry.name, '', entry.amount]);
              });
          }

          data.push(['']);
          data.push(['Taxable Income', '', content.taxableIncome]);
          data.push(['']);
          data.push(['Tax Liability Calculation', '', '']);

          // Add tax bracket breakdown
          content.taxBracketBreakdown.forEach(bracket => {
            data.push([
              `${bracket.from.toLocaleString()} - ${bracket.to.toLocaleString()} (${(bracket.rate * 100)}%)`,
              '',
              bracket.tax
            ]);
          });

          data.push(['']);
          data.push(['Total Tax Liability', '', content.totalTaxPayable]);
          data.push(['']);

          // Add tax deductions if any
          if (Object.values(content.deductions).some(value => value > 0)) {
            data.push(['Tax Deductions - Credits', '', '']);
            if (content.deductions.apit > 0) {
              data.push(['• APIT (Advanced Personal Income Tax)', '', content.deductions.apit]);
            }
            if (content.deductions.ait > 0) {
              data.push(['• AIT (Advance Income Tax)', '', content.deductions.ait]);
            }
            if (content.deductions.paidTax > 0) {
              data.push(['• Paid Tax', '', content.deductions.paidTax]);
            }
            if (content.deductions.wht > 0) {
              data.push(['• WHT (Withholding Tax)', '', content.deductions.wht]);
            }
          }

          data.push(['']);
          data.push(['Balance Tax Payable', '', content.balanceTaxPayable]);

          // Create worksheet
          const ws = XLSX.utils.aoa_to_sheet(data);

          // Set column widths
          ws['!cols'] = [
            { wch: 50 }, // First column - descriptions
            { wch: 10 }, // Second column - spacing
            { wch: 20 }  // Third column - amounts
          ];

          // Add worksheet to workbook
          XLSX.utils.book_append_sheet(wb, ws, 'Tax Calculation');
          
          // Convert to blob
          const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
          documentBlob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
          filename = `Tax_Calculation_${content.taxYear.replace('/', '_')}.xlsx`;
          console.log('Excel blob created, size:', documentBlob.size);
        } else if (format === 'word') {
          console.log('Generating Word document...');
          // For Word, generate the HTML content (same as downloadAsWord function)
          const htmlContent = `
            <html xmlns:o="urn:schemas-microsoft-com:office:office" 
                  xmlns:w="urn:schemas-microsoft-com:office:word" 
                  xmlns="http://www.w3.org/TR/REC-html40">
            <head>
                <meta charset="utf-8">
                <title>Tax Calculation</title>
                <style>
                    body { 
                        font-family: Arial, sans-serif;
                        margin: 0;
                        padding: 20px;
                    }
                    .user-details {
                        margin-bottom: 20px;
                    }
                    .user-detail-row {
                        margin-bottom: 10px;
                    }
                    .user-detail-label {
                        font-weight: bold;
                        margin-right: 10px;
                    }
                    table {
                        width: 100%;
                        border-collapse: collapse;
                        margin-bottom: 20px;
                    }
                    td, th {
                        padding: 8px;
                        text-align: left;
                    }
                    .category-row {
                        font-weight: bold;
                        background-color: #f5f5f5;
                    }
                    .total-row {
                        font-weight: bold;
                        border-top: 2px solid #000;
                    }
                    .bullet-row td:first-child {
                        width: 20px;
                    }
                    .amount-column {
                        text-align: right;
                    }
                    .section-header {
                        font-weight: bold;
                        background-color: #f0f0f0;
                    }
                    .spacer-row {
                        height: 10px;
                    }
                </style>
            </head>
            <body>
                <div class="user-details">
                    <div class="user-detail-row">
                        <span class="user-detail-label">Full Name:</span>
                        <span>${content.userDetails.fullName}</span>
                    </div>
                    <div class="user-detail-row">
                        <span class="user-detail-label">TIN Number:</span>
                        <span>${content.userDetails.tinNumber}</span>
                    </div>
                    <div class="user-detail-row">
                        <span class="user-detail-label">Year of Assessment:</span>
                        <span>${content.taxYear}</span>
                    </div>
                    <div class="user-detail-row">
                        <span class="user-detail-label">Date & Time:</span>
                        <span>${content.userDetails.date} ${content.userDetails.time}</span>
                    </div>
                </div>

                <h1 style="text-align: center; margin-bottom: 20px;">Calculation of Income Tax Liability - ${content.taxYear}</h1>
                
                <table>
                    <thead>
                        <tr>
                            <th colspan="2">Income Types and Deductions</th>
                            <th>Amount (Rs.)</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${content.summaryData.map(category => {
                          if (category.category !== 'Qualifying Payments & Relief' && 
                              category.category !== 'Terminal Benefits' && 
                              hasEntries(category)) {
                            return `
                                <tr class="category-row">
                                    <td colspan="2">${category.category}</td>
                                    <td class="amount-column">${Number(category.amount).toLocaleString()}</td>
                                </tr>
                                ${category.entries?.map(entry => 
                                  Number(entry.amount) > 0 ? `
                                    <tr class="bullet-row">
                                        <td>•</td>
                                        <td>${entry.name}</td>
                                        <td class="amount-column">${Number(entry.amount).toLocaleString()}</td>
                                    </tr>
                                  ` : ''
                                ).join('')}
                            `;
                          }
                          return '';
                        }).join('')}
                        
                        <tr class="total-row">
                            <td colspan="2">Assessable Income</td>
                            <td class="amount-column">${Number(content.assessableIncome).toLocaleString()}</td>
                        </tr>
                        
                        <tr class="spacer-row"><td colspan="3"></td></tr>
                        <tr class="spacer-row"><td colspan="3"></td></tr>
                        
                        ${content.summaryData.find(cat => cat.category === 'Terminal Benefits')?.entries?.length > 0 ? `
                          <tr class="section-header">
                              <td colspan="3">Terminal Benefits (Less)</td>
                          </tr>
                          ${content.summaryData.find(cat => cat.category === 'Terminal Benefits')?.entries?.map(entry => 
                            Number(entry.amount) > 0 ? `
                              <tr class="bullet-row">
                                  <td>•</td>
                                  <td>${entry.name}</td>
                                  <td class="amount-column">${Number(entry.amount).toLocaleString()}</td>
                              </tr>
                            ` : ''
                          ).join('')}
                        ` : ''}
                        
                        <tr class="section-header">
                            <td colspan="3">Relief & Qualifying Payments (Less)</td>
                        </tr>
                        <tr class="bullet-row">
                            <td>•</td>
                            <td>Personal Relief</td>
                            <td class="amount-column">Rs. ${Number(PERSONAL_RELIEF_AMOUNTS[content.taxYear]).toLocaleString()}</td>
                        </tr>
                        
                        ${content.summaryData.find(cat => cat.category === 'Qualifying Payments & Relief')?.entries
                          ?.filter(entry => !entry.type.includes('Personal Relief') && Number(entry.amount) > 0)
                          .map(entry => `
                            <tr class="bullet-row">
                                <td>•</td>
                                <td>${entry.name}</td>
                                <td class="amount-column">Rs. ${Number(entry.amount).toLocaleString()}</td>
                            </tr>
                          `).join('')}
                        
                        <tr class="total-row">
                            <td colspan="2">Taxable Income</td>
                            <td class="amount-column">Rs. ${Number(content.taxableIncome).toLocaleString()}</td>
                        </tr>
                        
                        <tr class="spacer-row"><td colspan="3"></td></tr>
                        <tr class="spacer-row"><td colspan="3"></td></tr>
                        
                        <tr class="section-header">
                            <td colspan="3">Tax Liability Calculation</td>
                        </tr>

                        ${content.taxBracketBreakdown.map((bracket, index) => `
                          <tr class="bullet-row">
                              <td></td>
                              <td>
                                  ${bracket.from.toLocaleString()} - ${bracket.to.toLocaleString()} ---------- (${(bracket.rate * 100)}%)
                              </td>
                              <td class="amount-column">${Number(bracket.tax).toLocaleString()}</td>
                          </tr>
                        `).join('')}
                        
                        <tr class="total-row">
                            <td colspan="2">Total Tax Liability</td>
                            <td class="amount-column">Rs. ${Number(content.totalTaxPayable).toLocaleString()}</td>
                        </tr>
                        
                        ${Object.values(content.deductions).some(value => value > 0) ? `
                          <tr class="spacer-row"><td colspan="3"></td></tr>
                          <tr class="spacer-row"><td colspan="3"></td></tr>
                          
                          <tr class="section-header">
                              <td colspan="3">Tax Deductions - Credits</td>
                          </tr>
                          ${content.deductions.apit > 0 ? `
                            <tr class="bullet-row">
                                <td>•</td>
                                <td>APIT (Advanced Personal Income Tax)</td>
                                <td class="amount-column">(${Number(content.deductions.apit).toLocaleString()})</td>
                            </tr>
                          ` : ''}
                          ${content.deductions.ait > 0 ? `
                            <tr class="bullet-row">
                                <td>•</td>
                                <td>AIT (Advance Income Tax)</td>
                                <td class="amount-column">(${Number(content.deductions.ait).toLocaleString()})</td>
                            </tr>
                          ` : ''}
                          ${content.deductions.paidTax > 0 ? `
                            <tr class="bullet-row">
                                <td>•</td>
                                <td>Paid Tax</td>
                                <td class="amount-column">(${Number(content.deductions.paidTax).toLocaleString()})</td>
                            </tr>
                          ` : ''}
                          ${content.deductions.wht > 0 ? `
                            <tr class="bullet-row">
                                <td>•</td>
                                <td>WHT (Withholding Tax)</td>
                                <td class="amount-column">(${Number(content.deductions.wht).toLocaleString()})</td>
                            </tr>
                          ` : ''}
                        ` : ''}
                        
                        <tr class="spacer-row"><td colspan="3"></td></tr>
                        <tr class="spacer-row"><td colspan="3"></td></tr>
                        
                        <tr class="total-row">
                            <td colspan="2">Balance Tax Payable</td>
                            <td class="amount-column">Rs. ${Number(content.balanceTaxPayable).toLocaleString()}</td>
                        </tr>
                    </tbody>
                </table>
            </body>
            </html>
          `;
          documentBlob = new Blob([htmlContent], { type: 'application/msword' });
          filename = `Tax_Calculation_${content.taxYear.replace('/', '_')}.doc`;
          console.log('Word blob created, size:', documentBlob.size);
        }
        
        if (documentBlob) {
          formData.append('document', documentBlob, filename);
          console.log('Document blob added to FormData, filename:', filename);
          console.log('FormData entries:');
          for (let [key, value] of formData.entries()) {
            console.log(key, value);
          }
        } else {
          console.error('No document blob created');
          alert('Failed to generate document. Please try again.');
          return;
        }
        
        // Send the request
        sendDocumentToServer(formData, accessToken);
        
      } catch (error) {
        console.error('Error saving document:', error);
        alert('Error generating document. Please try again.');
      }
    };

    const sendDocumentToServer = async (formData, accessToken) => {
      try {
        console.log('Sending document to server...');
        console.log('Access token:', accessToken ? 'Present' : 'Missing');
        
        // Log FormData contents for debugging
        console.log('FormData contents:');
        for (let [key, value] of formData.entries()) {
          if (value instanceof File) {
            console.log(`${key}: File - ${value.name}, Size: ${value.size} bytes, Type: ${value.type}`);
          } else {
            console.log(`${key}: ${typeof value === 'string' ? value.substring(0, 100) + '...' : value}`);
          }
        }
        
        const response = await fetch('/api/tax-report/save-document/', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            // Don't set Content-Type for FormData, let browser set it with boundary
          },
          body: formData
        });

        console.log('Response status:', response.status);
        console.log('Response headers:', Object.fromEntries(response.headers.entries()));

        if (response.ok) {
          const result = await response.json();
          console.log('Document saved successfully:', result);
          
          // Show simple success message without user details
          alert('Document saved and downloaded successfully');
        } else {
          const errorData = await response.json();
          console.error('Failed to save document:', errorData);
          alert(`Failed to save document: ${errorData.error || 'Unknown error'}`);
        }
      } catch (error) {
        console.error('Error saving document:', error);
        alert('Error saving document to database. Please try again.');
      }
    };

    // Update the render section to show detailed breakdown
    return (
        <div className="preview-page">
            <Header />
            <TaxationMenu />
            <div style={{ position: 'fixed', top: '115px', left: '24px', zIndex: 1000 }}>
                <button
                    className={styles.nextButton}
                    onClick={handleOpenAnalysis}
                >
                    Analysis Result
                </button>
            </div>
            {showAnalysisResults && (
                <AnalysisResults
                    results={analysisResults}
                    onClose={() => setShowAnalysisResults(false)}
                    onAutoFill={() => {}}
                />
            )}
            <div className={styles.container}>
                <div className={styles.contentWrapper}>
                    <div className={styles.header}>
                        <div className={styles.downloadContainer} ref={downloadMenuRef}>
                            <button 
                                className={styles.actionButton} 
                                onClick={() => setShowDownloadMenu(!showDownloadMenu)}
                            >
                                <Download size={16} />
                                Download
                                <ChevronDown size={16} />
                            </button>
                            {showDownloadMenu && (
                                <div className={styles.downloadMenu}>
                                    <button onClick={() => handleDownload('pdf')}>Download as PDF</button>
                                    <button onClick={() => handleDownload('excel')}>Download as Excel</button>
                                    <button onClick={() => handleDownload('word')}>Download as Word</button>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className={styles.documentContainer}>
                        <h1 className={styles.mainHeading}>
                            Calculation of Income Tax Liability - {taxYear}
                        </h1>
                        
                        <div className={styles.headerSection}>
                            <div className={styles.userDetails}>
                                <div className={styles.userDetailRow}>
                                    <span className={styles.userDetailLabel}>Full Name:</span>
                                    <span className={styles.userDetailValue}>{userDetails.fullName}</span>
                                </div>
                                <div className={styles.userDetailRow}>
                                    <span className={styles.userDetailLabel}>TIN Number:</span>
                                    <span className={styles.userDetailValue}>{userDetails.tinNumber}</span>
                                </div>
                                <div className={styles.userDetailRow}>
                                    <span className={styles.userDetailLabel}>Year </span>
                                    <span className={styles.userDetailValue}>{taxYear}</span>
                                </div>
                                <div className={styles.userDetailRow}>
                                    <span className={styles.userDetailLabel}>Date & Time:</span>
                                    <span className={styles.userDetailValue}>{userDetails.date} {userDetails.time}</span>
                                </div>
                            </div>
                            <div className={styles.logoContainer}>
                                <img src={TaxLogo} alt="Tax Logo" className={styles.taxLogo} />
                            </div>
                        </div>

                        <table className={styles.taxTable}>
                            <thead>
                                <tr>
                                    <th colSpan="2">Income Types and Deductions </th>
                                    <th>Amount (Rs.)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {/* Regular Income Categories */}
                                {summaryData.map((category, categoryIndex) => (
                                    category.category !== 'Qualifying Payments & Relief' && 
                                    category.category !== 'Terminal Benefits' && 
                                    hasEntries(category) && (
                                        <React.Fragment key={`category-${categoryIndex}`}>
                                            <tr className={styles.categoryRow}>
                                                <td colSpan="2">
                                                    {isEditing ? (
                                                        <EditableCell
                                                            value={category.category}
                                                            onChange={(value) => {
                                                                const newData = [...summaryData];
                                                                newData[categoryIndex].category = value;
                                                                setSummaryData(newData);
                                                            }}
                                                        />
                                                    ) : category.category}
                                                </td>
                                                <td className={styles.amountColumn}>
                                                    {category.amount > 0 && `Rs. ${Number(category.amount).toLocaleString()}`}
                                                    {isEditing && (
                                                        <button 
                                                            onClick={() => handleAddRow(categoryIndex)}
                                                            className={styles.addButton}
                                                        >
                                                            <Plus size={16} />
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                            
                                            {category.entries?.map((entry, entryIndex) => (
                                                Number(entry.amount) > 0 && (
                                                    <EditableRow
                                                        key={`entry-${entryIndex}`}
                                                        entry={entry}
                                                        isEditing={isEditing}
                                                        onUpdate={(updatedEntry) => 
                                                            handleUpdateRow(categoryIndex, entryIndex, updatedEntry)
                                                        }
                                                        onDelete={() => handleDeleteRow(categoryIndex, entryIndex)}
                                                    />
                                                )
                                            ))}
                                        </React.Fragment>
                                    )
                                ))}

                                {/* Assessable Income */}
                                <tr className={styles.totalRow} data-type="assessable">
                                    <td colSpan="2">Assessable Income</td>
                                    <td className={styles.amountColumn}>
                                        Rs. {Number(assessableIncome).toLocaleString()}
                                    </td>
                                </tr>

                                {/* Add spacer rows */}
                                <tr className={styles.spacerRow}>
                                    <td colSpan="3"></td>
                                </tr>
                                <tr className={styles.spacerRow}>
                                    <td colSpan="3"></td>
                                </tr>

                                {/* Less - Terminal Benefits section */}
                                {summaryData.some(category => 
                                    category.category === 'Terminal Benefits' && hasEntries(category)
                                ) && (
                                    <>
                                        <tr className={styles.sectionHeader}>
                                            <td colSpan="3">Terminal Benefits (Less)</td>
                                        </tr>
                                        {summaryData.map(category => (
                                            category.category === 'Terminal Benefits' && 
                                            category.entries?.map((entry, i) => (
                                                Number(entry.amount) > 0 && (
                                                    <EditableRow
                                                        key={`terminal-${i}`}
                                                        entry={entry}
                                                        onUpdate={(updatedEntry) => {
                                                            const updatedCategory = { ...category };
                                                            updatedCategory.entries[i] = updatedEntry;
                                                            const updatedSummaryData = [...summaryData];
                                                            const categoryIndex = updatedSummaryData.findIndex(cat => cat.category === 'Terminal Benefits');
                                                            updatedSummaryData[categoryIndex] = updatedCategory;
                                                            setSummaryData(updatedSummaryData);
                                                        }}
                                                        onDelete={() => {
                                                            const updatedCategory = { ...category };
                                                            updatedCategory.entries.splice(i, 1);
                                                            const updatedSummaryData = [...summaryData];
                                                            const categoryIndex = updatedSummaryData.findIndex(cat => cat.category === 'Terminal Benefits');
                                                            updatedSummaryData[categoryIndex] = updatedCategory;
                                                            setSummaryData(updatedSummaryData);
                                                        }}
                                                        isEditing={isEditing}
                                                    />
                                                )
                                            ))
                                        ))}
                                    </>
                                )}

                                {/* Less - Relief & Qualifying Payments */}
                                <>
                                    <tr className={styles.sectionHeader}>
                                        <td colSpan="3">Relief & Qualifying Payments (Less)</td>
                                    </tr>
                                    
                                    {/* Always show Personal Relief */}
                                    <tr className={styles.bulletRow}>
                                        <td className={styles.bulletCell}>•</td>
                                        <td>Personal Relief</td>
                                        <td className={styles.amountColumn}>
                                            Rs. {Number(PERSONAL_RELIEF_AMOUNTS[taxYear]).toLocaleString()}
                                        </td>
                                    </tr>

                                    {/* Show other qualifying payments if they exist */}
                                    {summaryData.map(category => {
                                        if (category.category === 'Qualifying Payments & Relief') {
                                            return category.entries
                                                .filter(entry => !entry.type.includes('Personal Relief') && Number(entry.amount) > 0)
                                                .map((entry, i) => (
                                                    <EditableRow
                                                        key={`relief-${i}`}
                                                        entry={entry}
                                                        isEditing={isEditing}
                                                        onUpdate={(updatedEntry) => {
                                                            const updatedCategory = { ...category };
                                                            updatedCategory.entries[i] = updatedEntry;
                                                            const updatedSummaryData = [...summaryData];
                                                            const categoryIndex = updatedSummaryData.findIndex(cat => cat.category === 'Qualifying Payments & Relief');
                                                            updatedSummaryData[categoryIndex] = updatedCategory;
                                                            setSummaryData(updatedSummaryData);
                                                        }}
                                                        onDelete={() => {
                                                            const updatedCategory = { ...category };
                                                            updatedCategory.entries.splice(i, 1);
                                                            const updatedSummaryData = [...summaryData];
                                                            const categoryIndex = updatedSummaryData.findIndex(cat => cat.category === 'Qualifying Payments & Relief');
                                                            updatedSummaryData[categoryIndex] = updatedCategory;
                                                            setSummaryData(updatedSummaryData);
                                                        }}
                                                    />
                                                ));
                                        }
                                        return null;
                                    })}
                                </>

                                {/* Taxable Income */}
                                <tr className={styles.totalRow} data-type="taxable">
                                    <td colSpan="2">Taxable Income</td>
                                    <td className={styles.amountColumn}>
                                        Rs. {Number(taxableIncome).toLocaleString()}
                                    </td>
                                </tr>

                                {/* Add spacer rows */}
                                <tr className={styles.spacerRow}>
                                    <td colSpan="3"></td>
                                </tr>
                                <tr className={styles.spacerRow}>
                                    <td colSpan="3"></td>
                                </tr>
                                

                                {/* Tax Liability Breakdown Section */}
                                <tr className={styles.sectionHeader + ' ' + styles.pageBreak}>
                                    <td colSpan="3">Tax Liability Calculation</td>
                                </tr>

                                {taxBracketBreakdown.map((bracket, index) => (
                                    <tr key={`bracket-${index}`} className={styles.bulletRow}>
                                        <td className={styles.bulletCell}></td>
                                        <td>
                                            {bracket.from.toLocaleString()} - {bracket.to.toLocaleString()} ---------- ({(bracket.rate * 100)}%)
                                        </td>
                                        <td className={styles.amountColumn}>
                                            {Number(bracket.tax).toLocaleString()}
                                        </td>
                                    </tr>
                                ))}

                                {/* Total Tax Liability */}
                                <tr className={styles.totalRow}>
                                    <td colSpan="2">Total Tax Liability</td>
                                    <td className={styles.amountColumn}>
                                        Rs. {Number(totalTaxPayable).toLocaleString()}
                                    </td>
                                </tr>

                                {/* Add spacer rows */}
                                <tr className={styles.spacerRow}>
                                    <td colSpan="3"></td>
                                </tr>
                                <tr className={styles.spacerRow}>
                                    <td colSpan="3"></td>
                                </tr>

                                {/* Tax Deductions Section */}
                                {Object.values(deductions).some(value => value > 0) && (
                                    <>
                                        <tr className={styles.sectionHeader}>
                                            <td colSpan="3">Tax Deductions - Credits</td>
                                        </tr>
                                        {/* Only show deductions with values > 0 */}
                                        {deductions.apit > 0 && (
                                            <tr className={styles.bulletRow}>
                                                <td className={styles.bulletCell}>•</td>
                                                <td>APIT (Advanced Personal Income Tax)</td>
                                                <td className={styles.amountColumn}>
                                                    ({Number(deductions.apit).toLocaleString()})
                                                </td>
                                            </tr>
                                        )}
                                        {/* Repeat for other deductions... */}
                                        {deductions.ait > 0 && (
                                            <tr className={styles.bulletRow}>
                                                <td className={styles.bulletCell}>•</td>
                                                <td>AIT (Advance Income Tax)</td>
                                                <td className={styles.amountColumn}>
                                                    ({Number(deductions.ait).toLocaleString()})
                                                </td>
                                            </tr>
                                        )}

                                        {/* Paid Tax Deductions */}
                                        {deductions.paidTax > 0 && (
                                            <tr className={styles.bulletRow}>
                                                <td className={styles.bulletCell}>•</td>
                                                <td>Paid Tax</td>
                                                <td className={styles.amountColumn}>
                                                    ({Number(deductions.paidTax).toLocaleString()})
                                                </td>
                                            </tr>
                                        )}

                                        {/* WHT Deductions */}
                                        {deductions.wht > 0 && (
                                            <tr className={styles.bulletRow}>
                                                <td className={styles.bulletCell}>•</td>
                                                <td>WHT (Withholding Tax)</td>
                                                <td className={styles.amountColumn}>
                                                    ({Number(deductions.wht).toLocaleString()})
                                                </td>
                                            </tr>
                                        )}
                                    </>
                                )}

                               {/* Add spacer rows */}
                                <tr className={styles.spacerRow}>
                                    <td colSpan="3"></td>
                                </tr>
                                <tr className={styles.spacerRow}>
                                    <td colSpan="3"></td>
                                </tr>

                                {/* Balance Tax Payable */}
                                <tr className={styles.totalRow}>
                                    <td colSpan="2">Balance Tax Payable</td>
                                    <td className={styles.amountColumn}>
                                        Rs. {Number(balanceTaxPayable).toLocaleString()}
                                    </td>
                                </tr>

                                {/* Add spacer rows */}
                                <tr className={styles.spacerRow}>
                                    <td colSpan="3"></td>
                                </tr>
                                <tr className={styles.spacerRow}>
                                    <td colSpan="3"></td>
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
