import React, { useState, useEffect } from 'react';
import { ChevronDown, Plus, Trash2 } from "lucide-react";
import { useNavigate } from 'react-router-dom';
import styles from './Employment_Income.module.css';
import TaxationMenu from './Taxation_Menu';

const EmploymentIncome = () => {
    const [selectedTypes, setSelectedTypes] = useState([]);
    const [openDescription, setOpenDescription] = useState(null);
    const [primaryEntries, setPrimaryEntries] = useState([{ name: 'Salary', amount: '' }]);
    const [secondaryEntries, setSecondaryEntries] = useState([{ name: 'Salary', amount: '' }]);
    const [apitEntries, setApitEntries] = useState([{ month: '', amount: '' }]);
    const [totalEmploymentIncome, setTotalEmploymentIncome] = useState(0);
    const [totalApitDeduction, setTotalApitDeduction] = useState(0);
    const navigate = useNavigate();

    useEffect(() => {
        const selectedCategories = JSON.parse(sessionStorage.getItem('selectedCategories') || '[]');
        const currentCategory = sessionStorage.getItem('currentCategory');
        
        if (!selectedCategories.includes('employment') || currentCategory !== 'employment') {
            navigate('/taxation');
        }
    }, [navigate]);

    useEffect(() => {
        // Calculate total employment income
        const primaryTotal = primaryEntries.reduce((sum, entry) => sum + (Number(entry.amount) || 0), 0);
        const secondaryTotal = secondaryEntries.reduce((sum, entry) => sum + (Number(entry.amount) || 0), 0);
        setTotalEmploymentIncome(primaryTotal + secondaryTotal);

        // Calculate total APIT deduction
        const apitTotal = apitEntries.reduce((sum, entry) => sum + (Number(entry.amount) || 0), 0);
        setTotalApitDeduction(apitTotal);
    }, [primaryEntries, secondaryEntries, apitEntries]);

    const employmentTypes = [
        {
            id: 'primary',
            label: 'Primary Employment',
            description: 'Income from your main employment where you spend most of your working time and receive regular salary payments.'
        },
        {
            id: 'secondary',
            label: 'Secondary Employment',
            description: 'Additional income from other employment sources apart from your primary employment.'
        },
        {
            id: 'apit',
            label: 'APIT Deduction',
            description: 'Advance Personal Income Tax deducted by your employer from your monthly salary.'
        }
    ];

    const handleTypeToggle = (typeId) => {
        setSelectedTypes(prev => {
            const newTypes = prev.includes(typeId) 
                ? prev.filter(id => id !== typeId)
                : [...prev, typeId];
            
            // Handle automatic entry creation
            if (typeId === 'primary' && !prev.includes('primary')) {
                setPrimaryEntries([{ name: 'Primary Salary', amount: '' }]);
                if (newTypes.includes('apit')) {
                    setApitEntries(current => [
                        ...current,
                        { month: 'Primary Salary APIT', amount: '' }
                    ]);
                }
            }
            
            if (typeId === 'secondary' && !prev.includes('secondary')) {
                setSecondaryEntries([{ name: 'Secondary Salary', amount: '' }]);
                if (newTypes.includes('apit')) {
                    setApitEntries(current => [
                        ...current,
                        { month: 'Secondary Salary APIT', amount: '' }
                    ]);
                }
            }

            if (typeId === 'apit' && !prev.includes('apit')) {
                let newApitEntries = [];
                if (newTypes.includes('primary')) {
                    newApitEntries.push({ month: 'Primary Salary APIT', amount: '' });
                }
                if (newTypes.includes('secondary')) {
                    newApitEntries.push({ month: 'Secondary Salary APIT', amount: '' });
                }
                setApitEntries(newApitEntries);
            }

            // Handle removal
            if (typeId === 'primary' && prev.includes('primary')) {
                setPrimaryEntries([]);
                setApitEntries(current => 
                    current.filter(entry => !entry.month.includes('Primary'))
                );
            }
            
            if (typeId === 'secondary' && prev.includes('secondary')) {
                setSecondaryEntries([]);
                setApitEntries(current => 
                    current.filter(entry => !entry.month.includes('Secondary'))
                );
            }

            if (typeId === 'apit' && prev.includes('apit')) {
                setApitEntries([]);
            }

            return newTypes;
        });
    };

    const handleAddPrimaryEntry = () => {
        setPrimaryEntries([...primaryEntries, { name: '', amount: '' }]);
    };

    const handleAddSecondaryEntry = () => {
        setSecondaryEntries([...secondaryEntries, { name: '', amount: '' }]);
    };

    const handleAddAPIT = () => {
        setApitEntries([...apitEntries, { month: '', amount: '' }]);
    };

    const handlePrimaryChange = (index, field, value) => {
        const newEntries = [...primaryEntries];
        newEntries[index][field] = value;
        setPrimaryEntries(newEntries);
    };

    const handleSecondaryChange = (index, field, value) => {
        const newEntries = [...secondaryEntries];
        newEntries[index][field] = value;
        setSecondaryEntries(newEntries);
    };

    const handleApitChange = (index, field, value) => {
        const newEntries = [...apitEntries];
        newEntries[index][field] = value;
        setApitEntries(newEntries);
    };

    const handleRemovePrimaryEntry = (index) => {
        setPrimaryEntries(prev => prev.filter((_, i) => i !== index));
    };

    const handleRemoveSecondaryEntry = (index) => {
        setSecondaryEntries(prev => prev.filter((_, i) => i !== index));
    };

    const handleRemoveAPIT = (index) => {
        setApitEntries(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        
        // Save form data
        const formData = {
            primaryEntries,
            secondaryEntries,
            apitEntries
        };
        sessionStorage.setItem('employmentIncomeData', JSON.stringify(formData));

        // Get next form to navigate to
        const selectedCategories = JSON.parse(sessionStorage.getItem('selectedCategories') || '[]');
        const currentIndex = selectedCategories.indexOf('employment');
        const nextCategory = selectedCategories[currentIndex + 1];

        // Update current category in session storage
        if (nextCategory) {
            sessionStorage.setItem('currentCategory', nextCategory);
        }

        // Navigate to appropriate form
        if (nextCategory) {
            const routes = {
                business: '/business_income',
                investment: '/investment_income',
                other: '/other_income',
                terminal: '/terminal_benefits',
                qualifying: '/qualifying_payments'
            };

            const nextRoute = routes[nextCategory];
            if (nextRoute) {
                navigate(nextRoute);
            } else {
                navigate('/summary');
            }
        } else {
            navigate('/summary');
        }
    };

    return (
        <>
            <TaxationMenu />
            <div className={styles.container}>
                <div className={styles.header}>
                    <h1 className={styles.title}>Employment Income</h1>
                    <h2 className={styles.subtitle}>Select Applicable Employment Category</h2>
                </div>

                <form className={styles.formContainer} onSubmit={handleSubmit}>
                    <div className={styles.selectionGroup}>
                        {employmentTypes.map((type) => (
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

                    {(selectedTypes.includes('primary')) && (
                        <div className={styles.section}>
                            <h3>Primary Employment</h3>
                            {primaryEntries.map((entry, index) => (
                                <div key={index} className={styles.entryRow}>
                                    <input
                                        type="text"
                                        value={entry.name}
                                        onChange={(e) => handlePrimaryChange(index, 'name', e.target.value)}
                                        placeholder="Description"
                                        className={styles.inputField}
                                    />
                                    <input
                                        type="number"
                                        value={entry.amount}
                                        onChange={(e) => handlePrimaryChange(index, 'amount', e.target.value)}
                                        placeholder="Amount"
                                        className={styles.inputField}
                                    />
                                    <button 
                                        type="button" 
                                        onClick={() => handleRemovePrimaryEntry(index)}
                                        className={styles.removeButton}
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))}
                            <button type="button" onClick={handleAddPrimaryEntry} className={styles.addButton}>
                                <Plus size={16} />
                            </button>
                        </div>
                    )}

                    {(selectedTypes.includes('secondary')) && (
                        <div className={styles.section}>
                            <h3>Secondary Employment</h3>
                            {secondaryEntries.map((entry, index) => (
                                <div key={index} className={styles.entryRow}>
                                    <input
                                        type="text"
                                        value={entry.name}
                                        onChange={(e) => handleSecondaryChange(index, 'name', e.target.value)}
                                        placeholder="Description"
                                        className={styles.inputField}
                                    />
                                    <input
                                        type="number"
                                        value={entry.amount}
                                        onChange={(e) => handleSecondaryChange(index, 'amount', e.target.value)}
                                        placeholder="Amount"
                                        className={styles.inputField}
                                    />
                                    <button 
                                        type="button" 
                                        onClick={() => handleRemoveSecondaryEntry(index)}
                                        className={styles.removeButton}
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))}
                            <button type="button" onClick={handleAddSecondaryEntry} className={styles.addButton}>
                                <Plus size={16} />
                            </button>
                        </div>
                    )}

                    {(selectedTypes.includes('apit')) && (
                        <div className={styles.apitSection}>
                            <h3>APIT Deductions</h3>
                            {apitEntries.map((entry, index) => (
                                <div key={index} className={styles.entryRow}>
                                    <input
                                        type="text"
                                        value={entry.month}
                                        onChange={(e) => handleApitChange(index, 'month', e.target.value)}
                                        placeholder="Month"
                                        className={styles.inputField}
                                    />
                                    <input
                                        type="number"
                                        value={entry.amount}
                                        onChange={(e) => handleApitChange(index, 'amount', e.target.value)}
                                        placeholder="Amount"
                                        className={styles.inputField}
                                    />
                                    <button 
                                        type="button" 
                                        onClick={() => handleRemoveAPIT(index)}
                                        className={styles.removeButton}
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))}
                            <button type="button" onClick={handleAddAPIT} className={styles.addButton}>
                                <Plus size={16} />
                            </button>
                        </div>
                    )}

                    <div className={styles.totalSection}>
                        <div className={styles.totalRow}>
                            <span className={styles.totalLabel}>Total Employment Income:</span>
                            <span className={styles.totalAmount}>Rs. {totalEmploymentIncome.toLocaleString()}</span>
                        </div>
                        {selectedTypes.includes('apit') && (
                            <div className={styles.totalRow}>
                                <span className={styles.totalLabel}>Total APIT Deduction:</span>
                                <span className={styles.totalAmount}>Rs. {totalApitDeduction.toLocaleString()}</span>
                            </div>
                        )}
                    </div>

                    <div className={styles.buttonContainer}>
                        <button type="submit" className={styles.nextButton}>Next</button>
                    </div>
                </form>
            </div>
        </>
    );
};

export default EmploymentIncome;