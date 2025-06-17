import React, { useState, useEffect } from 'react';
import { ChevronDown, Plus, Trash2 } from "lucide-react";
import { useNavigate } from 'react-router-dom';
import Header from '../../common/Header/Header';
import styles from './Employment_Income.module.css';
import TaxationMenu from './Taxation_Menu';
import { useFormPersist } from './Data_Persistence';
import axios from 'axios';

// Replace the constant declaration at the top with this
const PERSONAL_RELIEF_AMOUNTS = {
    '2024/2025': 1200000,
    '2025/2026': 1800000
};

const EmploymentIncome = () => {
    // Add selected year state (get from sessionStorage)
    const [selectedYear, setSelectedYear] = useState(() => 
        sessionStorage.getItem('taxationYear') || '2024/2025'
    );

    // Get the appropriate relief amount based on selected year
    const PERSONAL_RELIEF_AMOUNT = PERSONAL_RELIEF_AMOUNTS[selectedYear];

    // Add openDescription state
    const [openDescription, setOpenDescription] = useState(null);

    // Update showForm state to be true by default
    const [showForm, setShowForm] = useState(true);

    // Update formData structure to match investment income format
    const [formData, setFormData] = useFormPersist('employmentIncomeData', {
        primaryEntries: [{ name: 'Primary Salary', amount: '' }],
        secondaryEntries: [{ name: 'Secondary Salary', amount: '' }],
        apitEntries: [{ name: '', amount: '' }],
        selectedTypes: ['Primary Employment'],
        totalEmploymentIncome: 0,
        totalApitDeduction: 0
    });

    // Destructure values from formData
    const {
        primaryEntries,
        secondaryEntries,
        apitEntries,
        selectedTypes: selectedTypesArray,
        totalEmploymentIncome,
        totalApitDeduction
    } = formData;

    // Ensure selectedTypesArray is an array and convert to Set
    const selectedTypes = new Set(Array.isArray(selectedTypesArray) ? selectedTypesArray : ['Primary Employment']);

    // Update form data helper function
    const updateFormData = (newData) => {
        setFormData(prevData => {
            const updatedData = {
                ...prevData,
                ...newData
            };
            
            // Ensure selectedTypes is always an array
            if (newData.selectedTypes) {
                updatedData.selectedTypes = Array.isArray(newData.selectedTypes) 
                    ? newData.selectedTypes 
                    : newData.selectedTypes instanceof Set 
                        ? Array.from(newData.selectedTypes)
                        : ['Primary Employment'];
            }
            
            return updatedData;
        });
    };

    // Replace all setPrimaryEntries calls
    const setPrimaryEntries = (entries) => {
        updateFormData({ primaryEntries: Array.isArray(entries) ? entries : entries(formData.primaryEntries) });
    };

    // Replace all setSecondaryEntries calls
    const setSecondaryEntries = (entries) => {
        updateFormData({ secondaryEntries: Array.isArray(entries) ? entries : entries(formData.secondaryEntries) });
    };

    // Replace all setApitEntries calls
    const setApitEntries = (entries) => {
        updateFormData({ apitEntries: Array.isArray(entries) ? entries : entries(formData.apitEntries) });
    };

    const navigate = useNavigate();

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
                        
                        // Format the data for the employment form
                        const formattedData = {
                            primaryEntries: [],
                            secondaryEntries: [],
                            apitEntries: [],
                            selectedTypes: ['Primary Employment'],
                            totalEmploymentIncome: 0,
                            totalApitDeduction: 0
                        };

                        // Process income items from each result
                        analysisData.forEach(result => {
                            if (result.analysis && result.analysis.income_items) {
                                result.analysis.income_items.forEach(item => {
                                    if (item.category === 'Employment Income') {
                                        const description = (item.description || '').toLowerCase();
                                        if (description.includes('primary')) {
                                            formattedData.primaryEntries.push({
                                                name: 'Primary Salary',
                                                amount: item.amount.toString()
                                            });
                                        } else if (description.includes('secondary')) {
                                            formattedData.secondaryEntries.push({
                                                name: 'Secondary Salary',
                                                amount: item.amount.toString()
                                            });
                                        } else {
                                            formattedData.primaryEntries.push({
                                                name: item.description || 'Primary Salary',
                                                amount: item.amount.toString()
                                            });
                                        }
                                    }
                                });
                            }

                            // Process deductions
                            if (result.analysis && result.analysis.deductions) {
                                result.analysis.deductions.forEach(deduction => {
                                    if (deduction.type === 'APIT' || 
                                        (deduction.type && deduction.type.toLowerCase().includes('apit'))) {
                                        formattedData.apitEntries.push({
                                            name: 'APIT Deduction',
                                            amount: deduction.amount.toString()
                                        });
                                    }
                                });
                            }
                        });

                        // Calculate totals
                        formattedData.totalEmploymentIncome = 
                            formattedData.primaryEntries.reduce((sum, entry) => sum + Number(entry.amount), 0) +
                            formattedData.secondaryEntries.reduce((sum, entry) => sum + Number(entry.amount), 0);

                        formattedData.totalApitDeduction = 
                            formattedData.apitEntries.reduce((sum, entry) => sum + Number(entry.amount), 0);

                        // Only update if we have data
                        if (formattedData.primaryEntries.length > 0 || 
                            formattedData.secondaryEntries.length > 0 || 
                            formattedData.apitEntries.length > 0) {
                            console.log('Formatted data for employment form:', formattedData);

                            // Update the form with the formatted data
                            updateFormData(formattedData);

                            // Store the formatted data in session storage
                            sessionStorage.setItem('employmentIncomeData', JSON.stringify(formattedData));
                        } else {
                            console.log('No relevant employment data found in analysis');
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
        const storedData = sessionStorage.getItem('employmentIncomeData');
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
            console.log('Received auto-fill event:', event);
            if (event.data && event.data.type === 'autoFillUpdate') {
                const data = event.data.payload;
                console.log('Processing auto-fill data:', data);
                if (data.EmploymentIncome) {
                    console.log('Updating employment form with data:', data.EmploymentIncome);
                    updateFormData({
                        primaryEntries: data.EmploymentIncome.primaryEntries || [],
                        secondaryEntries: data.EmploymentIncome.secondaryEntries || [],
                        apitEntries: data.EmploymentIncome.apitEntries || [],
                        selectedTypes: data.EmploymentIncome.selectedTypes || ['Primary Employment'],
                        totalEmploymentIncome: data.EmploymentIncome.totalEmploymentIncome || 0,
                        totalApitDeduction: data.EmploymentIncome.totalApitDeduction || 0
                    });
                }
            }
        };

        // Listen for custom auto-fill event as fallback
        const handleCustomAutoFillUpdate = (event) => {
            console.log('Received custom auto-fill event:', event);
            const data = event.detail;
            if (data && data.EmploymentIncome) {
                console.log('Updating employment form with custom event data:', data.EmploymentIncome);
                updateFormData({
                    primaryEntries: data.EmploymentIncome.primaryEntries || [],
                    secondaryEntries: data.EmploymentIncome.secondaryEntries || [],
                    apitEntries: data.EmploymentIncome.apitEntries || [],
                    selectedTypes: data.EmploymentIncome.selectedTypes || ['Primary Employment'],
                    totalEmploymentIncome: data.EmploymentIncome.totalEmploymentIncome || 0,
                    totalApitDeduction: data.EmploymentIncome.totalApitDeduction || 0
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
        updateFormData({ totalEmploymentIncome: primaryTotal + secondaryTotal });

        // Calculate total APIT deduction
        const apitTotal = apitEntries.reduce((sum, entry) => sum + (Number(entry.amount) || 0), 0);
        updateFormData({ totalApitDeduction: apitTotal });
    }, [primaryEntries, secondaryEntries, apitEntries]);

    // Update the useEffect that handles year changes
    useEffect(() => {
        const handleYearChange = (event) => {
            // Check if event exists before accessing detail
            const newYear = event?.detail || sessionStorage.getItem('taxationYear') || '2024/2025';
            setSelectedYear(newYear);
        };

        // Initial check without event parameter
        handleYearChange();

        // Listen for year changes
        window.addEventListener('taxationYearChanged', handleYearChange);
        
        return () => {
            window.removeEventListener('taxationYearChanged', handleYearChange);
        };
    }, []);

    // Add a new useEffect to update form data when year changes
    useEffect(() => {
        const currentReliefAmount = PERSONAL_RELIEF_AMOUNTS[selectedYear];
        
        // Update personal relief calculation in total section
        const handlePersonalRelief = () => {
            const reliefAmount = totalEmploymentIncome <= currentReliefAmount 
                ? totalEmploymentIncome 
                : currentReliefAmount;
            return reliefAmount;
        };

        updateFormData({
            personalRelief: handlePersonalRelief()
        });
    }, [selectedYear, totalEmploymentIncome]);

    // Update employmentTypes array
    const employmentTypes = [
        { value: 'Primary Employment', label: 'Primary Employment' },
        { value: 'Secondary Employment', label: 'Secondary Employment' },
        { value: 'APIT', label: 'APIT' }
    ];

    const handleCheckboxChange = (type) => {
        setFormData(prevData => {
            const currentTypes = new Set(Array.isArray(prevData.selectedTypes) ? prevData.selectedTypes : ['Primary Employment']);
            if (currentTypes.has(type)) {
                currentTypes.delete(type);
            } else {
                currentTypes.add(type);
            }
            return {
                ...prevData,
                selectedTypes: Array.from(currentTypes)
            };
        });
    };

    const handleAddPrimaryEntry = () => {
        setPrimaryEntries([...primaryEntries, { name: '', amount: '' }]);
    };

    const handleAddSecondaryEntry = () => {
        setSecondaryEntries([...secondaryEntries, { name: '', amount: '' }]);
    };

    const handleAddAPIT = () => {
        setApitEntries([...apitEntries, { name: '', amount: '' }]);
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
        
        // Save form data with proper serialization
        const formDataToSave = {
            primaryEntries,
            secondaryEntries,
            apitEntries,
            selectedTypes: Array.isArray(selectedTypesArray) ? selectedTypesArray : ['Primary Employment'],
            totalEmploymentIncome,
            totalApitDeduction
        };
        sessionStorage.setItem('employmentIncomeData', JSON.stringify(formDataToSave));

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
                navigate('/preview');
            }
        } else {
            navigate('/preview');
        }
    };

    return (
        <div className="employment-income-page">
            <Header />
            <TaxationMenu />
            <div className={styles.container}>
                <div className={styles.header}>
                    <h1 className={styles.title}>Employment Income</h1>
                    <h2 className={styles.subtitle}>Select Applicable Employment Category</h2>
                </div>

                {showForm && (
                    <form className={styles.formContainer} onSubmit={handleSubmit}>
                        <div className={styles.selectionGroup}>
                            {employmentTypes.map((type) => (
                                <div key={type.value} className={styles.selectionItem}>
                                    <div className={styles.selectionHeader}>
                                        <label className={styles.checkboxLabel}>
                                            <input
                                                type="checkbox"
                                                checked={selectedTypes.has(type.value)}
                                                onChange={() => handleCheckboxChange(type.value)}
                                                className={styles.checkbox}
                                            />
                                            {type.label}
                                        </label>
                                        <button 
                                            type="button"
                                            className={styles.descriptionToggle}
                                            onClick={() => setOpenDescription(openDescription === type.value ? null : type.value)}
                                        >
                                            <ChevronDown className={`${styles.arrow} ${openDescription === type.value ? styles.rotated : ''}`} />
                                        </button>
                                    </div>
                                    {openDescription === type.value && (
                                        <div className={styles.description}>
                                            {type.value === 'Primary Employment' ? 'Income from your main employment where you spend most of your working time.' :
                                            type.value === 'Secondary Employment' ? 'Additional income from other employment sources apart from your primary employment.' :
                                            'Monthly APIT deductions from your employment income.'}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        {selectedTypes.has('Primary Employment') && (
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

                        {selectedTypes.has('Secondary Employment') && (
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

                        {selectedTypes.has('APIT') && (
                            <div className={styles.section}>
                                <h3>APIT Deductions</h3>
                                {apitEntries.map((entry, index) => (
                                    <div key={index} className={styles.entryRow}>
                                        <input
                                            type="text"
                                            value={entry.name}
                                            onChange={(e) => handleApitChange(index, 'name', e.target.value)}
                                            placeholder="Description"
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
                            {(selectedTypes.has('Primary Employment') || selectedTypes.has('Secondary Employment')) && (
                                <div className={styles.totalRow}>
                                    <span className={styles.totalLabel}>Personal Relief:</span>
                                    <span className={`${styles.totalAmount} ${styles.negative}`}>
                                        {(() => {
                                            const reliefAmount = totalEmploymentIncome <= PERSONAL_RELIEF_AMOUNTS[selectedYear] 
                                                ? totalEmploymentIncome 
                                                : PERSONAL_RELIEF_AMOUNTS[selectedYear];
                                            return `(Rs. ${reliefAmount.toLocaleString()})`;
                                        })()}
                                    </span>
                                </div>
                            )}
                            {selectedTypes.has('APIT') && (
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
                )}
            </div>
        </div>
    );
};

export default EmploymentIncome;