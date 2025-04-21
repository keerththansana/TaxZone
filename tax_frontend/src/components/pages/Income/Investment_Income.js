import React, { useState, useEffect } from 'react';
import { ChevronDown, Plus, Trash2 } from "lucide-react";
import { useNavigate } from 'react-router-dom';
import styles from './Employment_Income.module.css';
import TaxationMenu from './Taxation_Menu';

// Remove tax-related state
const InvestmentIncome = () => {
    const [selectedTypes, setSelectedTypes] = useState([]);
    const [openDescription, setOpenDescription] = useState(null);
    const [interestEntries, setInterestEntries] = useState([{ name: 'Interest Income', amount: '' }]);
    const [rentEntries, setRentEntries] = useState([{ name: 'Rental Income', amount: '' }]);
    const [capitalGainEntries, setCapitalGainEntries] = useState([{ name: 'Capital Gain', amount: '' }]);
    const [dividendEntries, setDividendEntries] = useState([{ name: 'Dividend Income', amount: '' }]);
    const [otherEntries, setOtherEntries] = useState([{ name: 'Other Investment', amount: '' }]);
    const [aitEntries, setAitEntries] = useState([{ source: '', amount: '' }]);
    const [taxDeductions, setTaxDeductions] = useState([]);
    const [selectedTaxType, setSelectedTaxType] = useState('ait'); // 'ait' or 'paidTax'
    const [totalInvestmentIncome, setTotalInvestmentIncome] = useState(0);
    const [totalTaxDeductions, setTotalTaxDeductions] = useState(0);
    const navigate = useNavigate();

    useEffect(() => {
        const selectedCategories = JSON.parse(sessionStorage.getItem('selectedCategories') || '[]');
        if (!selectedCategories.includes('investment')) {
            navigate('/taxation');
        }
    }, [navigate]);

    useEffect(() => {
        // Calculate total investment income
        const interestTotal = interestEntries.reduce((sum, entry) => sum + (Number(entry.amount) || 0), 0);
        const dividendTotal = dividendEntries.reduce((sum, entry) => sum + (Number(entry.amount) || 0), 0);
        const rentTotal = rentEntries.reduce((sum, entry) => sum + (Number(entry.amount) || 0), 0);
        const capitalGainTotal = capitalGainEntries.reduce((sum, entry) => sum + (Number(entry.amount) || 0), 0);
        const otherTotal = otherEntries.reduce((sum, entry) => sum + (Number(entry.amount) || 0), 0);

        setTotalInvestmentIncome(
            interestTotal + 
            dividendTotal + 
            rentTotal + 
            capitalGainTotal + 
            otherTotal
        );

        // Calculate total tax deductions
        const taxTotal = taxDeductions.reduce((sum, entry) => sum + (Number(entry.amount) || 0), 0);
        setTotalTaxDeductions(taxTotal);

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

    const handleTypeToggle = (typeId) => {
        setSelectedTypes(prev => {
            const newTypes = prev.includes(typeId) 
                ? prev.filter(id => id !== typeId)
                : [...prev, typeId];
            
            // Handle automatic tax deduction entries
            if (typeId === 'ait') {
                let newDeductions = [];
                if (newTypes.includes('interest')) {
                    newDeductions.push({ source: 'Interest Income AIT', amount: '' });
                }
                if (newTypes.includes('rental')) {
                    newDeductions.push({ source: 'Rental Income AIT', amount: '' });
                }
                if (newTypes.includes('capital-gain')) {
                    newDeductions.push({ source: 'Capital Gain Paid Tax', amount: '' });
                }
                setTaxDeductions(newDeductions);
            } else if (prev.includes('ait')) {
                // Update existing tax deductions when income types change
                setTaxDeductions(current => {
                    let updated = [...current];
                    if (typeId === 'interest') {
                        updated = updated.filter(d => !d.source.includes('Interest'));
                        if (!prev.includes(typeId)) {
                            updated.push({ source: 'Interest Income AIT', amount: '' });
                        }
                    }
                    if (typeId === 'rental') {
                        updated = updated.filter(d => !d.source.includes('Rental'));
                        if (!prev.includes(typeId)) {
                            updated.push({ source: 'Rental Income AIT', amount: '' });
                        }
                    }
                    if (typeId === 'capital-gain') {
                        updated = updated.filter(d => !d.source.includes('Capital'));
                        if (!prev.includes(typeId)) {
                            updated.push({ source: 'Capital Gain Paid Tax', amount: '' });
                        }
                    }
                    return updated;
                });
            }
            return newTypes;
        });
    };

    // Simplify handleAddEntry
    const handleAddEntry = (entries, setEntries) => {
        const newEntry = { name: '', amount: '' };
        setEntries([...entries, newEntry]);
    };

    const handleEntryChange = (index, field, value, entries, setEntries) => {
        const newEntries = [...entries];
        newEntries[index][field] = value;
        setEntries(newEntries);
    };

    const handleRemoveEntry = (index, entries, setEntries) => {
        setEntries(entries.filter((_, i) => i !== index));
    };

    const handleAddAIT = () => {
        setAitEntries([...aitEntries, { source: '', amount: '' }]);
    };

    const handleAitChange = (index, field, value) => {
        const newEntries = [...aitEntries];
        newEntries[index][field] = value;
        setAitEntries(newEntries);
    };

    const handleRemoveAIT = (index) => {
        setAitEntries(aitEntries.filter((_, i) => i !== index));
    };

    const handleTaxDeductionChange = (index, field, value) => {
        const newDeductions = [...taxDeductions];
        newDeductions[index][field] = value;
        setTaxDeductions(newDeductions);
    };

    const handleAddTaxDeduction = () => {
        setTaxDeductions([...taxDeductions, { source: '', amount: '' }]);
    };

    const handleRemoveTaxDeduction = (index) => {
        setTaxDeductions(taxDeductions.filter((_, i) => i !== index));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        
        const formData = {
            interestEntries,
            dividendEntries,
            rentEntries,
            capitalGainEntries,
            otherEntries,
            aitEntries
        };
        sessionStorage.setItem('investmentIncomeData', JSON.stringify(formData));

        // Get all selected categories and navigate to next
        const selectedCategories = JSON.parse(sessionStorage.getItem('selectedCategories') || '[]');
        const currentIndex = selectedCategories.indexOf('investment');
        const nextCategory = selectedCategories[currentIndex + 1];

        if (nextCategory) {
            switch(nextCategory) {
                case 'employment':
                    navigate('/employment_income');
                    break;
                case 'business':
                    navigate('/business_income');
                    break;
                case 'other':
                    navigate('/other_income');
                    break;
                case 'terminal':
                    navigate('/terminal_benefits');
                    break;
                case 'qualifying':
                    navigate('/qualifying_payments');
                    break;
                default:
                    navigate('/summary');
            }
        } else {
            navigate('/summary'); // Navigate to summary if this is the last form
        }
    };

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
                                        onChange={(e) => handleEntryChange(index, 'name', e.target.value, interestEntries, setInterestEntries)}
                                        placeholder="Description"
                                        className={styles.inputField}
                                    />
                                    <input
                                        type="number"
                                        value={entry.amount}
                                        onChange={(e) => handleEntryChange(index, 'amount', e.target.value, interestEntries, setInterestEntries)}
                                        placeholder="Amount"
                                        className={styles.inputField}
                                    />
                                    <button 
                                        type="button" 
                                        onClick={() => handleRemoveEntry(index, interestEntries, setInterestEntries)}
                                        className={styles.removeButton}
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))}
                            <button 
                                type="button" 
                                onClick={() => handleAddEntry(interestEntries, setInterestEntries)} 
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
                                        onChange={(e) => handleEntryChange(index, 'name', e.target.value, dividendEntries, setDividendEntries)}
                                        placeholder="Description"
                                        className={styles.inputField}
                                    />
                                    <input
                                        type="number"
                                        value={entry.amount}
                                        onChange={(e) => handleEntryChange(index, 'amount', e.target.value, dividendEntries, setDividendEntries)}
                                        placeholder="Amount"
                                        className={styles.inputField}
                                    />
                                    <button 
                                        type="button" 
                                        onClick={() => handleRemoveEntry(index, dividendEntries, setDividendEntries)}
                                        className={styles.removeButton}
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))}
                            <button 
                                type="button" 
                                onClick={() => handleAddEntry(dividendEntries, setDividendEntries)} 
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
                                        onChange={(e) => handleEntryChange(index, 'name', e.target.value, rentEntries, setRentEntries)}
                                        placeholder="Description"
                                        className={styles.inputField}
                                    />
                                    <input
                                        type="number"
                                        value={entry.amount}
                                        onChange={(e) => handleEntryChange(index, 'amount', e.target.value, rentEntries, setRentEntries)}
                                        placeholder="Amount"
                                        className={styles.inputField}
                                    />
                                    <button 
                                        type="button" 
                                        onClick={() => handleRemoveEntry(index, rentEntries, setRentEntries)}
                                        className={styles.removeButton}
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))}
                            <button 
                                type="button" 
                                onClick={() => handleAddEntry(rentEntries, setRentEntries)} 
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
                                        onChange={(e) => handleEntryChange(index, 'name', e.target.value, capitalGainEntries, setCapitalGainEntries)}
                                        placeholder="Description"
                                        className={styles.inputField}
                                    />
                                    <input
                                        type="number"
                                        value={entry.amount}
                                        onChange={(e) => handleEntryChange(index, 'amount', e.target.value, capitalGainEntries, setCapitalGainEntries)}
                                        placeholder="Amount"
                                        className={styles.inputField}
                                    />
                                    <button 
                                        type="button" 
                                        onClick={() => handleRemoveEntry(index, capitalGainEntries, setCapitalGainEntries)}
                                        className={styles.removeButton}
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))}
                            <button 
                                type="button" 
                                onClick={() => handleAddEntry(capitalGainEntries, setCapitalGainEntries)} 
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
                                        onChange={(e) => handleEntryChange(index, 'name', e.target.value, otherEntries, setOtherEntries)}
                                        placeholder="Description"
                                        className={styles.inputField}
                                    />
                                    <input
                                        type="number"
                                        value={entry.amount}
                                        onChange={(e) => handleEntryChange(index, 'amount', e.target.value, otherEntries, setOtherEntries)}
                                        placeholder="Amount"
                                        className={styles.inputField}
                                    />
                                    <button 
                                        type="button" 
                                        onClick={() => handleRemoveEntry(index, otherEntries, setOtherEntries)}
                                        className={styles.removeButton}
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))}
                            <button 
                                type="button" 
                                onClick={() => handleAddEntry(otherEntries, setOtherEntries)} 
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
                                            onChange={(e) => handleTaxDeductionChange(index, 'source', e.target.value)}
                                            placeholder="Income Source"
                                            className={styles.inputField}
                                        />
                                        <input
                                            type="number"
                                            value={entry.amount}
                                            onChange={(e) => handleTaxDeductionChange(index, 'amount', e.target.value)}
                                            placeholder="Tax Amount"
                                            className={styles.inputField}
                                        />
                                        <button 
                                            type="button" 
                                            onClick={() => handleRemoveTaxDeduction(index)}
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