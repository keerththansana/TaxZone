import React, { useState, useEffect } from 'react';
import { ChevronDown, Plus, Trash2 } from "lucide-react";
import { useNavigate } from 'react-router-dom';
import styles from './Employment_Income.module.css';
import TaxationMenu from './Taxation_Menu';

const BusinessIncome = () => {
    const [selectedTypes, setSelectedTypes] = useState([]);
    const [openDescription, setOpenDescription] = useState(null);
    const [soleProprietorshipEntries, setSoleProprietorshipEntries] = useState([{ name: 'Income', amount: '' }]);
    const [partnershipEntries, setPartnershipEntries] = useState([{ name: 'Income', amount: '' }]);
    const [trustEntries, setTrustEntries] = useState([{ name: 'Income', amount: '' }]);
    const [bettingEntries, setBettingEntries] = useState([{ name: 'Income', amount: '' }]);
    const [otherEntries, setOtherEntries] = useState([{ name: 'Income', amount: '' }]);
    const [showDeductions, setShowDeductions] = useState(false);
    const [selectedDeductions, setSelectedDeductions] = useState([]);
    const [deductionEntries, setDeductionEntries] = useState({});
    const [totalBusinessIncome, setTotalBusinessIncome] = useState(0);
    const [totalDeductions, setTotalDeductions] = useState(0);
    const navigate = useNavigate();

    useEffect(() => {
        const selectedCategories = JSON.parse(sessionStorage.getItem('selectedCategories') || '[]');
        const currentCategory = sessionStorage.getItem('currentCategory');
        
        if (!selectedCategories.includes('business') || currentCategory !== 'business') {
            navigate('/taxation');
        }
    }, [navigate]);

    useEffect(() => {
        // Calculate total business income
        const soleProprietorshipTotal = soleProprietorshipEntries.reduce((sum, entry) => sum + (Number(entry.amount) || 0), 0);
        const partnershipTotal = partnershipEntries.reduce((sum, entry) => sum + (Number(entry.amount) || 0), 0);
        const trustTotal = trustEntries.reduce((sum, entry) => sum + (Number(entry.amount) || 0), 0);
        const bettingTotal = bettingEntries.reduce((sum, entry) => sum + (Number(entry.amount) || 0), 0);
        const otherTotal = otherEntries.reduce((sum, entry) => sum + (Number(entry.amount) || 0), 0);

        setTotalBusinessIncome(
            soleProprietorshipTotal + 
            partnershipTotal + 
            trustTotal + 
            bettingTotal + 
            otherTotal
        );

        // Calculate total deductions
        const deductionsTotal = Object.values(deductionEntries)
            .reduce((sum, entry) => sum + (Number(entry.amount) || 0), 0);
        setTotalDeductions(deductionsTotal);

    }, [soleProprietorshipEntries, partnershipEntries, trustEntries, bettingEntries, otherEntries, deductionEntries]);

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

    const handleTypeToggle = (typeId) => {
        setSelectedTypes(prev => {
            const newTypes = prev.includes(typeId) 
                ? prev.filter(id => id !== typeId)
                : [...prev, typeId];
            
            // Handle entries with business type specific names
            switch(typeId) {
                case 'sole-proprietorship':
                    !prev.includes(typeId) 
                        ? setSoleProprietorshipEntries([{ name: 'Sole Proprietorship Income', amount: '' }]) 
                        : setSoleProprietorshipEntries([]);
                    break;
                case 'partnership':
                    !prev.includes(typeId) 
                        ? setPartnershipEntries([{ name: 'Partnership Business Income', amount: '' }]) 
                        : setPartnershipEntries([]);
                    break;
                case 'trust-beneficiary':
                    !prev.includes(typeId) 
                        ? setTrustEntries([{ name: 'Trust Beneficiary Business Income', amount: '' }]) 
                        : setTrustEntries([]);
                    break;
                case 'betting-gaming':
                    !prev.includes(typeId) 
                        ? setBettingEntries([{ name: 'Betting, Gaming, Liquor & Tobacco Income', amount: '' }]) 
                        : setBettingEntries([]);
                    break;
                case 'other-business':
                    !prev.includes(typeId) 
                        ? setOtherEntries([{ name: 'Other Business Income', amount: '' }]) 
                        : setOtherEntries([]);
                    break;
            }
            return newTypes;
        });
    };

    const handleDeductionToggle = (deductionId) => {
        setSelectedDeductions(prev => {
            if (prev.includes(deductionId)) {
                // Remove deduction and its entries when unchecked
                const newDeductions = prev.filter(id => id !== deductionId);
                setDeductionEntries(current => {
                    const { [deductionId]: removed, ...rest } = current;
                    return rest;
                });
                return newDeductions;
            } else {
                // Add deduction with empty amount when checked
                setDeductionEntries(current => ({
                    ...current,
                    [deductionId]: { amount: '' }
                }));
                return [...prev, deductionId];
            }
        });
    };

    const handleDeductionAmountChange = (deductionId, amount) => {
        setDeductionEntries(prev => ({
            ...prev,
            [deductionId]: { ...prev[deductionId], amount }
        }));
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

    const handleSubmit = (e) => {
        e.preventDefault();
        
        // Save form data
        const formData = {
            soleProprietorshipEntries,
            partnershipEntries,
            trustEntries,
            bettingEntries,
            otherEntries,
            deductionEntries
        };
        sessionStorage.setItem('businessIncomeData', JSON.stringify(formData));

        // Get next category to navigate to
        const selectedCategories = JSON.parse(sessionStorage.getItem('selectedCategories') || '[]');
        const currentIndex = selectedCategories.indexOf('business');
        const nextCategory = selectedCategories[currentIndex + 1];

        // Update current category in session
        sessionStorage.setItem('currentCategory', nextCategory || 'preview');

        // Navigate to next form
        const routes = {
            employment: '/employment_income',
            investment: '/investment_income',
            other: '/other_income',
            terminal: '/terminal_benefits',
            qualifying: '/qualifying_payments'
        };

        if (nextCategory && routes[nextCategory]) {
            navigate(routes[nextCategory]);
        } else {
            navigate('/preview');
        }
    };

    const navigateToNextForm = (categoryId) => {
        switch(categoryId) {
            case 'business':
                navigate('/business_income');
                break;
            case 'investment':
                navigate('/investment_income');
                break;
            // Add other cases
            default:
                navigate('/preview');
        }
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