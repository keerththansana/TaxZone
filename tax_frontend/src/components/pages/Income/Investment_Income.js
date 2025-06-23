import React, { useState, useEffect } from 'react';
import { ChevronDown, Plus, Trash2 } from "lucide-react";
import { useNavigate } from 'react-router-dom';
import Header from '../../common/Header/Header';
import styles from './Employment_Income.module.css';
import TaxationMenu from './Taxation_Menu';
import { useFormPersist } from './Data_Persistence';
import { AutoFillHelper } from '../../../utils/autoFillHelper';
import AnalysisResults from './AnalysisResults';

const RENTAL_RELIEF_AMOUNT = 225000; // Rs. 225,000

const InvestmentIncome = () => {
    const [openDescription, setOpenDescription] = useState(null);
    const [selectedDeductions, setSelectedDeductions] = useState([]);
    const [showForm, setShowForm] = useState(true);
    const [showAnalysisResults, setShowAnalysisResults] = useState(false);
    const [analysisResults, setAnalysisResults] = useState([]);

    // Initialize form data with persistence
    const [formData, setFormData] = useFormPersist('investmentIncomeData', {
        selectedTypes: [],
        interestEntries: [{ name: 'Interest Income', amount: '' }],
        dividendEntries: [{ name: 'Dividend Income', amount: '' }],
        rentEntries: [{ name: 'Rental Income', amount: '' }],
        capitalGainEntries: [{ name: 'Capital Gain', amount: '' }],
        otherEntries: [{ name: 'Other Investment Income', amount: '' }],
        taxDeductions: [],
        totalInvestmentIncome: 0,
        totalDeductions: 0
    });

    // Destructure values from formData
    const {
        selectedTypes,
        interestEntries,
        dividendEntries,
        rentEntries,
        capitalGainEntries,
        otherEntries,
        taxDeductions,
        totalInvestmentIncome,
        totalDeductions
    } = formData;

    const navigate = useNavigate();

    // Update form data helper function
    const updateFormData = (updates) => {
        setFormData(prev => ({
            ...prev,
            ...updates
        }));
    };

    // Entry setters
    const setInterestEntries = (entries) => {
        updateFormData({ interestEntries: Array.isArray(entries) ? entries : entries(formData.interestEntries) });
    };

    const setDividendEntries = (entries) => {
        updateFormData({ dividendEntries: Array.isArray(entries) ? entries : entries(formData.dividendEntries) });
    };

    const setRentEntries = (entries) => {
        updateFormData({ rentEntries: Array.isArray(entries) ? entries : entries(formData.rentEntries) });
    };

    const setCapitalGainEntries = (entries) => {
        updateFormData({ capitalGainEntries: Array.isArray(entries) ? entries : entries(formData.capitalGainEntries) });
    };

    const setOtherEntries = (entries) => {
        updateFormData({ otherEntries: Array.isArray(entries) ? entries : entries(formData.otherEntries) });
    };

    // Navigation check
    useEffect(() => {
        const selectedCategories = JSON.parse(sessionStorage.getItem('selectedCategories') || '[]');
        const currentCategory = sessionStorage.getItem('currentCategory');
        
        if (!selectedCategories.includes('investment') || currentCategory !== 'investment') {
            navigate('/taxation');
        }
    }, [navigate]);

    // Calculate totals
    useEffect(() => {
        const calculateTotal = entries => entries.reduce((sum, entry) => sum + (Number(entry.amount) || 0), 0);
        
        const total = calculateTotal(interestEntries) +
            calculateTotal(dividendEntries) +
            calculateTotal(rentEntries) +
            calculateTotal(capitalGainEntries) +
            calculateTotal(otherEntries);

        updateFormData({ totalInvestmentIncome: total });
    }, [interestEntries, dividendEntries, rentEntries, capitalGainEntries, otherEntries]);

    // Add event listener for auto-fill data
    useEffect(() => {
        const fetchAutoFillData = async () => {
            try {
                // First check if we have analysis data in session storage
                const storedAnalysis = sessionStorage.getItem('last_analysis');
                if (storedAnalysis) {
                    try {
                        const analysisData = JSON.parse(storedAnalysis);
                        console.log('Found analysis data in session:', analysisData);
                        
                        // Format the data for the investment form
                        const formattedData = {
                            interestEntries: [],
                            dividendEntries: [],
                            rentEntries: [],
                            capitalGainEntries: [],
                            otherEntries: [],
                            selectedTypes: [],
                            taxDeductions: [],
                            totalInvestmentIncome: 0
                        };

                        // Process income items from each result
                        analysisData.forEach(result => {
                            if (result.analysis && result.analysis.income_items) {
                                result.analysis.income_items.forEach(item => {
                                    const description = (item.description || '').toLowerCase();
                                    const amount = item.amount || 0;
                                    let category = item.category || '';

                                    // Process Investment Income
                                    if (category === 'Investment Income') {
                                        if (description.includes('interest') || description.includes('bank')) {
                                            formattedData.interestEntries.push({
                                                name: item.description || 'Interest Income',
                                                amount: amount.toString()
                                            });
                                            if (!formattedData.selectedTypes.includes('interest')) {
                                                formattedData.selectedTypes.push('interest');
                                            }
                                        } else if (description.includes('dividend')) {
                                            formattedData.dividendEntries.push({
                                                name: item.description || 'Dividend Income',
                                                amount: amount.toString()
                                            });
                                            if (!formattedData.selectedTypes.includes('dividend')) {
                                                formattedData.selectedTypes.push('dividend');
                                            }
                                        } else if (description.includes('rent') || description.includes('property')) {
                                            formattedData.rentEntries.push({
                                                name: item.description || 'Rental Income',
                                                amount: amount.toString()
                                            });
                                            if (!formattedData.selectedTypes.includes('rent')) {
                                                formattedData.selectedTypes.push('rent');
                                            }
                                        } else if (description.includes('capital') || description.includes('gain')) {
                                            formattedData.capitalGainEntries.push({
                                                name: item.description || 'Capital Gain',
                                                amount: amount.toString()
                                            });
                                            if (!formattedData.selectedTypes.includes('capital-gain')) {
                                                formattedData.selectedTypes.push('capital-gain');
                                            }
                                        } else {
                                            formattedData.otherEntries.push({
                                                name: item.description || 'Other Investment Income',
                                                amount: amount.toString()
                                            });
                                            if (!formattedData.selectedTypes.includes('other-investment')) {
                                                formattedData.selectedTypes.push('other-investment');
                                            }
                                        }
                                    }
                                });
                            }

                            // Process deductions
                            if (result.analysis && result.analysis.deductions) {
                                result.analysis.deductions.forEach(deduction => {
                                    const type = (deduction.type || '').toLowerCase();
                                    const source = (deduction.source || '').toLowerCase();
                                    const amount = deduction.amount || 0;

                                    if (type.includes('investment') || source.includes('investment')) {
                                        formattedData.taxDeductions.push({
                                            type: deduction.type || 'AIT',
                                            source: deduction.source || 'Investment Income',
                                            name: deduction.description || 'Investment Tax Deduction',
                                            amount: amount.toString()
                                        });
                                    }
                                });
                            }
                        });

                        // Calculate total investment income
                        formattedData.totalInvestmentIncome = 
                            formattedData.interestEntries.reduce((sum, entry) => sum + Number(entry.amount), 0) +
                            formattedData.dividendEntries.reduce((sum, entry) => sum + Number(entry.amount), 0) +
                            formattedData.rentEntries.reduce((sum, entry) => sum + Number(entry.amount), 0) +
                            formattedData.capitalGainEntries.reduce((sum, entry) => sum + Number(entry.amount), 0) +
                            formattedData.otherEntries.reduce((sum, entry) => sum + Number(entry.amount), 0);

                        // Only update if we have data
                        if (formattedData.interestEntries.length > 0 || 
                            formattedData.dividendEntries.length > 0 || 
                            formattedData.rentEntries.length > 0 || 
                            formattedData.capitalGainEntries.length > 0 || 
                            formattedData.otherEntries.length > 0 || 
                            formattedData.taxDeductions.length > 0) {
                            console.log('Formatted data for investment form:', formattedData);

                            // Update the form with the formatted data
                            setFormData(formattedData);
                            setShowForm(true);

                            // Store the formatted data in session storage
                            sessionStorage.setItem('investmentIncomeData', JSON.stringify(formattedData));
                        } else {
                            console.log('No relevant investment data found in analysis');
                        }
                    } catch (error) {
                        console.error('Error processing stored analysis data:', error);
                    }
                } else {
                    console.log('No analysis data found in session storage - using default form');
                }
            } catch (error) {
                console.error('Error fetching auto-fill data:', error);
            }
        };

        // Check session storage first
        const storedData = sessionStorage.getItem('investmentIncomeData');
        if (storedData) {
            try {
                const parsedData = JSON.parse(storedData);
                setFormData(parsedData);
                setShowForm(true);
            } catch (error) {
                console.error('Error parsing stored data:', error);
            }
        }

        // Then try to fetch auto-fill data
        fetchAutoFillData();

        // Listen for auto-fill data updates
        const handleAutoFillUpdate = (event) => {
            if (event.data && event.data.type === 'autoFillUpdate') {
                const data = event.data.payload;
                // Support both new and legacy keys
                if (data.investmentIncome) {
                    const inv = data.investmentIncome;
                    const selectedTypes = [
                        ...(inv.interestIncomeEntries?.length ? ['interest'] : []),
                        ...(inv.dividendIncomeEntries?.length ? ['dividend'] : []),
                        ...(inv.rentalIncomeEntries?.length ? ['rent'] : []),
                        ...(inv.capitalGainEntries?.length ? ['capital'] : []),
                        ...(inv.otherInvestmentEntries?.length ? ['other'] : []),
                    ];
                    updateFormData({
                        interestEntries: inv.interestIncomeEntries || [],
                        dividendEntries: inv.dividendIncomeEntries || [],
                        rentEntries: inv.rentalIncomeEntries || [],
                        capitalGainEntries: inv.capitalGainEntries || [],
                        otherEntries: inv.otherInvestmentEntries || [],
                        selectedTypes,
                    });
                } else if (data.InvestmentIncome) {
                    const inv = data.InvestmentIncome;
                    const selectedTypes = [
                        ...(inv.interestIncomeEntries?.length ? ['interest'] : []),
                        ...(inv.dividendIncomeEntries?.length ? ['dividend'] : []),
                        ...(inv.rentalIncomeEntries?.length ? ['rent'] : []),
                        ...(inv.capitalGainEntries?.length ? ['capital'] : []),
                        ...(inv.otherInvestmentEntries?.length ? ['other'] : []),
                    ];
                    updateFormData({
                        interestEntries: inv.interestIncomeEntries || [],
                        dividendEntries: inv.dividendIncomeEntries || [],
                        rentEntries: inv.rentalIncomeEntries || [],
                        capitalGainEntries: inv.capitalGainEntries || [],
                        otherEntries: inv.otherInvestmentEntries || [],
                        selectedTypes,
                    });
                }
            }
        };
        window.addEventListener('message', handleAutoFillUpdate);
        return () => window.removeEventListener('message', handleAutoFillUpdate);
    }, []);

    // Handle form submission
    const handleSubmit = (e) => {
        e.preventDefault();
        
        // Save form data
        const formData = {
            selectedTypes,
            interestEntries,
            dividendEntries,
            rentEntries,
            capitalGainEntries,
            otherEntries,
            taxDeductions,
            totalInvestmentIncome
        };
        sessionStorage.setItem('investmentIncomeData', JSON.stringify(formData));

        // Get next form to navigate to
        const selectedCategories = JSON.parse(sessionStorage.getItem('selectedCategories') || '[]');
        const currentIndex = selectedCategories.indexOf('investment');
        const nextCategory = selectedCategories[currentIndex + 1];

        // Update current category in session storage
        if (nextCategory) {
            sessionStorage.setItem('currentCategory', nextCategory);
        }

        // Navigate to appropriate form
        if (nextCategory) {
            const routes = {
                employment: '/employment_income',
                business: '/business_income',
                other: '/other_income',
                terminal: '/terminal_benefits',
                qualifying: '/qualifying_payments'
            };

            const nextRoute = routes[nextCategory];
            if (nextRoute) {
                navigate(nextRoute);
            } else {
                navigate('/preview');
            }
        } else {
            navigate('/preview');
        }

        // Trigger preview update
        window.dispatchEvent(new Event('incomeDataUpdated'));
    };

    const investmentTypes = [
        {
            id: 'interest',
            label: 'Interest Income',
            description: 'Income from bank deposits, bonds, and other interest-bearing investments.'
        },
        {
            id: 'dividend',
            label: 'Dividend Income',
            description: 'Income from shares and other dividend-paying investments.'
        },
        {
            id: 'rent',
            label: 'Rental Income',
            description: 'Income from property rentals, including residential and commercial properties.'
        },
        {
            id: 'capital',
            label: 'Capital Gains',
            description: 'Profits from the sale of capital assets like property or investments.'
        },
        {
            id: 'other',
            label: 'Other Investment Income',
            description: 'Any other type of investment income not listed above.'
        }
    ];

    const deductionTypes = [
        {
            id: 'ait',
            label: 'Advance Income Tax (AIT)',
            description: 'Tax deducted at source on investment income'
        },
        {
            id: 'rental-relief',
            label: 'Rental Income Relief',
            description: 'Standard relief of Rs. 225,000 on rental income'
        },
        {
            id: 'capital-losses',
            label: 'Capital Losses',
            description: 'Losses from the sale of capital assets'
        }
    ];

    // Update handleTypeToggle to use updateFormData
    const handleTypeToggle = (typeId) => {
        const newTypes = selectedTypes.includes(typeId) 
            ? selectedTypes.filter(id => id !== typeId)
            : [...selectedTypes, typeId];
        
        updateFormData({ selectedTypes: newTypes });

        // Handle entries with investment type specific names
        if (!selectedTypes.includes(typeId)) {
            // Adding a new type
            switch(typeId) {
                case 'interest':
                    updateFormData({ interestEntries: [{ name: 'Interest Income', amount: '' }] });
                    break;
                case 'dividend':
                    updateFormData({ dividendEntries: [{ name: 'Dividend Income', amount: '' }] });
                    break;
                case 'rent':
                    updateFormData({ rentEntries: [{ name: 'Rental Income', amount: '' }] });
                    break;
                case 'capital':
                    updateFormData({ capitalGainEntries: [{ name: 'Capital Gain', amount: '' }] });
                    break;
                case 'other':
                    updateFormData({ otherEntries: [{ name: 'Other Investment Income', amount: '' }] });
                    break;
            }
        } else {
            // Removing a type
            switch(typeId) {
                case 'interest':
                    updateFormData({ interestEntries: [] });
                    break;
                case 'dividend':
                    updateFormData({ dividendEntries: [] });
                    break;
                case 'rent':
                    updateFormData({ rentEntries: [] });
                    break;
                case 'capital':
                    updateFormData({ capitalGainEntries: [] });
                    break;
                case 'other':
                    updateFormData({ otherEntries: [] });
                    break;
            }
        }
    };

    // Update handleDeductionToggle to use updateFormData
    const handleDeductionToggle = (deductionId) => {
        const newDeductions = selectedDeductions.includes(deductionId)
            ? selectedDeductions.filter(id => id !== deductionId)
            : [...selectedDeductions, deductionId];
        
        setSelectedDeductions(newDeductions);

        if (!selectedDeductions.includes(deductionId)) {
            updateFormData({
                taxDeductions: [
                    ...taxDeductions,
                    {
                        type: deductionId,
                        source: 'Investment Income',
                        name: deductionTypes.find(d => d.id === deductionId)?.label || 'Deduction',
                        amount: deductionId === 'rental-relief' ? RENTAL_RELIEF_AMOUNT.toString() : ''
                    }
                ]
            });
        } else {
            updateFormData({
                taxDeductions: taxDeductions.filter(d => d.type !== deductionId)
            });
        }
    };

    // Update handleDeductionAmountChange to use updateFormData
    const handleDeductionAmountChange = (deductionId, amount) => {
        updateFormData({
            taxDeductions: taxDeductions.map(d => 
                d.type === deductionId ? { ...d, amount } : d
            )
        });
    };

    const handleEntryChange = (index, field, value, type) => {
        const entries = {
            'interest': [interestEntries, setInterestEntries],
            'dividend': [dividendEntries, setDividendEntries],
            'rent': [rentEntries, setRentEntries],
            'capital': [capitalGainEntries, setCapitalGainEntries],
            'other': [otherEntries, setOtherEntries]
        }[type];

        const [currentEntries, setEntries] = entries;
        const newEntries = [...currentEntries];
        newEntries[index][field] = value;
        setEntries(newEntries);
    };

    const handleAddEntry = (type) => {
        const [entries, setEntries] = {
            'interest': [interestEntries, setInterestEntries],
            'dividend': [dividendEntries, setDividendEntries],
            'rent': [rentEntries, setRentEntries],
            'capital': [capitalGainEntries, setCapitalGainEntries],
            'other': [otherEntries, setOtherEntries]
        }[type];

        setEntries([...entries, { name: '', amount: '' }]);
    };

    const handleRemoveEntry = (index, type) => {
        const setEntries = {
            'interest': setInterestEntries,
            'dividend': setDividendEntries,
            'rent': setRentEntries,
            'capital': setCapitalGainEntries,
            'other': setOtherEntries
        }[type];

        setEntries(prev => prev.filter((_, i) => i !== index));
    };

    const handleOpenAnalysis = () => {
        const stored = sessionStorage.getItem('last_analysis');
        setAnalysisResults(stored ? JSON.parse(stored) : []);
        setShowAnalysisResults(true);
    };

    return (
        <div className="investment-income-page">
            <Header />
            <TaxationMenu />
            <div style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', margin: '16px 0 0 24px' }}>
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
                <div className={styles.header}>
                    <h1 className={styles.title}>Investment Income</h1>
                    <h2 className={styles.subtitle}>Select Applicable Investment Category</h2>
                </div>

                {showForm && (
                    <form className={styles.formContainer} onSubmit={handleSubmit}>
                        <div className={styles.selectionGroup}>
                            {investmentTypes.map((type) => (
                                <div key={type.id} className={styles.selectionItem}>
                                    <div className={styles.selectionHeader}>
                                        <label className={styles.checkboxLabel}>
                                            <input
                                                type="checkbox"
                                                checked={selectedTypes.includes(type.id)}
                                                onChange={() => handleTypeToggle(type.id)}
                                                className={styles.checkbox}
                                            />
                                            {type.label}
                                        </label>
                                        <button 
                                            type="button"
                                            className={styles.descriptionToggle}
                                            onClick={() => setOpenDescription(openDescription === type.id ? null : type.id)}
                                        >
                                            <ChevronDown className={`${styles.arrow} ${openDescription === type.id ? styles.rotated : ''}`} />
                                        </button>
                                    </div>
                                    {openDescription === type.id && (
                                        <div className={styles.description}>
                                            {type.description}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        {selectedTypes.includes('interest') && interestEntries.length > 0 && (
                            <div className={styles.section}>
                                <h3>Interest Income</h3>
                                {interestEntries.map((entry, index) => (
                                    <div key={index} className={styles.entryRow}>
                                        <input
                                            type="text"
                                            value={entry.name}
                                            onChange={(e) => handleEntryChange(index, 'name', e.target.value, 'interest')}
                                            placeholder="Description"
                                            className={styles.inputField}
                                        />
                                        <input
                                            type="number"
                                            value={entry.amount}
                                            onChange={(e) => handleEntryChange(index, 'amount', e.target.value, 'interest')}
                                            placeholder="Amount"
                                            className={styles.inputField}
                                        />
                                        <button 
                                            type="button" 
                                            onClick={() => handleRemoveEntry(index, 'interest')}
                                            className={styles.removeButton}
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                ))}
                                <button type="button" onClick={() => handleAddEntry('interest')} className={styles.addButton}>
                                    <Plus size={16} />
                                </button>
                            </div>
                        )}

                        {selectedTypes.includes('dividend') && dividendEntries.length > 0 && (
                            <div className={styles.section}>
                                <h3>Dividend Income</h3>
                                {dividendEntries.map((entry, index) => (
                                    <div key={index} className={styles.entryRow}>
                                        <input
                                            type="text"
                                            value={entry.name}
                                            onChange={(e) => handleEntryChange(index, 'name', e.target.value, 'dividend')}
                                            placeholder="Description"
                                            className={styles.inputField}
                                        />
                                        <input
                                            type="number"
                                            value={entry.amount}
                                            onChange={(e) => handleEntryChange(index, 'amount', e.target.value, 'dividend')}
                                            placeholder="Amount"
                                            className={styles.inputField}
                                        />
                                        <button 
                                            type="button" 
                                            onClick={() => handleRemoveEntry(index, 'dividend')}
                                            className={styles.removeButton}
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                ))}
                                <button type="button" onClick={() => handleAddEntry('dividend')} className={styles.addButton}>
                                    <Plus size={16} />
                                </button>
                            </div>
                        )}

                        {selectedTypes.includes('rent') && rentEntries.length > 0 && (
                            <div className={styles.section}>
                                <h3>Rental Income</h3>
                                {rentEntries.map((entry, index) => (
                                    <div key={index} className={styles.entryRow}>
                                        <input
                                            type="text"
                                            value={entry.name}
                                            onChange={(e) => handleEntryChange(index, 'name', e.target.value, 'rent')}
                                            placeholder="Description"
                                            className={styles.inputField}
                                        />
                                        <input
                                            type="number"
                                            value={entry.amount}
                                            onChange={(e) => handleEntryChange(index, 'amount', e.target.value, 'rent')}
                                            placeholder="Amount"
                                            className={styles.inputField}
                                        />
                                        <button 
                                            type="button" 
                                            onClick={() => handleRemoveEntry(index, 'rent')}
                                            className={styles.removeButton}
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                ))}
                                <button type="button" onClick={() => handleAddEntry('rent')} className={styles.addButton}>
                                    <Plus size={16} />
                                </button>
                            </div>
                        )}

                        {selectedTypes.includes('capital') && capitalGainEntries.length > 0 && (
                            <div className={styles.section}>
                                <h3>Capital Gains</h3>
                                {capitalGainEntries.map((entry, index) => (
                                    <div key={index} className={styles.entryRow}>
                                        <input
                                            type="text"
                                            value={entry.name}
                                            onChange={(e) => handleEntryChange(index, 'name', e.target.value, 'capital')}
                                            placeholder="Description"
                                            className={styles.inputField}
                                        />
                                        <input
                                            type="number"
                                            value={entry.amount}
                                            onChange={(e) => handleEntryChange(index, 'amount', e.target.value, 'capital')}
                                            placeholder="Amount"
                                            className={styles.inputField}
                                        />
                                        <button 
                                            type="button" 
                                            onClick={() => handleRemoveEntry(index, 'capital')}
                                            className={styles.removeButton}
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                ))}
                                <button type="button" onClick={() => handleAddEntry('capital')} className={styles.addButton}>
                                    <Plus size={16} />
                                </button>
                            </div>
                        )}

                        {selectedTypes.includes('other') && otherEntries.length > 0 && (
                            <div className={styles.section}>
                                <h3>Other Investment Income</h3>
                                {otherEntries.map((entry, index) => (
                                    <div key={index} className={styles.entryRow}>
                                        <input
                                            type="text"
                                            value={entry.name}
                                            onChange={(e) => handleEntryChange(index, 'name', e.target.value, 'other')}
                                            placeholder="Description"
                                            className={styles.inputField}
                                        />
                                        <input
                                            type="number"
                                            value={entry.amount}
                                            onChange={(e) => handleEntryChange(index, 'amount', e.target.value, 'other')}
                                            placeholder="Amount"
                                            className={styles.inputField}
                                        />
                                        <button 
                                            type="button" 
                                            onClick={() => handleRemoveEntry(index, 'other')}
                                            className={styles.removeButton}
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                ))}
                                <button type="button" onClick={() => handleAddEntry('other')} className={styles.addButton}>
                                    <Plus size={16} />
                                </button>
                            </div>
                        )}

                        <div className={styles.totalSection}>
                            <div className={styles.totalRow}>
                                <span className={styles.totalLabel}>Total Investment Income:</span>
                                <span className={styles.totalAmount}>Rs. {totalInvestmentIncome.toLocaleString()}</span>
                            </div>
                        </div>

                        <div className={styles.buttonContainer}>
                            <button type="submit" className={styles.nextButton}>Next</button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default InvestmentIncome;