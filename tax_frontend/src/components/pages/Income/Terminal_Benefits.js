import React, { useState, useEffect } from 'react';
import { ChevronDown, Plus, Trash2 } from "lucide-react";
import { useNavigate } from 'react-router-dom';
import Header from '../../common/Header/Header';
import styles from './Employment_Income.module.css';
import TaxationMenu from './Taxation_Menu';
import { AutoFillHelper } from '../../../utils/autoFillHelper';

const TerminalBenefits = () => {
    const [selectedTypes, setSelectedTypes] = useState([]);
    const [openDescription, setOpenDescription] = useState(null);
    const [commutedEntries, setCommutedEntries] = useState([{ name: 'Commuted Pension', amount: '' }]);
    const [gratuityEntries, setGratuityEntries] = useState([{ name: 'Retiring Gratuity', amount: '' }]);
    const [compensationEntries, setCompensationEntries] = useState([{ name: 'Compensation', amount: '' }]);
    const [etfEntries, setEtfEntries] = useState([{ name: 'ETF Payment', amount: '' }]);
    const [otherEntries, setOtherEntries] = useState([{ name: 'Other Terminal Benefits', amount: '' }]);
    const [totalTerminalBenefits, setTotalTerminalBenefits] = useState(0); // Added state for total
    const [formData, setFormData] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const navigate = useNavigate();

    const benefitTypes = [
        {
            id: 'commuted',
            label: 'Commuted Pension',
            description: 'Lump sum received instead of regular pension payments'
        },
        {
            id: 'gratuity',
            label: 'Retiring Gratuity',
            description: 'One-time payment given upon retirement'
        },
        {
            id: 'compensation',
            label: 'Compensation for Job Loss',
            description: 'Payment received for loss of employment under a uniform scheme'
        },
        {
            id: 'etf',
            label: 'ETF Payment',
            description: 'Amount received from the Employees\' Trust Fund at or after retirement'
        },
        {
            id: 'other',
            label: 'Other Terminal Benefits',
            description: 'Any other terminal benefits not listed above'
        }
    ];

    useEffect(() => {
        const selectedCategories = JSON.parse(sessionStorage.getItem('selectedCategories') || '[]');
        const currentCategory = sessionStorage.getItem('currentCategory');
        
        if (!selectedCategories.includes('terminal') || currentCategory !== 'terminal') {
            navigate('/taxation');
        }
    }, [navigate]);

    useEffect(() => {
        // Calculate total terminal benefits
        const commutedTotal = commutedEntries.reduce((sum, entry) => sum + (Number(entry.amount) || 0), 0);
        const gratuityTotal = gratuityEntries.reduce((sum, entry) => sum + (Number(entry.amount) || 0), 0);
        const compensationTotal = compensationEntries.reduce((sum, entry) => sum + (Number(entry.amount) || 0), 0);
        const etfTotal = etfEntries.reduce((sum, entry) => sum + (Number(entry.amount) || 0), 0);
        const otherTotal = otherEntries.reduce((sum, entry) => sum + (Number(entry.amount) || 0), 0);

        setTotalTerminalBenefits(
            commutedTotal + 
            gratuityTotal + 
            compensationTotal + 
            etfTotal + 
            otherTotal
        );
    }, [commutedEntries, gratuityEntries, compensationEntries, etfEntries, otherEntries]);

    useEffect(() => {
        const fetchAutoFillData = async () => {
            try {
                // First check if we have analysis data in session storage
                const storedAnalysis = sessionStorage.getItem('last_analysis');
                if (storedAnalysis) {
                    try {
                        const analysisData = JSON.parse(storedAnalysis);
                        console.log('Found analysis data in session:', analysisData);
                        
                        // Format the data for the terminal benefits form
                        const formattedData = {
                            commutedEntries: [],
                            gratuityEntries: [],
                            compensationEntries: [],
                            etfEntries: [],
                            otherEntries: [],
                            selectedTypes: [],
                            totalTerminalBenefits: 0
                        };

                        // Process income items from each result
                        analysisData.forEach(result => {
                            if (result.analysis && result.analysis.income_items) {
                                result.analysis.income_items.forEach(item => {
                                    const description = (item.description || '').toLowerCase();
                                    const amount = item.amount || 0;
                                    let category = item.category || '';
                                    category = category.toLowerCase();

                                    // Debug print
                                    console.log('Terminal benefit check:', { category, description });

                                    // Enhanced matching
                                    const isTerminalBenefit = 
                                        (category && category.includes('terminal')) ||
                                        description.includes('commuted') ||
                                        description.includes('pension') ||
                                        description.includes('gratuity') ||
                                        description.includes('compensation') ||
                                        description.includes('etf') ||
                                        description.includes('trust fund');

                                    if (isTerminalBenefit) {
                                        if (description.includes('commuted') || description.includes('pension')) {
                                            formattedData.commutedEntries.push({
                                                name: item.description || 'Commuted Pension',
                                                amount: amount.toString()
                                            });
                                            if (!formattedData.selectedTypes.includes('commuted')) {
                                                formattedData.selectedTypes.push('commuted');
                                            }
                                        } else if (description.includes('gratuity')) {
                                            formattedData.gratuityEntries.push({
                                                name: item.description || 'Gratuity',
                                                amount: amount.toString()
                                            });
                                            if (!formattedData.selectedTypes.includes('gratuity')) {
                                                formattedData.selectedTypes.push('gratuity');
                                            }
                                        } else if (description.includes('compensation')) {
                                            formattedData.compensationEntries.push({
                                                name: item.description || 'Compensation',
                                                amount: amount.toString()
                                            });
                                            if (!formattedData.selectedTypes.includes('compensation')) {
                                                formattedData.selectedTypes.push('compensation');
                                            }
                                        } else if (description.includes('etf') || description.includes('trust fund')) {
                                            formattedData.etfEntries.push({
                                                name: item.description || 'ETF Payment',
                                                amount: amount.toString()
                                            });
                                            if (!formattedData.selectedTypes.includes('etf')) {
                                                formattedData.selectedTypes.push('etf');
                                            }
                                        } else {
                                            formattedData.otherEntries.push({
                                                name: item.description || 'Other Terminal Benefit',
                                                amount: amount.toString()
                                            });
                                            if (!formattedData.selectedTypes.includes('other')) {
                                                formattedData.selectedTypes.push('other');
                                            }
                                        }
                                    }
                                });
                            }
                        });

                        // Calculate total terminal benefits
                        formattedData.totalTerminalBenefits = 
                            formattedData.commutedEntries.reduce((sum, entry) => sum + Number(entry.amount), 0) +
                            formattedData.gratuityEntries.reduce((sum, entry) => sum + Number(entry.amount), 0) +
                            formattedData.compensationEntries.reduce((sum, entry) => sum + Number(entry.amount), 0) +
                            formattedData.etfEntries.reduce((sum, entry) => sum + Number(entry.amount), 0) +
                            formattedData.otherEntries.reduce((sum, entry) => sum + Number(entry.amount), 0);

                        // Only update if we have data
                        if (formattedData.commutedEntries.length > 0 || 
                            formattedData.gratuityEntries.length > 0 || 
                            formattedData.compensationEntries.length > 0 || 
                            formattedData.etfEntries.length > 0 || 
                            formattedData.otherEntries.length > 0) {
                            console.log('Formatted data for terminal benefits form:', formattedData);

                            // Update the form with the formatted data
                            setFormData(formattedData);
                            setShowForm(true);

                            // Update individual state variables
                            setCommutedEntries(formattedData.commutedEntries);
                            setGratuityEntries(formattedData.gratuityEntries);
                            setCompensationEntries(formattedData.compensationEntries);
                            setEtfEntries(formattedData.etfEntries);
                            setOtherEntries(formattedData.otherEntries);
                            setSelectedTypes(formattedData.selectedTypes);

                            // Store the formatted data in session storage
                            sessionStorage.setItem('terminalBenefitsData', JSON.stringify(formattedData));
                        } else {
                            console.log('No relevant terminal benefits data found in analysis');
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
        const storedData = sessionStorage.getItem('terminalBenefitsData');
        if (storedData) {
            try {
                const parsedData = JSON.parse(storedData);
                setFormData(parsedData);
                setShowForm(true);

                // Update individual state variables
                setCommutedEntries(parsedData.commutedEntries);
                setGratuityEntries(parsedData.gratuityEntries);
                setCompensationEntries(parsedData.compensationEntries);
                setEtfEntries(parsedData.etfEntries);
                setOtherEntries(parsedData.otherEntries);
                setSelectedTypes(parsedData.selectedTypes);
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
                if (data.TerminalBenefits) {
                    const formattedData = {
                        commutedEntries: data.TerminalBenefits.commutedEntries || [],
                        gratuityEntries: data.TerminalBenefits.gratuityEntries || [],
                        compensationEntries: data.TerminalBenefits.compensationEntries || [],
                        etfEntries: data.TerminalBenefits.etfEntries || [],
                        otherEntries: data.TerminalBenefits.otherEntries || [],
                        selectedTypes: data.TerminalBenefits.selectedTypes || [],
                        totalTerminalBenefits: data.TerminalBenefits.totalTerminalBenefits || 0
                    };

                    // Calculate total terminal benefits
                    formattedData.totalTerminalBenefits = 
                        formattedData.commutedEntries.reduce((sum, entry) => sum + Number(entry.amount), 0) +
                        formattedData.gratuityEntries.reduce((sum, entry) => sum + Number(entry.amount), 0) +
                        formattedData.compensationEntries.reduce((sum, entry) => sum + Number(entry.amount), 0) +
                        formattedData.etfEntries.reduce((sum, entry) => sum + Number(entry.amount), 0) +
                        formattedData.otherEntries.reduce((sum, entry) => sum + Number(entry.amount), 0);

                    console.log('Setting new form data:', formattedData);
                    setFormData(formattedData);
                    setShowForm(true);

                    // Update individual state variables
                    setCommutedEntries(formattedData.commutedEntries);
                    setGratuityEntries(formattedData.gratuityEntries);
                    setCompensationEntries(formattedData.compensationEntries);
                    setEtfEntries(formattedData.etfEntries);
                    setOtherEntries(formattedData.otherEntries);
                    setSelectedTypes(formattedData.selectedTypes);
                }
            }
        };

        window.addEventListener('message', handleAutoFillUpdate);
        return () => window.removeEventListener('message', handleAutoFillUpdate);
    }, []);

    const handleTypeToggle = (typeId) => {
        setSelectedTypes(prev => {
            const newTypes = prev.includes(typeId) 
                ? prev.filter(id => id !== typeId)
                : [...prev, typeId];
            
            switch(typeId) {
                case 'commuted':
                    !prev.includes(typeId) 
                        ? setCommutedEntries([{ name: 'Commuted Pension', amount: '' }]) 
                        : setCommutedEntries([]);
                    break;
                case 'gratuity':
                    !prev.includes(typeId) 
                        ? setGratuityEntries([{ name: 'Retiring Gratuity', amount: '' }]) 
                        : setGratuityEntries([]);
                    break;
                case 'compensation':
                    !prev.includes(typeId) 
                        ? setCompensationEntries([{ name: 'Compensation', amount: '' }]) 
                        : setCompensationEntries([]);
                    break;
                case 'etf':
                    !prev.includes(typeId) 
                        ? setEtfEntries([{ name: 'ETF Payment', amount: '' }]) 
                        : setEtfEntries([]);
                    break;
                case 'other':
                    !prev.includes(typeId) 
                        ? setOtherEntries([{ name: 'Other Terminal Benefits', amount: '' }]) 
                        : setOtherEntries([]);
                    break;
            }
            return newTypes;
        });
    };

    const handleEntryChange = (index, field, value, type) => {
        const entries = {
            'commuted': [commutedEntries, setCommutedEntries],
            'gratuity': [gratuityEntries, setGratuityEntries],
            'compensation': [compensationEntries, setCompensationEntries],
            'etf': [etfEntries, setEtfEntries],
            'other': [otherEntries, setOtherEntries]
        }[type];

        const [currentEntries, setEntries] = entries;
        const newEntries = [...currentEntries];
        newEntries[index][field] = value;
        setEntries(newEntries);
    };

    const handleAddEntry = (type) => {
        const [entries, setEntries] = {
            'commuted': [commutedEntries, setCommutedEntries],
            'gratuity': [gratuityEntries, setGratuityEntries],
            'compensation': [compensationEntries, setCompensationEntries],
            'etf': [etfEntries, setEtfEntries],
            'other': [otherEntries, setOtherEntries]
        }[type];

        setEntries([...entries, { name: '', amount: '' }]);
    };

    const handleRemoveEntry = (index, type) => {
        const setEntries = {
            'commuted': setCommutedEntries,
            'gratuity': setGratuityEntries,
            'compensation': setCompensationEntries,
            'etf': setEtfEntries,
            'other': setOtherEntries
        }[type];

        setEntries(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        
        const formData = {
            selectedTypes,
            commutedEntries,
            gratuityEntries,
            compensationEntries,
            etfEntries,
            otherEntries,
            totalTerminalBenefits
        };

        // Save to sessionStorage
        sessionStorage.setItem('terminalBenefitsData', JSON.stringify(formData));

        // Update selected categories
        const currentCategories = JSON.parse(sessionStorage.getItem('selectedCategories') || '[]');
        if (!currentCategories.includes('terminal')) {
            sessionStorage.setItem('selectedCategories', 
                JSON.stringify([...currentCategories, 'terminal']));
        }
        
        // Trigger preview update
        window.dispatchEvent(new Event('incomeDataUpdated'));

        // Get next form to navigate to
        const selectedCategories = JSON.parse(sessionStorage.getItem('selectedCategories') || '[]');
        const currentIndex = selectedCategories.indexOf('terminal');
        const nextCategory = selectedCategories[currentIndex + 1];

        // Update current category
        if (nextCategory) {
            sessionStorage.setItem('currentCategory', nextCategory);
        }

        // Navigate to appropriate form
        if (nextCategory) {
            const routes = {
                employment: '/employment_income',
                business: '/business_income',
                investment: '/investment_income',
                other: '/other_income',
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
        <div className="terminal-benefits-page">
            <Header />
            <TaxationMenu />
            <div className={styles.container}>
                <div className={styles.header}>
                    <h1 className={styles.title}>Terminal Benefits</h1>
                    <h2 className={styles.subtitle}>Select Applicable Terminal Benefits</h2>
                </div>

                <form className={styles.formContainer} onSubmit={handleSubmit}>
                    <div className={styles.selectionGroup}>
                        {benefitTypes.map((type) => (
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
                        'commuted': [commutedEntries, 'Commuted Pension'],
                        'gratuity': [gratuityEntries, 'Retiring Gratuity'],
                        'compensation': [compensationEntries, 'Compensation for Job Loss'],
                        'etf': [etfEntries, 'ETF Payment'],
                        'other': [otherEntries, 'Other Terminal Benefits']
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
                            <span className={styles.totalLabel}>Total Terminal Benefits:</span>
                            <span className={styles.totalAmount}>Rs. {totalTerminalBenefits.toLocaleString()}</span>
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

export default TerminalBenefits;