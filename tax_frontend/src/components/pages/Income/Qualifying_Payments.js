import React, { useState, useEffect } from 'react';
import { ChevronDown, Plus, Trash2 } from "lucide-react";
import { useNavigate } from 'react-router-dom';
import Header from '../../common/Header/Header';
import styles from './Employment_Income.module.css';
import TaxationMenu from './Taxation_Menu';
import { useFormPersist } from './Data_Persistence';
import AnalysisResults from './AnalysisResults';
import employmentStyles from './Employment_Income.module.css';

const QualifyingPayments = () => {
    const [selectedTypes, setSelectedTypes] = useState([]);
    const [openDescription, setOpenDescription] = useState(null);
    const [donationEntries, setDonationEntries] = useState([]);
    const [samurdhiEntries, setSamurdhiEntries] = useState([]);
    const [solarEntries, setSolarEntries] = useState([]);
    const [cinemaEntries, setCinemaEntries] = useState([]);
    const [housingEntries, setHousingEntries] = useState([]);
    const [otherEntries, setOtherEntries] = useState([]);
    const [totalQualifyingPayments, setTotalQualifyingPayments] = useState(0);
    const [formData, setFormData] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [showAnalysisResults, setShowAnalysisResults] = useState(false);
    const [analysisResults, setAnalysisResults] = useState([]);
    const navigate = useNavigate();

    const paymentTypes = [
        {
            id: 'donations',
            label: 'Donations',
            description: 'Includes donations to approved charities (up to 1/3 of taxable income or Rs. 75,000) and full deductions for donations made to the government'
        },
        {
            id: 'samurdhi',
            label: 'Shop Setup for Samurdhi Beneficiary',
            description: 'Full deduction for setting up a shop for a female in a Samurdhi beneficiary family'
        },
        {
            id: 'solar',
            label: 'Solar Panel Installation',
            description: 'Deduction up to Rs. 600,000 for installing solar panels'
        },
        {
            id: 'cinema',
            label: 'Film & Cinema Industry Expenditure',
            description: 'Includes deductions for film production (min Rs. 5M), cinema upgrading (up to Rs. 10M), and construction (up to Rs. 25M)'
        },
        {
            id: 'housing',
            label: 'Low-Income Housing Construction',
            description: 'Full deduction for building houses for low-income families'
        },
        {
            id: 'other',
            label: 'Other Qualifying Payments',
            description: 'Any other qualifying payments not listed above'
        }
    ];

    useEffect(() => {
        const selectedCategories = JSON.parse(sessionStorage.getItem('selectedCategories') || '[]');
        const currentCategory = sessionStorage.getItem('currentCategory');
        
        if (!selectedCategories.includes('qualifying') || currentCategory !== 'qualifying') {
            navigate('/taxation');
        }
    }, [navigate]);

    useEffect(() => {
        const savedData = sessionStorage.getItem('qualifyingPaymentsData');
        if (savedData) {
            const parsedData = JSON.parse(savedData);
            setSelectedTypes(parsedData.selectedTypes || []);
            setDonationEntries(parsedData.donationEntries || []);
            setSamurdhiEntries(parsedData.samurdhiEntries || []);
            setSolarEntries(parsedData.solarEntries || []);
            setCinemaEntries(parsedData.cinemaEntries || []);
            setHousingEntries(parsedData.housingEntries || []);
            setOtherEntries(parsedData.otherEntries || []);
        }
    }, []);

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
                        
                        // Format the data for the qualifying payments form
                        const formattedData = {
                            donationEntries: [],
                            samurdhiEntries: [],
                            solarEntries: [],
                            cinemaEntries: [],
                            housingEntries: [],
                            otherEntries: [],
                            selectedTypes: [],
                            totalQualifyingPayments: 0
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
                                    console.log('Qualifying payment check:', { category, type, description });

                                    // Process Qualifying Payments - check both category and type
                                    const isQualifyingPayment = 
                                        (category && category.includes('qualifying')) ||
                                        (type && type.includes('qualifying')) ||
                                        (type && type.includes('donation')) ||
                                        (type && type.includes('samurdhi')) ||
                                        (type && type.includes('solar')) ||
                                        (type && type.includes('housing')) ||
                                        (description.includes('donation')) ||
                                        (description.includes('charity')) ||
                                        (description.includes('contribution')) ||
                                        (description.includes('samurdhi')) ||
                                        (description.includes('samurthy')) ||
                                        (description.includes('solar')) ||
                                        (description.includes('housing'));

                                    if (isQualifyingPayment) {
                                        // Use type field from AI analysis for more accurate categorization
                                        if (type && (type.includes('Donation') || type.includes('Donations'))) {
                                            formattedData.donationEntries.push({
                                                name: item.description || 'Donation',
                                                amount: amount.toString()
                                            });
                                            if (!formattedData.selectedTypes.includes('donations')) {
                                                formattedData.selectedTypes.push('donations');
                                            }
                                        } else if (type && (type.includes('Samurdhi') || type.includes('Shop Setup'))) {
                                            formattedData.samurdhiEntries.push({
                                                name: item.description || 'Shop Setup for Samurdhi Beneficiary',
                                                amount: amount.toString()
                                            });
                                            if (!formattedData.selectedTypes.includes('samurdhi')) {
                                                formattedData.selectedTypes.push('samurdhi');
                                            }
                                        } else if (type && type.includes('Solar')) {
                                            formattedData.solarEntries.push({
                                                name: item.description || 'Solar Panel Installation',
                                                amount: amount.toString()
                                            });
                                            if (!formattedData.selectedTypes.includes('solar')) {
                                                formattedData.selectedTypes.push('solar');
                                            }
                                        } else if (type && type.includes('Housing')) {
                                            formattedData.housingEntries.push({
                                                name: item.description || 'Low-Income Housing Construction',
                                                amount: amount.toString()
                                            });
                                            if (!formattedData.selectedTypes.includes('housing')) {
                                                formattedData.selectedTypes.push('housing');
                                            }
                                        } else if (type && (type.includes('Cinema') || type.includes('Film'))) {
                                            formattedData.cinemaEntries.push({
                                                name: item.description || 'Film & Cinema Industry Expenditure',
                                                amount: amount.toString()
                                            });
                                            if (!formattedData.selectedTypes.includes('cinema')) {
                                                formattedData.selectedTypes.push('cinema');
                                            }
                                        } else {
                                            // Fallback to description-based categorization
                                            if (description.includes('donation') || description.includes('charity')) {
                                                formattedData.donationEntries.push({
                                                    name: item.description || 'Donation',
                                                    amount: amount.toString()
                                                });
                                                if (!formattedData.selectedTypes.includes('donations')) {
                                                    formattedData.selectedTypes.push('donations');
                                                }
                                            } else if (description.includes('samurdhi') || description.includes('samurthy')) {
                                                formattedData.samurdhiEntries.push({
                                                    name: item.description || 'Shop Setup for Samurdhi Beneficiary',
                                                    amount: amount.toString()
                                                });
                                                if (!formattedData.selectedTypes.includes('samurdhi')) {
                                                    formattedData.selectedTypes.push('samurdhi');
                                                }
                                            } else if (description.includes('solar')) {
                                                formattedData.solarEntries.push({
                                                    name: item.description || 'Solar Panel Installation',
                                                    amount: amount.toString()
                                                });
                                                if (!formattedData.selectedTypes.includes('solar')) {
                                                    formattedData.selectedTypes.push('solar');
                                                }
                                            } else if (description.includes('housing')) {
                                                formattedData.housingEntries.push({
                                                    name: item.description || 'Low-Income Housing Construction',
                                                    amount: amount.toString()
                                                });
                                                if (!formattedData.selectedTypes.includes('housing')) {
                                                    formattedData.selectedTypes.push('housing');
                                                }
                                            } else if (description.includes('cinema') || description.includes('film')) {
                                                formattedData.cinemaEntries.push({
                                                    name: item.description || 'Film & Cinema Industry Expenditure',
                                                    amount: amount.toString()
                                                });
                                                if (!formattedData.selectedTypes.includes('cinema')) {
                                                    formattedData.selectedTypes.push('cinema');
                                                }
                                            } else {
                                                formattedData.otherEntries.push({
                                                    name: item.description || 'Other Qualifying Payment',
                                                    amount: amount.toString()
                                                });
                                                if (!formattedData.selectedTypes.includes('other')) {
                                                    formattedData.selectedTypes.push('other');
                                                }
                                            }
                                        }
                                    }
                                });
                            }
                        });

                        // Calculate total qualifying payments
                        formattedData.totalQualifyingPayments = 
                            formattedData.donationEntries.reduce((sum, entry) => sum + Number(entry.amount), 0) +
                            formattedData.samurdhiEntries.reduce((sum, entry) => sum + Number(entry.amount), 0) +
                            formattedData.solarEntries.reduce((sum, entry) => sum + Number(entry.amount), 0) +
                            formattedData.cinemaEntries.reduce((sum, entry) => sum + Number(entry.amount), 0) +
                            formattedData.housingEntries.reduce((sum, entry) => sum + Number(entry.amount), 0) +
                            formattedData.otherEntries.reduce((sum, entry) => sum + Number(entry.amount), 0);

                        // Only update if we have data
                        if (formattedData.donationEntries.length > 0 || 
                            formattedData.samurdhiEntries.length > 0 || 
                            formattedData.solarEntries.length > 0 || 
                            formattedData.cinemaEntries.length > 0 || 
                            formattedData.housingEntries.length > 0 || 
                            formattedData.otherEntries.length > 0) {
                            console.log('Formatted data for qualifying payments form:', formattedData);

                            // Update the form with the formatted data
                            setFormData(formattedData);
                            setShowForm(true);

                            // Update individual state variables
                            setDonationEntries(formattedData.donationEntries);
                            setSamurdhiEntries(formattedData.samurdhiEntries);
                            setSolarEntries(formattedData.solarEntries);
                            setCinemaEntries(formattedData.cinemaEntries);
                            setHousingEntries(formattedData.housingEntries);
                            setOtherEntries(formattedData.otherEntries);
                            setSelectedTypes(formattedData.selectedTypes);
                            setTotalQualifyingPayments(formattedData.totalQualifyingPayments);

                            // Store the formatted data in session storage
                            sessionStorage.setItem('qualifyingPaymentsData', JSON.stringify(formattedData));
                        } else {
                            console.log('No relevant qualifying payments data found in analysis');
                        }
                    } catch (error) {
                        console.error('Error processing stored analysis data:', error);
                        // Reset form to default state on error
                        setDonationEntries([]);
                        setSamurdhiEntries([]);
                        setSolarEntries([]);
                        setCinemaEntries([]);
                        setHousingEntries([]);
                        setOtherEntries([]);
                    }
                } else {
                    console.log('No analysis data found in session storage - using default form');
                    // Reset form to default state
                    setDonationEntries([]);
                    setSamurdhiEntries([]);
                    setSolarEntries([]);
                    setCinemaEntries([]);
                    setHousingEntries([]);
                    setOtherEntries([]);
                }
            } catch (error) {
                console.error('Error fetching auto-fill data:', error);
                // Reset form to default state on error
                setDonationEntries([]);
                setSamurdhiEntries([]);
                setSolarEntries([]);
                setCinemaEntries([]);
                setHousingEntries([]);
                setOtherEntries([]);
            }
        };

        // Check session storage first
        const storedData = sessionStorage.getItem('qualifyingPaymentsData');
        if (storedData) {
            try {
                const parsedData = JSON.parse(storedData);
                if ((parsedData.donationEntries && parsedData.donationEntries.length > 0) ||
                    (parsedData.samurdhiEntries && parsedData.samurdhiEntries.length > 0) ||
                    (parsedData.solarEntries && parsedData.solarEntries.length > 0) ||
                    (parsedData.cinemaEntries && parsedData.cinemaEntries.length > 0) ||
                    (parsedData.housingEntries && parsedData.housingEntries.length > 0) ||
                    (parsedData.otherEntries && parsedData.otherEntries.length > 0)) {
                    
                    setFormData(parsedData);
                    setShowForm(true);

                    // Update individual state variables
                    setDonationEntries(parsedData.donationEntries || []);
                    setSamurdhiEntries(parsedData.samurdhiEntries || []);
                    setSolarEntries(parsedData.solarEntries || []);
                    setCinemaEntries(parsedData.cinemaEntries || []);
                    setHousingEntries(parsedData.housingEntries || []);
                    setOtherEntries(parsedData.otherEntries || []);
                    setSelectedTypes(parsedData.selectedTypes || []);
                    setTotalQualifyingPayments(parsedData.totalQualifyingPayments || 0);
                } else {
                    // Reset to default if stored data is invalid
                    setDonationEntries([]);
                    setSamurdhiEntries([]);
                    setSolarEntries([]);
                    setCinemaEntries([]);
                    setHousingEntries([]);
                    setOtherEntries([]);
                    setSelectedTypes([]);
                    setTotalQualifyingPayments(0);
                }
            } catch (error) {
                console.error('Error parsing stored data:', error);
                // Reset to default on error
                setDonationEntries([]);
                setSamurdhiEntries([]);
                setSolarEntries([]);
                setCinemaEntries([]);
                setHousingEntries([]);
                setOtherEntries([]);
                setSelectedTypes([]);
                setTotalQualifyingPayments(0);
            }
        }

        // Then try to fetch auto-fill data
        fetchAutoFillData();

        // Listen for auto-fill data updates
        const handleAutoFillUpdate = (event) => {
            if (event.data && event.data.type === 'autoFillUpdate') {
                const data = event.data.payload;
                if (data.QualifyingPayments) {
                    const formattedData = {
                        donationEntries: data.QualifyingPayments.donationEntries || [],
                        samurdhiEntries: data.QualifyingPayments.samurdhiEntries || [],
                        solarEntries: data.QualifyingPayments.solarEntries || [],
                        cinemaEntries: data.QualifyingPayments.cinemaEntries || [],
                        housingEntries: data.QualifyingPayments.housingEntries || [],
                        otherEntries: data.QualifyingPayments.otherEntries || [],
                        selectedTypes: data.QualifyingPayments.selectedTypes || [],
                        totalQualifyingPayments: data.QualifyingPayments.totalQualifyingPayments || 0
                    };

                    // Calculate total qualifying payments
                    formattedData.totalQualifyingPayments = 
                        formattedData.donationEntries.reduce((sum, entry) => sum + Number(entry.amount), 0) +
                        formattedData.samurdhiEntries.reduce((sum, entry) => sum + Number(entry.amount), 0) +
                        formattedData.solarEntries.reduce((sum, entry) => sum + Number(entry.amount), 0) +
                        formattedData.cinemaEntries.reduce((sum, entry) => sum + Number(entry.amount), 0) +
                        formattedData.housingEntries.reduce((sum, entry) => sum + Number(entry.amount), 0) +
                        formattedData.otherEntries.reduce((sum, entry) => sum + Number(entry.amount), 0);

                    console.log('Setting new form data:', formattedData);
                    setFormData(formattedData);
                    setShowForm(true);

                    // Update individual state variables
                    setDonationEntries(formattedData.donationEntries);
                    setSamurdhiEntries(formattedData.samurdhiEntries);
                    setSolarEntries(formattedData.solarEntries);
                    setCinemaEntries(formattedData.cinemaEntries);
                    setHousingEntries(formattedData.housingEntries);
                    setOtherEntries(formattedData.otherEntries);
                    setSelectedTypes(formattedData.selectedTypes);
                    setTotalQualifyingPayments(formattedData.totalQualifyingPayments);
                }
            }
        };

        window.addEventListener('message', handleAutoFillUpdate);
        return () => window.removeEventListener('message', handleAutoFillUpdate);
    }, []);

    // Update total when entries change
    useEffect(() => {
        const total = 
            donationEntries.reduce((sum, entry) => sum + (Number(entry.amount) || 0), 0) +
            samurdhiEntries.reduce((sum, entry) => sum + (Number(entry.amount) || 0), 0) +
            solarEntries.reduce((sum, entry) => sum + (Number(entry.amount) || 0), 0) +
            cinemaEntries.reduce((sum, entry) => sum + (Number(entry.amount) || 0), 0) +
            housingEntries.reduce((sum, entry) => sum + (Number(entry.amount) || 0), 0) +
            otherEntries.reduce((sum, entry) => sum + (Number(entry.amount) || 0), 0);
        setTotalQualifyingPayments(total);
    }, [donationEntries, samurdhiEntries, solarEntries, cinemaEntries, housingEntries, otherEntries]);

    const handleTypeToggle = (typeId) => {
        setSelectedTypes(prev => {
            const newTypes = prev.includes(typeId) 
                ? prev.filter(id => id !== typeId)
                : [...prev, typeId];
            
            // Initialize entries when type is selected
            switch(typeId) {
                case 'donations':
                    if (!prev.includes(typeId)) {
                        setDonationEntries([{ name: 'Donation', amount: '' }]);
                    } else {
                        setDonationEntries([]);
                    }
                    break;
                case 'samurdhi':
                    if (!prev.includes(typeId)) {
                        setSamurdhiEntries([{ name: 'Shop Setup for Samurdhi Beneficiary', amount: '' }]);
                    } else {
                        setSamurdhiEntries([]);
                    }
                    break;
                case 'solar':
                    if (!prev.includes(typeId)) {
                        setSolarEntries([{ name: 'Solar Panel Installation', amount: '' }]);
                    } else {
                        setSolarEntries([]);
                    }
                    break;
                case 'cinema':
                    if (!prev.includes(typeId)) {
                        setCinemaEntries([{ name: 'Film & Cinema Industry Expenditure', amount: '' }]);
                    } else {
                        setCinemaEntries([]);
                    }
                    break;
                case 'housing':
                    if (!prev.includes(typeId)) {
                        setHousingEntries([{ name: 'Low-Income Housing Construction', amount: '' }]);
                    } else {
                        setHousingEntries([]);
                    }
                    break;
                case 'other':
                    if (!prev.includes(typeId)) {
                        setOtherEntries([{ name: 'Other Qualifying Payment', amount: '' }]);
                    } else {
                        setOtherEntries([]);
                    }
                    break;
            }
            
            return newTypes;
        });
    };

    const handleEntryChange = (index, field, value, type) => {
        const entries = {
            'donations': [donationEntries, setDonationEntries],
            'samurdhi': [samurdhiEntries, setSamurdhiEntries],
            'solar': [solarEntries, setSolarEntries],
            'cinema': [cinemaEntries, setCinemaEntries],
            'housing': [housingEntries, setHousingEntries],
            'other': [otherEntries, setOtherEntries]
        }[type];

        if (entries) {
            const [currentEntries, setEntries] = entries;
            const newEntries = [...currentEntries];
            newEntries[index][field] = value;
            setEntries(newEntries);
        }
    };

    const handleAddEntry = (type) => {
        const [entries, setEntries] = {
            'donations': [donationEntries, setDonationEntries],
            'samurdhi': [samurdhiEntries, setSamurdhiEntries],
            'solar': [solarEntries, setSolarEntries],
            'cinema': [cinemaEntries, setCinemaEntries],
            'housing': [housingEntries, setHousingEntries],
            'other': [otherEntries, setOtherEntries]
        }[type];

        if (entries && setEntries) {
            setEntries([...entries, { name: '', amount: '' }]);
        }
    };

    const handleRemoveEntry = (index, type) => {
        const setEntries = {
            'donations': setDonationEntries,
            'samurdhi': setSamurdhiEntries,
            'solar': setSolarEntries,
            'cinema': setCinemaEntries,
            'housing': setHousingEntries,
            'other': setOtherEntries
        }[type];

        if (setEntries) {
            setEntries(prev => prev.filter((_, i) => i !== index));
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        
        const formData = {
            selectedTypes,
            donationEntries,
            samurdhiEntries,
            solarEntries,
            cinemaEntries,
            housingEntries,
            otherEntries,
            totalQualifyingPayments
        };
        sessionStorage.setItem('qualifyingPaymentsData', JSON.stringify(formData));

        navigate('/preview');
    };

    const handleOpenAnalysis = () => {
        const stored = sessionStorage.getItem('last_analysis');
        setAnalysisResults(stored ? JSON.parse(stored) : []);
        setShowAnalysisResults(true);
    };

    return (
        <div className="qualifying-payments-page">
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
                    <h1 className={styles.title}>Qualifying Payments</h1>
                    <h2 className={styles.subtitle}>Select Applicable Qualifying Payment Categories</h2>
                </div>

                <form className={styles.formContainer} onSubmit={handleSubmit}>
                    <div className={styles.selectionGroup}>
                        {paymentTypes.map((type) => (
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

                    {selectedTypes.includes('donations') && (
                        <div className={styles.section}>
                            <h3>Donations</h3>
                            {donationEntries.map((entry, index) => (
                                <div key={index} className={styles.entryRow}>
                                    <input
                                        type="text"
                                        value={entry.name}
                                        onChange={(e) => handleEntryChange(index, 'name', e.target.value, 'donations')}
                                        placeholder="Description"
                                        className={styles.inputField}
                                    />
                                    <input
                                        type="number"
                                        value={entry.amount}
                                        onChange={(e) => handleEntryChange(index, 'amount', e.target.value, 'donations')}
                                        placeholder="Amount"
                                        className={styles.inputField}
                                    />
                                    <button 
                                        type="button" 
                                        onClick={() => handleRemoveEntry(index, 'donations')}
                                        className={styles.removeButton}
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))}
                            <button type="button" onClick={() => handleAddEntry('donations')} className={styles.addButton}>
                                <Plus size={16} />
                            </button>
                        </div>
                    )}

                    {selectedTypes.includes('cinema') && (
                        <div className={styles.section}>
                            <h3>Film & Cinema Industry Expenditure</h3>
                            {cinemaEntries.map((entry, index) => (
                                <div key={index} className={styles.entryRow}>
                                    <input
                                        type="text"
                                        value={entry.name}
                                        onChange={(e) => handleEntryChange(index, 'name', e.target.value, 'cinema')}
                                        placeholder="Description"
                                        className={styles.inputField}
                                    />
                                    <input
                                        type="number"
                                        value={entry.amount}
                                        onChange={(e) => handleEntryChange(index, 'amount', e.target.value, 'cinema')}
                                        placeholder="Amount"
                                        className={styles.inputField}
                                    />
                                    <button 
                                        type="button" 
                                        onClick={() => handleRemoveEntry(index, 'cinema')}
                                        className={styles.removeButton}
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))}
                            <button type="button" onClick={() => handleAddEntry('cinema')} className={styles.addButton}>
                                <Plus size={16} />
                            </button>
                        </div>
                    )}

                    {Object.entries({
                        'samurdhi': [samurdhiEntries, 'Shop Setup for Samurdhi Beneficiary', setSamurdhiEntries],
                        'solar': [solarEntries, 'Solar Panel Installation', setSolarEntries],
                        'housing': [housingEntries, 'Low-Income Housing Construction', setHousingEntries],
                        'other': [otherEntries, 'Other Qualifying Payments', setOtherEntries]
                    }).map(([type, [entries, title, setEntries]]) => (
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
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                ))}
                                <button 
                                    type="button" 
                                    onClick={() => handleAddEntry(type)} 
                                    className={styles.addButton}
                                >
                                    <Plus size={16} />
                                </button>
                            </div>
                        )
                    ))}
                    <div className={styles.totalSection}>
                        <div className={styles.totalRow}>
                            <span className={styles.totalLabel}>Total Qualifying Payments:</span>
                            <span className={styles.totalAmount}>Rs. {totalQualifyingPayments.toLocaleString()}</span>
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

export default QualifyingPayments;