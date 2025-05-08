import React, { useState, useEffect } from 'react';
import { ChevronDown, Plus, Trash2 } from "lucide-react";
import { useNavigate } from 'react-router-dom';
import styles from './Employment_Income.module.css';
import TaxationMenu from './Taxation_Menu';

const RENTAL_RELIEF_AMOUNT = 225000; // Rs. 225,000

const InvestmentIncome = () => {
    // Add this state for form data
    const [formData, setFormData] = useState({
        interestEntries: [{ name: 'Interest Income', amount: '' }],
        rentEntries: [{ name: 'Rental Income', amount: '' }],
        capitalGainEntries: [{ name: 'Capital Gain', amount: '' }],
        dividendEntries: [{ name: 'Dividend Income', amount: '' }],
        otherEntries: [{ name: 'Other Investment', amount: '' }],
        aitEntries: [{ source: '', amount: '' }],
        taxDeductions: [],
        selectedTypes: [],
        totalInvestmentIncome: 0,
        totalTaxDeductions: 0
    });

    // Remove individual states and use formData instead
    const {
        interestEntries,
        rentEntries,
        capitalGainEntries,
        dividendEntries,
        otherEntries,
        aitEntries,
        taxDeductions,
        selectedTypes,
        totalInvestmentIncome,
        totalTaxDeductions
    } = formData;

    const [openDescription, setOpenDescription] = useState(null);
    const [selectedTaxType, setSelectedTaxType] = useState('ait'); // 'ait' or 'paidTax'
    const navigate = useNavigate();

    useEffect(() => {
        const selectedCategories = JSON.parse(sessionStorage.getItem('selectedCategories') || '[]');
        if (!selectedCategories.includes('investment')) {
            navigate('/taxation');
        }
    }, [navigate]);

    // Add this useEffect for data persistence
    useEffect(() => {
        const savedData = sessionStorage.getItem('investmentIncomeData');
        if (savedData) {
            const parsedData = JSON.parse(savedData);
            setFormData(prevData => ({
                ...prevData,
                ...parsedData
            }));
        }
    }, []);

    // Update handleEntryChange to work with formData
    const handleEntryChange = (index, field, value, entryType) => {
        setFormData(prevData => {
            const entries = [...prevData[entryType]];
            entries[index] = {
                ...entries[index],
                [field]: value
            };
            return {
                ...prevData,
                [entryType]: entries
            };
        });
    };

    // Update handleAddEntry
    const handleAddEntry = (entryType) => {
        setFormData(prevData => ({
            ...prevData,
            [entryType]: [...prevData[entryType], { name: '', amount: '' }]
        }));
    };

    // Update handleRemoveEntry
    const handleRemoveEntry = (index, entryType) => {
        setFormData(prevData => ({
            ...prevData,
            [entryType]: prevData[entryType].filter((_, i) => i !== index)
        }));
    };

    // Update handleTypeToggle
    const handleTypeToggle = (typeId) => {
        setFormData(prevData => {
            const newTypes = prevData.selectedTypes.includes(typeId)
                ? prevData.selectedTypes.filter(id => id !== typeId)
                : [...prevData.selectedTypes, typeId];

            let newTaxDeductions = [...prevData.taxDeductions];
            if (typeId === 'ait') {
                newTaxDeductions = [];
                if (newTypes.includes('interest')) {
                    newTaxDeductions.push({ source: 'Interest Income AIT', amount: '' });
                }
                if (newTypes.includes('rental')) {
                    newTaxDeductions.push({ source: 'Rental Income AIT', amount: '' });
                }
                if (newTypes.includes('capital-gain')) {
                    newTaxDeductions.push({ source: 'Capital Gain Paid Tax', amount: '' });
                }
            }

            return {
                ...prevData,
                selectedTypes: newTypes,
                taxDeductions: newTaxDeductions
            };
        });
    };

    // Add this function after handleTypeToggle and before handleSubmit
    const handleAddTaxDeduction = () => {
        setFormData(prevData => ({
            ...prevData,
            taxDeductions: [
                ...prevData.taxDeductions,
                { source: '', amount: '' }
            ]
        }));
    };

    // Update handleSubmit
    const handleSubmit = (e) => {
        e.preventDefault();

        // Save investment income data
        sessionStorage.setItem('investmentIncomeData', JSON.stringify(formData));

        // Update selected categories if needed
        const currentCategories = JSON.parse(sessionStorage.getItem('selectedCategories') || '[]');
        if (!currentCategories.includes('investment')) {
            sessionStorage.setItem('selectedCategories', 
                JSON.stringify([...currentCategories, 'investment']));
        }

        // Trigger preview update
        window.dispatchEvent(new Event('incomeDataUpdated'));

        // Get next form to navigate to
        const selectedCategories = JSON.parse(sessionStorage.getItem('selectedCategories') || '[]');
        const currentIndex = selectedCategories.indexOf('investment');
        const nextCategory = selectedCategories[currentIndex + 1];

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
    };

    // Update useEffect for calculations
    useEffect(() => {
        const calculateTotal = (entries) => {
            return (entries || []).reduce((sum, entry) => sum + (Number(entry.amount) || 0), 0);
        };

        const newTotalIncome = 
            calculateTotal(interestEntries) +
            calculateTotal(dividendEntries) +
            calculateTotal(rentEntries) +
            calculateTotal(capitalGainEntries) +
            calculateTotal(otherEntries);

        const newTotalDeductions = calculateTotal(taxDeductions);

        setFormData(prevData => ({
            ...prevData,
            totalInvestmentIncome: newTotalIncome,
            totalTaxDeductions: newTotalDeductions
        }));
    }, [interestEntries, dividendEntries, rentEntries, capitalGainEntries, otherEntries, taxDeductions]);

    // Update investment types without tax references
    const investmentTypes = [
        {
            id: 'interest',
            label: 'Interest Income',
            description: 'Interest earned from bank deposits or other investments'
        },
        {
            id: 'rental',
            label: 'Rent Income',
            description: 'Rental earnings from properties'
        },
        {
            id: 'capital-gain',
            label: 'Capital Gain',
            description: 'Profit from selling investment assets'
        },
        {
            id: 'dividend',
            label: 'Dividend Income',
            description: 'Earnings from company dividends'
        },
        {
            id: 'other',
            label: 'Other Investment Income',
            description: 'Any other type of investment earnings not listed above'
        },
        {
            id: 'ait',
            label: 'AIT and Paid tax Deduction',
            description: 'Advance Income Tax deducted from investment income sources'
        }
    ];

    return (
        <>
            <TaxationMenu />
            <div className={styles.container}>
                <div className={styles.header}>
                    <h1 className={styles.title}>Investment Income</h1>
                    <h2 className={styles.subtitle}>Select Applicable Investment Category</h2>
                </div>

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

                    {selectedTypes.includes('interest') && (
                        <div className={styles.section}>
                            <h3>Interest Income</h3>
                            {interestEntries.map((entry, index) => (
                                <div key={index} className={styles.entryRow}>
                                    <input
                                        type="text"
                                        value={entry.name}
                                        onChange={(e) => handleEntryChange(index, 'name', e.target.value, 'interestEntries')}
                                        placeholder="Description"
                                        className={styles.inputField}
                                    />
                                    <input
                                        type="number"
                                        value={entry.amount}
                                        onChange={(e) => handleEntryChange(index, 'amount', e.target.value, 'interestEntries')}
                                        placeholder="Amount"
                                        className={styles.inputField}
                                    />
                                    <button 
                                        type="button" 
                                        onClick={() => handleRemoveEntry(index, 'interestEntries')}
                                        className={styles.removeButton}
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))}
                            <button 
                                type="button" 
                                onClick={() => handleAddEntry('interestEntries')} 
                                className={styles.addButton}
                            >
                                <Plus size={16} />
                            </button>
                        </div>
                    )}

                    {selectedTypes.includes('dividend') && (
                        <div className={styles.section}>
                            <h3>Dividend Income</h3>
                            {dividendEntries.map((entry, index) => (
                                <div key={index} className={styles.entryRow}>
                                    <input
                                        type="text"
                                        value={entry.name}
                                        onChange={(e) => handleEntryChange(index, 'name', e.target.value, 'dividendEntries')}
                                        placeholder="Description"
                                        className={styles.inputField}
                                    />
                                    <input
                                        type="number"
                                        value={entry.amount}
                                        onChange={(e) => handleEntryChange(index, 'amount', e.target.value, 'dividendEntries')}
                                        placeholder="Amount"
                                        className={styles.inputField}
                                    />
                                    <button 
                                        type="button" 
                                        onClick={() => handleRemoveEntry(index, 'dividendEntries')}
                                        className={styles.removeButton}
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))}
                            <button 
                                type="button" 
                                onClick={() => handleAddEntry('dividendEntries')} 
                                className={styles.addButton}
                            >
                                <Plus size={16} />
                            </button>
                        </div>
                    )}

                    {selectedTypes.includes('rental') && (
                        <div className={styles.section}>
                            <h3>Rental Income</h3>
                            {rentEntries.map((entry, index) => (
                                <div key={index} className={styles.entryRow}>
                                    <input
                                        type="text"
                                        value={entry.name}
                                        onChange={(e) => handleEntryChange(index, 'name', e.target.value, 'rentEntries')}
                                        placeholder="Description"
                                        className={styles.inputField}
                                    />
                                    <input
                                        type="number"
                                        value={entry.amount}
                                        onChange={(e) => handleEntryChange(index, 'amount', e.target.value, 'rentEntries')}
                                        placeholder="Amount"
                                        className={styles.inputField}
                                    />
                                    <button 
                                        type="button" 
                                        onClick={() => handleRemoveEntry(index, 'rentEntries')}
                                        className={styles.removeButton}
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))}
                            <button 
                                type="button" 
                                onClick={() => handleAddEntry('rentEntries')} 
                                className={styles.addButton}
                            >
                                <Plus size={16} />
                            </button>
                        </div>
                    )}

                    {selectedTypes.includes('capital-gain') && (
                        <div className={styles.section}>
                            <h3>Capital Gain</h3>
                            {capitalGainEntries.map((entry, index) => (
                                <div key={index} className={styles.entryRow}>
                                    <input
                                        type="text"
                                        value={entry.name}
                                        onChange={(e) => handleEntryChange(index, 'name', e.target.value, 'capitalGainEntries')}
                                        placeholder="Description"
                                        className={styles.inputField}
                                    />
                                    <input
                                        type="number"
                                        value={entry.amount}
                                        onChange={(e) => handleEntryChange(index, 'amount', e.target.value, 'capitalGainEntries')}
                                        placeholder="Amount"
                                        className={styles.inputField}
                                    />
                                    <button 
                                        type="button" 
                                        onClick={() => handleRemoveEntry(index, 'capitalGainEntries')}
                                        className={styles.removeButton}
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))}
                            <button 
                                type="button" 
                                onClick={() => handleAddEntry('capitalGainEntries')} 
                                className={styles.addButton}
                            >
                                <Plus size={16} />
                            </button>
                        </div>
                    )}

                    {selectedTypes.includes('other') && (
                        <div className={styles.section}>
                            <h3>Other Investment Income</h3>
                            {otherEntries.map((entry, index) => (
                                <div key={index} className={styles.entryRow}>
                                    <input
                                        type="text"
                                        value={entry.name}
                                        onChange={(e) => handleEntryChange(index, 'name', e.target.value, 'otherEntries')}
                                        placeholder="Description"
                                        className={styles.inputField}
                                    />
                                    <input
                                        type="number"
                                        value={entry.amount}
                                        onChange={(e) => handleEntryChange(index, 'amount', e.target.value, 'otherEntries')}
                                        placeholder="Amount"
                                        className={styles.inputField}
                                    />
                                    <button 
                                        type="button" 
                                        onClick={() => handleRemoveEntry(index, 'otherEntries')}
                                        className={styles.removeButton}
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))}
                            <button 
                                type="button" 
                                onClick={() => handleAddEntry('otherEntries')} 
                                className={styles.addButton}
                            >
                                <Plus size={16} />
                            </button>
                        </div>
                    )}

                    {selectedTypes.includes('ait') && (
                        <div className={styles.aitSection}>
                            <h3>Tax Deductions</h3>
                            <div className={styles.aitEntries}>
                                {taxDeductions.map((entry, index) => (
                                    <div key={index} className={styles.entryRow}>
                                        <input
                                            type="text"
                                            value={entry.source}
                                            onChange={(e) => handleEntryChange(index, 'source', e.target.value, 'taxDeductions')}
                                            placeholder="Income Source"
                                            className={styles.inputField}
                                        />
                                        <input
                                            type="number"
                                            value={entry.amount}
                                            onChange={(e) => handleEntryChange(index, 'amount', e.target.value, 'taxDeductions')}
                                            placeholder="Tax Amount"
                                            className={styles.inputField}
                                        />
                                        <button 
                                            type="button" 
                                            onClick={() => handleRemoveEntry(index, 'taxDeductions')}
                                            className={styles.removeButton}
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                ))}
                                <button 
                                    type="button" 
                                    onClick={handleAddTaxDeduction} 
                                    className={styles.addButton}
                                >
                                    <Plus size={16} />
                                </button>
                            </div>
                        </div>
                    )}

                    <div className={styles.totalSection}>
                        <div className={styles.totalRow}>
                            <span className={styles.totalLabel}>Total Investment Income:</span>
                            <span className={styles.totalAmount}>Rs. {totalInvestmentIncome.toLocaleString()}</span>
                        </div>
                        {selectedTypes.includes('rental') && (
                            <div className={styles.totalRow}>
                                <span className={styles.totalLabel}>Rental Relief (25%):</span>
                                <span className={`${styles.totalAmount} ${styles.negative}`}>
                                    {(() => {
                                        const rentalIncome = rentEntries.reduce((sum, entry) => sum + (Number(entry.amount) || 0), 0);
                                        const reliefAmount = rentalIncome * 0.25; // Calculate 25% of rental income
                                        return `(Rs. ${reliefAmount.toLocaleString()})`;
                                    })()}
                                </span>
                            </div>
                        )}
                        {selectedTypes.includes('ait') && (
                            <div className={styles.totalRow}>
                                <span className={styles.totalLabel}>Total Tax Deductions:</span>
                                <span className={styles.totalAmount}>Rs. {totalTaxDeductions.toLocaleString()}</span>
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

export default InvestmentIncome;