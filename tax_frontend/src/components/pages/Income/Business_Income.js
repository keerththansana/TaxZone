import React, { useState, useEffect } from 'react';
import { ChevronDown, Plus, Trash2 } from "lucide-react";
import { useNavigate } from 'react-router-dom';
import styles from './Employment_Income.module.css';
import TaxationMenu from './Taxation_Menu';
import { useFormPersist } from './Data_Persistence';

const BusinessIncome = () => {
    const [openDescription, setOpenDescription] = useState(null);
    const [selectedDeductions, setSelectedDeductions] = useState([]);

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
            label: 'Sole Proprietorship Income',
            description: 'Profit from a business owned and operated by you.'
        },
        {
            id: 'partnership',
            label: 'Partnership Business Income',
            description: 'Your share of income from a business partnership.'
        },
        {
            id: 'trust-beneficiary',
            label: 'Trust Beneficiary Business Income',
            description: 'Business income received as a beneficiary of a trust.'
        },
        {
            id: 'betting-gaming',
            label: 'Betting, Gaming, Liquor & Tobacco Business Income',
            description: 'Income from gambling, alcohol, or tobacco businesses.'
        },
        {
            id: 'other-business',
            label: 'Other Business Income',
            description: 'Any other type of business income not listed above.'
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

    return (
        <>
            <TaxationMenu />
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
        </>
    );
};

export default BusinessIncome;