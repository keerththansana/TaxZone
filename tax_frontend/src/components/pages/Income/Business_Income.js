import React, { useState, useEffect } from 'react';
import { ChevronDown, Plus, Trash2 } from "lucide-react";
import { useNavigate } from 'react-router-dom';
import Header from '../../common/Header/Header';
import styles from './Employment_Income.module.css';
import TaxationMenu from './Taxation_Menu';
import { useFormPersist } from './Data_Persistence';
import { AutoFillHelper } from '../../../utils/autoFillHelper';
import AnalysisResults from './AnalysisResults';

const BusinessIncome = () => {
    const [openDescription, setOpenDescription] = useState(null);
    const [selectedDeductions, setSelectedDeductions] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [showAnalysisResults, setShowAnalysisResults] = useState(false);
    const [analysisResults, setAnalysisResults] = useState([]);

    // Initialize form data with persistence
    const [formData, setFormData] = useFormPersist('businessIncomeData', {
        selectedTypes: [],
        soleProprietorshipEntries: [{ name: 'Business Income', amount: '' }],
        partnershipEntries: [{ name: 'Partnership Income', amount: '' }],
        trustEntries: [{ name: 'Trust Income', amount: '' }],
        bettingEntries: [{ name: 'Betting Income', amount: '' }],
        otherEntries: [{ name: 'Other Business Income', amount: '' }],
        deductionEntries: {},
        totalBusinessIncome: 0,
        totalDeductions: 0
    });

    // Destructure values and add setters from formData
    const {
        selectedTypes,
        soleProprietorshipEntries,
        partnershipEntries,
        trustEntries,
        bettingEntries,
        otherEntries,
        deductionEntries,
        totalBusinessIncome,
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
    const setSoleProprietorshipEntries = (entries) => {
        updateFormData({ soleProprietorshipEntries: Array.isArray(entries) ? entries : entries(formData.soleProprietorshipEntries) });
    };

    const setPartnershipEntries = (entries) => {
        updateFormData({ partnershipEntries: Array.isArray(entries) ? entries : entries(formData.partnershipEntries) });
    };

    const setTrustEntries = (entries) => {
        updateFormData({ trustEntries: Array.isArray(entries) ? entries : entries(formData.trustEntries) });
    };

    const setBettingEntries = (entries) => {
        updateFormData({ bettingEntries: Array.isArray(entries) ? entries : entries(formData.bettingEntries) });
    };

    const setOtherEntries = (entries) => {
        updateFormData({ otherEntries: Array.isArray(entries) ? entries : entries(formData.otherEntries) });
    };

    // Navigation check
    useEffect(() => {
        const selectedCategories = JSON.parse(sessionStorage.getItem('selectedCategories') || '[]');
        const currentCategory = sessionStorage.getItem('currentCategory');
        
        if (!selectedCategories.includes('business') || currentCategory !== 'business') {
            navigate('/taxation');
        }
    }, [navigate]);

    // Calculate totals
    useEffect(() => {
        const calculateTotal = entries => entries.reduce((sum, entry) => sum + (Number(entry.amount) || 0), 0);
        
        const total = calculateTotal(soleProprietorshipEntries) +
            calculateTotal(partnershipEntries) +
            calculateTotal(trustEntries) +
            calculateTotal(bettingEntries) +
            calculateTotal(otherEntries);

        updateFormData({ totalBusinessIncome: total });
    }, [soleProprietorshipEntries, partnershipEntries, trustEntries, bettingEntries, otherEntries]);

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
                        
                        // Store the data in localStorage for persistence
                        localStorage.setItem('last_analysis', JSON.stringify(analysisData));
                        
                        // Format the data for the business form
                        const formattedData = {
                            soleProprietorshipEntries: [],
                            partnershipEntries: [],
                            trustEntries: [],
                            bettingEntries: [],
                            otherEntries: [],
                            selectedTypes: [],
                            deductionEntries: {},
                            totalBusinessIncome: 0,
                            totalDeductions: 0
                        };

                        // Process income items from each result
                        analysisData.forEach(result => {
                            if (result.analysis && result.analysis.income_items) {
                                result.analysis.income_items.forEach(item => {
                                    const description = (item.description || '').toLowerCase();
                                    const amount = item.amount || 0;
                                    let category = item.category || '';

                                    // Only process items that are actually Business Income
                                    // Note: Samurdhi beneficiary items should be Qualifying Payments, not Business Income
                                    if (category === 'Business Income') {
                                        if (description.includes('sole') || description.includes('proprietorship')) {
                                            formattedData.soleProprietorshipEntries.push({
                                                name: 'Sole Proprietorship',
                                                amount: amount.toString()
                                            });
                                            if (!formattedData.selectedTypes.includes('sole-proprietorship')) {
                                                formattedData.selectedTypes.push('sole-proprietorship');
                                            }
                                        } else if (description.includes('partnership')) {
                                            formattedData.partnershipEntries.push({
                                                name: 'Partnership',
                                                amount: amount.toString()
                                            });
                                            if (!formattedData.selectedTypes.includes('partnership')) {
                                                formattedData.selectedTypes.push('partnership');
                                            }
                                        } else if (description.includes('trust') || 
                                                description.includes('beneficiary')) {
                                            // Only include regular trust beneficiary income, not Samurdhi
                                            if (!description.includes('samurdhi') && !description.includes('samurthy')) {
                                                formattedData.trustEntries.push({
                                                    name: item.description || 'Trust Beneficiary',
                                                    amount: amount.toString()
                                                });
                                                if (!formattedData.selectedTypes.includes('trust-beneficiary')) {
                                                    formattedData.selectedTypes.push('trust-beneficiary');
                                                }
                                            }
                                        } else if (description.includes('betting') || description.includes('gaming')) {
                                            formattedData.bettingEntries.push({
                                                name: 'Betting, Gaming, Liquor & Tobacco',
                                                amount: amount.toString()
                                            });
                                            if (!formattedData.selectedTypes.includes('betting-gaming')) {
                                                formattedData.selectedTypes.push('betting-gaming');
                                            }
                                        } else {
                                            formattedData.otherEntries.push({
                                                name: item.description || 'Other Business Income',
                                                amount: amount.toString()
                                            });
                                            if (!formattedData.selectedTypes.includes('other-business')) {
                                                formattedData.selectedTypes.push('other-business');
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

                                    if (type.includes('business') || source.includes('business')) {
                                        formattedData.deductionEntries[deduction.type || 'AIT'] = {
                                            type: deduction.type || 'AIT',
                                            source: deduction.source || 'Business Income',
                                            name: deduction.description || 'Business Tax Deduction',
                                            amount: amount.toString(),
                                            selected: true
                                        };
                                    }
                                });
                            }
                        });

                        // Calculate totals
                        formattedData.totalBusinessIncome = 
                            formattedData.soleProprietorshipEntries.reduce((sum, entry) => sum + Number(entry.amount), 0) +
                            formattedData.partnershipEntries.reduce((sum, entry) => sum + Number(entry.amount), 0) +
                            formattedData.trustEntries.reduce((sum, entry) => sum + Number(entry.amount), 0) +
                            formattedData.bettingEntries.reduce((sum, entry) => sum + Number(entry.amount), 0) +
                            formattedData.otherEntries.reduce((sum, entry) => sum + Number(entry.amount), 0);

                        formattedData.totalDeductions = Object.values(formattedData.deductionEntries)
                            .reduce((sum, entry) => sum + Number(entry.amount), 0);

                        // Only update if we have data
                        if (formattedData.soleProprietorshipEntries.length > 0 || 
                            formattedData.partnershipEntries.length > 0 || 
                            formattedData.trustEntries.length > 0 || 
                            formattedData.bettingEntries.length > 0 || 
                            formattedData.otherEntries.length > 0 || 
                            Object.keys(formattedData.deductionEntries).length > 0) {
                            console.log('Formatted data for business form:', formattedData);

                            // Update the form with the formatted data
                            updateFormData(formattedData);

                            // Store the formatted data in session storage
                            sessionStorage.setItem('businessIncomeData', JSON.stringify(formattedData));
                        } else {
                            console.log('No relevant business data found in analysis');
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
        const storedData = sessionStorage.getItem('businessIncomeData');
        if (storedData) {
            try {
                const parsedData = JSON.parse(storedData);
                updateFormData(parsedData);
            } catch (error) {
                console.error('Error parsing stored data:', error);
            }
        }

        // Then try to fetch auto-fill data
        fetchAutoFillData();

        // Listen for auto-fill data updates
        const handleAutoFillUpdate = (event) => {
            console.log('Received auto-fill event in Business Income:', event);
            if (event.data && event.data.type === 'autoFillUpdate') {
                const data = event.data.payload;
                console.log('Processing auto-fill data in Business Income:', data);
                if (data.BusinessIncome) {
                    console.log('Updating business form with data:', data.BusinessIncome);
                    updateFormData({
                        soleProprietorshipEntries: data.BusinessIncome.soleProprietorshipEntries || [],
                        partnershipEntries: data.BusinessIncome.partnershipEntries || [],
                        trustEntries: data.BusinessIncome.trustEntries || [],
                        bettingEntries: data.BusinessIncome.bettingEntries || [],
                        otherEntries: data.BusinessIncome.otherEntries || [],
                        selectedTypes: data.BusinessIncome.selectedTypes || [],
                        deductionEntries: data.BusinessIncome.deductionEntries || {},
                        totalBusinessIncome: data.BusinessIncome.totalBusinessIncome || 0,
                        totalDeductions: data.BusinessIncome.totalDeductions || 0
                    });
                }
            }
        };

        // Listen for custom auto-fill event as fallback
        const handleCustomAutoFillUpdate = (event) => {
            console.log('Received custom auto-fill event in Business Income:', event);
            const data = event.detail;
            if (data && data.BusinessIncome) {
                console.log('Updating business form with custom event data:', data.BusinessIncome);
                updateFormData({
                    soleProprietorshipEntries: data.BusinessIncome.soleProprietorshipEntries || [],
                    partnershipEntries: data.BusinessIncome.partnershipEntries || [],
                    trustEntries: data.BusinessIncome.trustEntries || [],
                    bettingEntries: data.BusinessIncome.bettingEntries || [],
                    otherEntries: data.BusinessIncome.otherEntries || [],
                    selectedTypes: data.BusinessIncome.selectedTypes || [],
                    deductionEntries: data.BusinessIncome.deductionEntries || {},
                    totalBusinessIncome: data.BusinessIncome.totalBusinessIncome || 0,
                    totalDeductions: data.BusinessIncome.totalDeductions || 0
                });
            }
        };

        window.addEventListener('message', handleAutoFillUpdate);
        window.addEventListener('autoFillDataUpdate', handleCustomAutoFillUpdate);
        
        return () => {
            window.removeEventListener('message', handleAutoFillUpdate);
            window.removeEventListener('autoFillDataUpdate', handleCustomAutoFillUpdate);
        };
    }, []);

    // Handle form submission
    const handleSubmit = (e) => {
        e.preventDefault();
        
        // Save form data
        const formData = {
            selectedTypes,
            soleProprietorshipEntries,
            partnershipEntries,
            trustEntries,
            bettingEntries,
            otherEntries,
            deductionEntries,
            totalBusinessIncome
        };
        sessionStorage.setItem('businessIncomeData', JSON.stringify(formData));

        // Get next form to navigate to
        const selectedCategories = JSON.parse(sessionStorage.getItem('selectedCategories') || '[]');
        const currentIndex = selectedCategories.indexOf('business');
        const nextCategory = selectedCategories[currentIndex + 1];

        // Update current category in session storage
        if (nextCategory) {
            sessionStorage.setItem('currentCategory', nextCategory);
        }

        // Navigate to appropriate form
        if (nextCategory) {
            const routes = {
                employment: '/employment_income',
                investment: '/investment_income',
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

    const businessTypes = [
        {
            id: 'sole-proprietorship',
            label: 'Sole Proprietorship',
            description: 'Income from a business owned and operated by a single individual.'
        },
        {
            id: 'partnership',
            label: 'Partnership',
            description: 'Income from a business owned by two or more individuals.'
        },
        {
            id: 'trust-beneficiary',
            label: 'Trust Beneficiary',
            description: 'Income received as a beneficiary of a trust.'
        },
        {
            id: 'betting-gaming',
            label: 'Betting, Gaming, Liquor & Tobacco',
            description: 'Income from betting, gaming, liquor, or tobacco related activities.'
        },
        {
            id: 'other-business',
            label: 'Other Business Income',
            description: 'Any other type of business income not covered above.'
        }
    ];

    const deductionTypes = [
        {
            id: 'business-expenses',
            label: 'Allowable Business Expenses',
            description: 'Rent, salaries, operational costs, etc.'
        },
        {
            id: 'capital-allowances',
            label: 'Capital Allowances',
            description: 'Depreciation on Assets'
        },
        {
            id: 'losses-forward',
            label: 'Losses Carried Forward',
            description: 'If applicable from previous years'
        },
        {
            id: 'tax-free-threshold',
            label: 'Statutory Tax-Free Threshold',
            description: 'If applicable to your business'
        },
        {
            id: 'self-employment-tax',
            label: 'Self-Employment Tax Deductions',
            description: 'Applicable self-employment deductions'
        }
    ];

    // Update handleTypeToggle to use updateFormData
    const handleTypeToggle = (typeId) => {
        const newTypes = selectedTypes.includes(typeId) 
            ? selectedTypes.filter(id => id !== typeId)
            : [...selectedTypes, typeId];
        
        updateFormData({ selectedTypes: newTypes });

        // Handle entries with business type specific names
        switch(typeId) {
            case 'sole-proprietorship':
                !selectedTypes.includes(typeId) 
                    ? updateFormData({ soleProprietorshipEntries: [{ name: 'Sole Proprietorship Income', amount: '' }] })
                    : updateFormData({ soleProprietorshipEntries: [] });
                break;
            case 'partnership':
                !selectedTypes.includes(typeId) 
                    ? updateFormData({ partnershipEntries: [{ name: 'Partnership Business Income', amount: '' }] })
                    : updateFormData({ partnershipEntries: [] });
                break;
            case 'trust-beneficiary':
                !selectedTypes.includes(typeId) 
                    ? updateFormData({ trustEntries: [{ name: 'Trust Beneficiary Business Income', amount: '' }] })
                    : updateFormData({ trustEntries: [] });
                break;
            case 'betting-gaming':
                !selectedTypes.includes(typeId) 
                    ? updateFormData({ bettingEntries: [{ name: 'Betting, Gaming, Liquor & Tobacco Income', amount: '' }] })
                    : updateFormData({ bettingEntries: [] });
                break;
            case 'other-business':
                !selectedTypes.includes(typeId) 
                    ? updateFormData({ otherEntries: [{ name: 'Other Business Income', amount: '' }] })
                    : updateFormData({ otherEntries: [] });
                break;
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
                deductionEntries: {
                    ...deductionEntries,
                    [deductionId]: { amount: '' }
                }
            });
        } else {
            const { [deductionId]: removed, ...rest } = deductionEntries;
            updateFormData({ deductionEntries: rest });
        }
    };

    // Update handleDeductionAmountChange to use updateFormData
    const handleDeductionAmountChange = (deductionId, amount) => {
        updateFormData({
            deductionEntries: {
                ...deductionEntries,
                [deductionId]: { ...deductionEntries[deductionId], amount }
            }
        });
    };

    const handleEntryChange = (index, field, value, type) => {
        const entries = {
            'sole-proprietorship': [soleProprietorshipEntries, setSoleProprietorshipEntries],
            'partnership': [partnershipEntries, setPartnershipEntries],
            'trust-beneficiary': [trustEntries, setTrustEntries],
            'betting-gaming': [bettingEntries, setBettingEntries],
            'other-business': [otherEntries, setOtherEntries]
        }[type];

        const [currentEntries, setEntries] = entries;
        const newEntries = [...currentEntries];
        newEntries[index][field] = value;
        setEntries(newEntries);
    };

    const handleAddEntry = (type) => {
        const [entries, setEntries] = {
            'sole-proprietorship': [soleProprietorshipEntries, setSoleProprietorshipEntries],
            'partnership': [partnershipEntries, setPartnershipEntries],
            'trust-beneficiary': [trustEntries, setTrustEntries],
            'betting-gaming': [bettingEntries, setBettingEntries],
            'other-business': [otherEntries, setOtherEntries]
        }[type];

        setEntries([...entries, { name: '', amount: '' }]);
    };

    const handleRemoveEntry = (index, type) => {
        const setEntries = {
            'sole-proprietorship': setSoleProprietorshipEntries,
            'partnership': setPartnershipEntries,
            'trust-beneficiary': setTrustEntries,
            'betting-gaming': setBettingEntries,
            'other-business': setOtherEntries
        }[type];

        setEntries(prev => prev.filter((_, i) => i !== index));
    };

    const handleOpenAnalysis = () => {
        const stored = sessionStorage.getItem('last_analysis');
        setAnalysisResults(stored ? JSON.parse(stored) : []);
        setShowAnalysisResults(true);
    };

    return (
        <div className="business-income-page">
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
                    <h1 className={styles.title}>Business Income</h1>
                    <h2 className={styles.subtitle}>Select Applicable Business Category</h2>
                </div>

                <form className={styles.formContainer} onSubmit={handleSubmit}>
                    <div className={styles.selectionGroup}>
                        {businessTypes.map((type) => (
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

                    {Object.entries({
                        'sole-proprietorship': [soleProprietorshipEntries, 'Sole Proprietorship Income'],
                        'partnership': [partnershipEntries, 'Partnership Business Income'],
                        'trust-beneficiary': [trustEntries, 'Trust Beneficiary Business Income'],
                        'betting-gaming': [bettingEntries, 'Betting, Gaming, Liquor & Tobacco Income'],
                        'other-business': [otherEntries, 'Other Business Income']
                    }).map(([type, [entries, title]]) => (
                        selectedTypes.includes(type) && (
                            <div key={type} className={styles.section}>
                                <h3>{title}</h3>
                                {entries.map((entry, index) => (
                                    <div key={index} className={styles.entryRow}>
                                        <input
                                            type="text"
                                            value={entry.name}
                                            onChange={(e) => handleEntryChange(index, 'name', e.target.value, type)}
                                            placeholder="Description"
                                            className={styles.inputField}
                                        />
                                        <input
                                            type="number"
                                            value={entry.amount}
                                            onChange={(e) => handleEntryChange(index, 'amount', e.target.value, type)}
                                            placeholder="Amount"
                                            className={styles.inputField}
                                        />
                                        <button 
                                            type="button" 
                                            onClick={() => handleRemoveEntry(index, type)}
                                            className={styles.removeButton}
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                ))}
                                <button type="button" onClick={() => handleAddEntry(type)} className={styles.addButton}>
                                    <Plus size={16} />
                                </button>
                            </div>
                        )
                    ))}

                    <div className={styles.totalSection}>
                        <div className={styles.totalRow}>
                            <span className={styles.totalLabel}>Total Business Income:</span>
                            <span className={styles.totalAmount}>Rs. {totalBusinessIncome.toLocaleString()}</span>
                        </div>
                    </div>

                    <div className={styles.buttonContainer}>
                        <button type="submit" className={styles.nextButton}>Next</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default BusinessIncome;