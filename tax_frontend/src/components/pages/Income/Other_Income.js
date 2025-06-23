import React, { useState, useEffect } from 'react';
import { ChevronDown, Plus, Trash2 } from "lucide-react";
import { useNavigate } from 'react-router-dom';
import Header from '../../common/Header/Header';
import styles from './Employment_Income.module.css';
import TaxationMenu from './Taxation_Menu';
import { AutoFillHelper } from '../../../utils/autoFillHelper';
import AnalysisResults from './AnalysisResults';
import employmentStyles from './Employment_Income.module.css';

const OtherIncome = () => {
    const [selectedTypes, setSelectedTypes] = useState([]);
    const [openDescription, setOpenDescription] = useState(null);
    const [serviceEntries, setServiceEntries] = useState([{ name: 'Service Income', amount: '' }]);
    const [royaltyEntries, setRoyaltyEntries] = useState([{ name: 'Royalty Income', amount: '' }]);
    const [resourceEntries, setResourceEntries] = useState([{ name: 'Natural Resource Payment', amount: '' }]);
    const [gemEntries, setGemEntries] = useState([{ name: 'Auctioned Gem Sale', amount: '' }]);
    const [otherEntries, setOtherEntries] = useState([{ name: 'Other Income', amount: '' }]);
    const [whtEntries, setWhtEntries] = useState([]);
    const [totalOtherIncome, setTotalOtherIncome] = useState(0);
    const [totalWhtDeductions, setTotalWhtDeductions] = useState(0);
    const [formData, setFormData] = useState({
        serviceEntries: [],
        royaltyEntries: [],
        resourceEntries: [],
        gemEntries: [],
        otherEntries: [],
        whtEntries: [],
        selectedTypes: [],
        totalOtherIncome: 0
    });
    const [showForm, setShowForm] = useState(false);
    const navigate = useNavigate();
    const [showAnalysisResults, setShowAnalysisResults] = useState(false);
    const [analysisResults, setAnalysisResults] = useState([]);

    const otherIncomeTypes = [
        {
            id: 'service',
            label: 'Service Income (WHT)',
            description: 'Earnings from services provided (subject to Withholding Tax).'
        },
        {
            id: 'royalty',
            label: 'Royalty (WHT)',
            description: 'Payments received for intellectual property rights (subject to Withholding Tax).'
        },
        {
            id: 'resource',
            label: 'Natural Resource Payment (WHT)',
            description: 'Income from natural resource-related activities (subject to Withholding Tax).'
        },
        {
            id: 'gem',
            label: 'Auctioned Gem Sale (WHT)',
            description: 'Money earned from selling gems at auctions (subject to Withholding Tax).'
        },
        {
            id: 'other',
            label: 'Other Income',
            description: 'Any other income source that does not fit the above categories.'
        },
        {
            id: 'wht',
            label: 'WHT Deduction',
            description: 'Withholding Tax deducted from eligible income sources.'
        }
    ];

    useEffect(() => {
        const selectedCategories = JSON.parse(sessionStorage.getItem('selectedCategories') || '[]');
        if (!selectedCategories.includes('other')) {
            navigate('/taxation');
        }
    }, [navigate]);

    useEffect(() => {
        // Calculate total other income
        const serviceTotal = serviceEntries.reduce((sum, entry) => sum + (Number(entry.amount) || 0), 0);
        const royaltyTotal = royaltyEntries.reduce((sum, entry) => sum + (Number(entry.amount) || 0), 0);
        const resourceTotal = resourceEntries.reduce((sum, entry) => sum + (Number(entry.amount) || 0), 0);
        const gemTotal = gemEntries.reduce((sum, entry) => sum + (Number(entry.amount) || 0), 0);
        const otherTotal = otherEntries.reduce((sum, entry) => sum + (Number(entry.amount) || 0), 0);

        setTotalOtherIncome(
            serviceTotal + 
            royaltyTotal + 
            resourceTotal + 
            gemTotal + 
            otherTotal
        );

        // Calculate total WHT deductions
        const whtTotal = whtEntries.reduce((sum, entry) => sum + (Number(entry.amount) || 0), 0);
        setTotalWhtDeductions(whtTotal);

    }, [serviceEntries, royaltyEntries, resourceEntries, gemEntries, otherEntries, whtEntries]);

    const handleTypeToggle = (typeId) => {
        setSelectedTypes(prev => {
            const newTypes = prev.includes(typeId) 
                ? prev.filter(id => id !== typeId)
                : [...prev, typeId];
            
            // Handle automatic WHT entries
            if (typeId === 'wht') {
                let newWhtEntries = [];
                if (newTypes.includes('service')) {
                    newWhtEntries.push({ source: 'Service Income WHT', amount: '' });
                }
                if (newTypes.includes('royalty')) {
                    newWhtEntries.push({ source: 'Royalty WHT', amount: '' });
                }
                if (newTypes.includes('resource')) {
                    newWhtEntries.push({ source: 'Natural Resource WHT', amount: '' });
                }
                if (newTypes.includes('gem')) {
                    newWhtEntries.push({ source: 'Gem Sale WHT', amount: '' });
                }
                setWhtEntries(newWhtEntries);
            }

            // Handle entry initialization
            switch(typeId) {
                case 'service':
                    !prev.includes('service') 
                        ? setServiceEntries([{ name: 'Service Income', amount: '' }])
                        : setServiceEntries([]);
                    break;
                case 'royalty':
                    !prev.includes('royalty')
                        ? setRoyaltyEntries([{ name: 'Royalty Income', amount: '' }])
                        : setRoyaltyEntries([]);
                    break;
                case 'resource':
                    !prev.includes('resource')
                        ? setResourceEntries([{ name: 'Natural Resource Payment', amount: '' }])
                        : setResourceEntries([]);
                    break;
                case 'gem':
                    !prev.includes('gem')
                        ? setGemEntries([{ name: 'Auctioned Gem Sale', amount: '' }])
                        : setGemEntries([]);
                    break;
                case 'other':
                    !prev.includes('other')
                        ? setOtherEntries([{ name: 'Other Income', amount: '' }])
                        : setOtherEntries([]);
                    break;
            }

            // Update WHT entries when income types change
            if (prev.includes('wht')) {
                updateWhtEntries(newTypes);
            }

            return newTypes;
        });
    };

    const updateWhtEntries = (selectedTypes) => {
        const newEntries = [];
        if (selectedTypes.includes('service')) {
            newEntries.push({ source: 'Service Income WHT', amount: '' });
        }
        if (selectedTypes.includes('royalty')) {
            newEntries.push({ source: 'Royalty WHT', amount: '' });
        }
        if (selectedTypes.includes('resource')) {
            newEntries.push({ source: 'Natural Resource WHT', amount: '' });
        }
        if (selectedTypes.includes('gem')) {
            newEntries.push({ source: 'Gem Sale WHT', amount: '' });
        }
        setWhtEntries(newEntries);
    };

    // Handler functions for entries
    const handleEntryChange = (index, field, value, entries, setEntries) => {
        const newEntries = [...entries];
        newEntries[index][field] = value;
        setEntries(newEntries);
    };

    const handleWhtChange = (index, field, value) => {
        const newEntries = [...whtEntries];
        newEntries[index][field] = value;
        setWhtEntries(newEntries);
    };

    const handleAddEntry = (entries, setEntries) => {
        setEntries([...entries, { name: '', amount: '' }]);
    };

    const handleRemoveEntry = (index, entries, setEntries) => {
        setEntries(entries.filter((_, i) => i !== index));
    };

    // Add a test function for WHT auto-fill debugging
    const testWhtAutoFill = () => {
        console.log('Testing WHT auto-fill...');
        const testData = {
            type: 'autoFillUpdate',
            payload: {
                OtherIncome: {
                    otherEntries: [
                        { name: 'Service Income', amount: '50000' },
                        { name: 'Royalty Income', amount: '30000' }
                    ],
                    whtEntries: [
                        { source: 'Service Income WHT', amount: '5000' },
                        { source: 'Royalty WHT', amount: '3000' }
                    ],
                    selectedTypes: ['service', 'royalty', 'wht']
                }
            }
        };
        
        // Simulate the auto-fill update
        const event = { data: testData };
        handleAutoFillUpdate(event);
    };

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
                        
                        // Format the data for the other income form
                        const formattedData = {
                            serviceEntries: [],
                            royaltyEntries: [],
                            resourceEntries: [],
                            gemEntries: [],
                            otherEntries: [],
                            whtEntries: [],
                            selectedTypes: [],
                            totalOtherIncome: 0
                        };

                        // Process income items from each result
                        analysisData.forEach(result => {
                            if (result.analysis && result.analysis.income_items) {
                                result.analysis.income_items.forEach(item => {
                                    const description = (item.description || '').toLowerCase();
                                    const amount = item.amount || 0;
                                    let category = item.category || '';
                                    const type = item.type || '';

                                    // Debug print
                                    console.log('Other income check:', { category, type, description });

                                    // Process Other Income
                                    if (category === 'Other Income') {
                                        if (description.includes('service') || description.includes('consulting')) {
                                            formattedData.serviceEntries.push({
                                                name: item.description || 'Service Income',
                                                amount: amount.toString()
                                            });
                                            if (!formattedData.selectedTypes.includes('service')) {
                                                formattedData.selectedTypes.push('service');
                                            }
                                        } else if (description.includes('royalty')) {
                                            formattedData.royaltyEntries.push({
                                                name: item.description || 'Royalty Income',
                                                amount: amount.toString()
                                            });
                                            if (!formattedData.selectedTypes.includes('royalty')) {
                                                formattedData.selectedTypes.push('royalty');
                                            }
                                        } else if (description.includes('resource') || description.includes('natural')) {
                                            formattedData.resourceEntries.push({
                                                name: item.description || 'Natural Resource Payment',
                                                amount: amount.toString()
                                            });
                                            if (!formattedData.selectedTypes.includes('resource')) {
                                                formattedData.selectedTypes.push('resource');
                                            }
                                        } else if (description.includes('gem') || description.includes('jewelry')) {
                                            formattedData.gemEntries.push({
                                                name: item.description || 'Auctioned Gem Sale',
                                                amount: amount.toString()
                                            });
                                            if (!formattedData.selectedTypes.includes('gem')) {
                                                formattedData.selectedTypes.push('gem');
                                            }
                                        } else {
                                            formattedData.otherEntries.push({
                                                name: item.description || 'Other Income',
                                                amount: amount.toString()
                                            });
                                            if (!formattedData.selectedTypes.includes('other')) {
                                                formattedData.selectedTypes.push('other');
                                            }
                                        }
                                    }
                                });
                            }

                            // Process deductions (WHT entries)
                            if (result.analysis && result.analysis.deductions) {
                                result.analysis.deductions.forEach(deduction => {
                                    const description = (deduction.description || '').toLowerCase();
                                    const amount = deduction.amount || 0;
                                    const category = deduction.category || '';
                                    const type = deduction.type || '';

                                    // Debug print
                                    console.log('WHT deduction check:', { category, type, description });

                                    // Process WHT deductions - check for both category and type
                                    if ((category === 'Other Income' && type === 'WHT Deduction') || 
                                        type === 'WHT Deduction' || 
                                        description.includes('wht') || 
                                        description.includes('withholding')) {
                                        
                                        // Determine the source of WHT based on description
                                        let source = 'WHT Deduction';
                                        if (description.includes('service')) {
                                            source = 'Service Income WHT';
                                        } else if (description.includes('royalty')) {
                                            source = 'Royalty WHT';
                                        } else if (description.includes('resource') || description.includes('natural')) {
                                            source = 'Natural Resource WHT';
                                        } else if (description.includes('gem') || description.includes('auction')) {
                                            source = 'Gem Sale WHT';
                                        } else if (description.includes('dividend')) {
                                            source = 'Dividend WHT';
                                        } else if (description.includes('interest')) {
                                            source = 'Interest WHT';
                                        }

                                        // Add to WHT entries
                                        formattedData.whtEntries = formattedData.whtEntries || [];
                                        formattedData.whtEntries.push({
                                            source: source,
                                            amount: amount.toString()
                                        });

                                        // Add WHT to selected types if not already present
                                        if (!formattedData.selectedTypes.includes('wht')) {
                                            formattedData.selectedTypes.push('wht');
                                        }
                                    }
                                });
                            }
                        });

                        // Calculate total other income
                        formattedData.totalOtherIncome = 
                            formattedData.serviceEntries.reduce((sum, entry) => sum + Number(entry.amount), 0) +
                            formattedData.royaltyEntries.reduce((sum, entry) => sum + Number(entry.amount), 0) +
                            formattedData.resourceEntries.reduce((sum, entry) => sum + Number(entry.amount), 0) +
                            formattedData.gemEntries.reduce((sum, entry) => sum + Number(entry.amount), 0) +
                            formattedData.otherEntries.reduce((sum, entry) => sum + Number(entry.amount), 0);

                        // Only update if we have data
                        if (formattedData.serviceEntries.length > 0 || 
                            formattedData.royaltyEntries.length > 0 || 
                            formattedData.resourceEntries.length > 0 || 
                            formattedData.gemEntries.length > 0 || 
                            formattedData.otherEntries.length > 0 ||
                            formattedData.whtEntries.length > 0) {
                            console.log('Formatted data for other income form:', formattedData);

                            // Update the form with the formatted data
                            setFormData(formattedData);
                            setShowForm(true);

                            // Update individual state variables
                            setServiceEntries(formattedData.serviceEntries);
                            setRoyaltyEntries(formattedData.royaltyEntries);
                            setResourceEntries(formattedData.resourceEntries);
                            setGemEntries(formattedData.gemEntries);
                            setOtherEntries(formattedData.otherEntries);
                            setWhtEntries(formattedData.whtEntries || []);
                            setSelectedTypes(formattedData.selectedTypes);
                            
                            // Ensure WHT checkbox is checked if WHT entries exist
                            if (formattedData.whtEntries && formattedData.whtEntries.length > 0) {
                                if (!formattedData.selectedTypes.includes('wht')) {
                                    const updatedSelectedTypes = [...formattedData.selectedTypes, 'wht'];
                                    setSelectedTypes(updatedSelectedTypes);
                                    console.log('Auto-checked WHT checkbox');
                                }
                            }
                            
                            console.log('Updated WHT entries state:', formattedData.whtEntries);
                            console.log('Updated selected types:', formattedData.selectedTypes);

                            // Store the formatted data in session storage
                            sessionStorage.setItem('otherIncomeData', JSON.stringify(formattedData));
                        } else {
                            console.log('No relevant other income data found in analysis');
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
        const storedData = sessionStorage.getItem('otherIncomeData');
        if (storedData) {
            try {
                const parsedData = JSON.parse(storedData);
                setFormData(parsedData);
                setShowForm(true);
                
                // Update individual state variables
                setServiceEntries(parsedData.serviceEntries || []);
                setRoyaltyEntries(parsedData.royaltyEntries || []);
                setResourceEntries(parsedData.resourceEntries || []);
                setGemEntries(parsedData.gemEntries || []);
                setOtherEntries(parsedData.otherEntries || []);
                setWhtEntries(parsedData.whtEntries || []);
                setSelectedTypes(parsedData.selectedTypes || []);
                
                // Ensure WHT checkbox is checked if WHT entries exist
                if (parsedData.whtEntries && parsedData.whtEntries.length > 0) {
                    if (!parsedData.selectedTypes.includes('wht')) {
                        const updatedSelectedTypes = [...(parsedData.selectedTypes || []), 'wht'];
                        setSelectedTypes(updatedSelectedTypes);
                        console.log('Auto-checked WHT checkbox from session storage');
                    }
                }
            } catch (error) {
                console.error('Error parsing stored data:', error);
            }
        }

        // Then try to fetch auto-fill data
        fetchAutoFillData();

        // Listen for auto-fill data updates
        const handleAutoFillUpdate = (event) => {
            console.log('Received auto-fill update event:', event.data);
            if (event.data && event.data.type === 'autoFillUpdate') {
                const data = event.data.payload;
                console.log('Auto-fill payload:', data);
                if (data.OtherIncome) {
                    console.log('Other Income data found:', data.OtherIncome);
                    const formattedData = {
                        serviceEntries: data.OtherIncome.otherEntries || [],
                        royaltyEntries: data.OtherIncome.royaltyEntries || [],
                        resourceEntries: data.OtherIncome.resourceEntries || [],
                        gemEntries: data.OtherIncome.gemEntries || [],
                        otherEntries: data.OtherIncome.otherEntries || [],
                        whtEntries: data.OtherIncome.whtEntries || [],
                        selectedTypes: data.OtherIncome.selectedTypes || [],
                        totalOtherIncome: data.OtherIncome.totalOtherIncome || 0
                    };

                    // Calculate total other income
                    formattedData.totalOtherIncome = 
                        formattedData.serviceEntries.reduce((sum, entry) => sum + Number(entry.amount), 0) +
                        formattedData.royaltyEntries.reduce((sum, entry) => sum + Number(entry.amount), 0) +
                        formattedData.resourceEntries.reduce((sum, entry) => sum + Number(entry.amount), 0) +
                        formattedData.gemEntries.reduce((sum, entry) => sum + Number(entry.amount), 0) +
                        formattedData.otherEntries.reduce((sum, entry) => sum + Number(entry.amount), 0);

                    console.log('Setting new form data:', formattedData);
                    console.log('WHT entries:', formattedData.whtEntries);
                    setFormData(formattedData);
                    setShowForm(true);

                    // Update individual state variables
                    setServiceEntries(formattedData.serviceEntries);
                    setRoyaltyEntries(formattedData.royaltyEntries);
                    setResourceEntries(formattedData.resourceEntries);
                    setGemEntries(formattedData.gemEntries);
                    setOtherEntries(formattedData.otherEntries);
                    setWhtEntries(formattedData.whtEntries || []);
                    setSelectedTypes(formattedData.selectedTypes);
                    
                    // Ensure WHT checkbox is checked if WHT entries exist
                    if (formattedData.whtEntries && formattedData.whtEntries.length > 0) {
                        if (!formattedData.selectedTypes.includes('wht')) {
                            const updatedSelectedTypes = [...formattedData.selectedTypes, 'wht'];
                            setSelectedTypes(updatedSelectedTypes);
                            console.log('Auto-checked WHT checkbox');
                        }
                    }
                    
                    console.log('Updated WHT entries state:', formattedData.whtEntries);
                    console.log('Updated selected types:', formattedData.selectedTypes);
                }
            }
        };

        window.addEventListener('message', handleAutoFillUpdate);
        return () => window.removeEventListener('message', handleAutoFillUpdate);
    }, []);

    // Modify the handleSubmit function to save all state
    const handleSubmit = (e) => {
        e.preventDefault();
        
        // Save form data with all states
        const formData = {
            serviceEntries,
            royaltyEntries,
            resourceEntries,
            gemEntries,
            otherEntries,
            whtEntries,
            selectedTypes,
            totalOtherIncome,
            totalWhtDeductions
        };
        sessionStorage.setItem('otherIncomeData', JSON.stringify(formData));

        // Get next form to navigate to
        const selectedCategories = JSON.parse(sessionStorage.getItem('selectedCategories') || '[]');
        const currentIndex = selectedCategories.indexOf('other');
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
                investment: '/investment_income',
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

    const handleOpenAnalysis = () => {
        const stored = sessionStorage.getItem('last_analysis');
        setAnalysisResults(stored ? JSON.parse(stored) : []);
        setShowAnalysisResults(true);
    };

    return (
        <div className="other-income-page">
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
                    <h1 className={styles.title}>Other Income</h1>
                    <h2 className={styles.subtitle}>Select Applicable Other Income Category</h2>
                </div>

                <form className={styles.formContainer} onSubmit={handleSubmit}>
                    <div className={styles.selectionGroup}>
                        {otherIncomeTypes.map((type) => (
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

                    {selectedTypes.includes('service') && (
                        <div className={styles.section}>
                            <h3>Service Income</h3>
                            {serviceEntries.map((entry, index) => (
                                <div key={index} className={styles.entryRow}>
                                    <input
                                        type="text"
                                        value={entry.name}
                                        onChange={(e) => handleEntryChange(index, 'name', e.target.value, serviceEntries, setServiceEntries)}
                                        placeholder="Description"
                                        className={styles.inputField}
                                    />
                                    <input
                                        type="number"
                                        value={entry.amount}
                                        onChange={(e) => handleEntryChange(index, 'amount', e.target.value, serviceEntries, setServiceEntries)}
                                        placeholder="Amount"
                                        className={styles.inputField}
                                    />
                                    <button 
                                        type="button" 
                                        onClick={() => handleRemoveEntry(index, serviceEntries, setServiceEntries)}
                                        className={styles.removeButton}
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))}
                            <button 
                                type="button" 
                                onClick={() => handleAddEntry(serviceEntries, setServiceEntries)} 
                                className={styles.addButton}
                            >
                                <Plus size={16} />
                            </button>
                        </div>
                    )}

                    {selectedTypes.includes('royalty') && (
                        <div className={styles.section}>
                            <h3>Royalty Income</h3>
                            {royaltyEntries.map((entry, index) => (
                                <div key={index} className={styles.entryRow}>
                                    <input
                                        type="text"
                                        value={entry.name}
                                        onChange={(e) => handleEntryChange(index, 'name', e.target.value, royaltyEntries, setRoyaltyEntries)}
                                        placeholder="Description"
                                        className={styles.inputField}
                                    />
                                    <input
                                        type="number"
                                        value={entry.amount}
                                        onChange={(e) => handleEntryChange(index, 'amount', e.target.value, royaltyEntries, setRoyaltyEntries)}
                                        placeholder="Amount"
                                        className={styles.inputField}
                                    />
                                    <button 
                                        type="button" 
                                        onClick={() => handleRemoveEntry(index, royaltyEntries, setRoyaltyEntries)}
                                        className={styles.removeButton}
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))}
                            <button 
                                type="button" 
                                onClick={() => handleAddEntry(royaltyEntries, setRoyaltyEntries)} 
                                className={styles.addButton}
                            >
                                <Plus size={16} />
                            </button>
                        </div>
                    )}

                    {selectedTypes.includes('resource') && (
                        <div className={styles.section}>
                            <h3>Natural Resource Payment</h3>
                            {resourceEntries.map((entry, index) => (
                                <div key={index} className={styles.entryRow}>
                                    <input
                                        type="text"
                                        value={entry.name}
                                        onChange={(e) => handleEntryChange(index, 'name', e.target.value, resourceEntries, setResourceEntries)}
                                        placeholder="Description"
                                        className={styles.inputField}
                                    />
                                    <input
                                        type="number"
                                        value={entry.amount}
                                        onChange={(e) => handleEntryChange(index, 'amount', e.target.value, resourceEntries, setResourceEntries)}
                                        placeholder="Amount"
                                        className={styles.inputField}
                                    />
                                    <button 
                                        type="button" 
                                        onClick={() => handleRemoveEntry(index, resourceEntries, setResourceEntries)}
                                        className={styles.removeButton}
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))}
                            <button 
                                type="button" 
                                onClick={() => handleAddEntry(resourceEntries, setResourceEntries)} 
                                className={styles.addButton}
                            >
                                <Plus size={16} />
                            </button>
                        </div>
                    )}

                    {selectedTypes.includes('gem') && (
                        <div className={styles.section}>
                            <h3>Auctioned Gem Sale</h3>
                            {gemEntries.map((entry, index) => (
                                <div key={index} className={styles.entryRow}>
                                    <input
                                        type="text"
                                        value={entry.name}
                                        onChange={(e) => handleEntryChange(index, 'name', e.target.value, gemEntries, setGemEntries)}
                                        placeholder="Description"
                                        className={styles.inputField}
                                    />
                                    <input
                                        type="number"
                                        value={entry.amount}
                                        onChange={(e) => handleEntryChange(index, 'amount', e.target.value, gemEntries, setGemEntries)}
                                        placeholder="Amount"
                                        className={styles.inputField}
                                    />
                                    <button 
                                        type="button" 
                                        onClick={() => handleRemoveEntry(index, gemEntries, setGemEntries)}
                                        className={styles.removeButton}
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))}
                            <button 
                                type="button" 
                                onClick={() => handleAddEntry(gemEntries, setGemEntries)} 
                                className={styles.addButton}
                            >
                                <Plus size={16} />
                            </button>
                        </div>
                    )}

                    {selectedTypes.includes('other') && (
                        <div className={styles.section}>
                            <h3>Other Income</h3>
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

                    {selectedTypes.includes('wht') && (
                        <div className={styles.section}>
                            <h3>WHT Deduction</h3>
                            {whtEntries.map((entry, index) => (
                                <div key={index} className={styles.entryRow}>
                                    <input
                                        type="text"
                                        value={entry.source}
                                        onChange={(e) => handleWhtChange(index, 'source', e.target.value)}
                                        placeholder="Source"
                                        className={styles.inputField}
                                    />
                                    <input
                                        type="number"
                                        value={entry.amount}
                                        onChange={(e) => handleWhtChange(index, 'amount', e.target.value)}
                                        placeholder="Amount"
                                        className={styles.inputField}
                                    />
                                    <button 
                                        type="button" 
                                        onClick={() => handleRemoveEntry(index, whtEntries, setWhtEntries)}
                                        className={styles.removeButton}
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))}
                            <button 
                                type="button" 
                                onClick={() => handleAddEntry(whtEntries, setWhtEntries)} 
                                className={styles.addButton}
                            >
                                <Plus size={16} />
                            </button>
                        </div>
                    )}

                    <div className={styles.totalSection}>
                        <div className={styles.totalRow}>
                            <span className={styles.totalLabel}>Total Other Income:</span>
                            <span className={styles.totalAmount}>Rs. {totalOtherIncome.toLocaleString()}</span>
                        </div>
                        {selectedTypes.includes('wht') && (
                            <div className={styles.totalRow}>
                                <span className={styles.totalLabel}>Total WHT Deductions:</span>
                                <span className={styles.totalAmount}>Rs. {totalWhtDeductions.toLocaleString()}</span>
                            </div>
                        )}
                    </div>

                    <div className={styles.buttonContainer}>
                        <button type="submit" className={styles.nextButton}>Next</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default OtherIncome;