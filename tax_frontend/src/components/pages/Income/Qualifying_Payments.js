import React, { useState, useEffect } from 'react';
import { ChevronDown, Plus, Trash2 } from "lucide-react";
import { useNavigate } from 'react-router-dom';
import Header from '../../common/Header/Header';
import styles from './Employment_Income.module.css';
import TaxationMenu from './Taxation_Menu';
import { useFormPersist } from './Data_Persistence';

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
    const [paymentEntries, setPaymentEntries] = useState([{ name: 'Qualifying Payment', amount: '' }]);
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
                            paymentEntries: [],
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

                                    // Process Qualifying Payments
                                    if (category === 'Qualifying Payments' || 
                                        description.includes('qualifying') || 
                                        description.includes('payment') ||
                                        description.includes('donation') ||
                                        description.includes('charity') ||
                                        description.includes('contribution')) {
                                        
                                        // Determine the type of payment
                                        let paymentType = 'other';
                                        if (description.includes('donation') || description.includes('charity')) {
                                            paymentType = 'donations';
                                        } else if (description.includes('samurdhi')) {
                                            paymentType = 'samurdhi';
                                        } else if (description.includes('solar')) {
                                            paymentType = 'solar';
                                        } else if (description.includes('cinema') || description.includes('film')) {
                                            paymentType = 'cinema';
                                        } else if (description.includes('housing')) {
                                            paymentType = 'housing';
                                        }

                                        // Add to payment entries with type information
                                        formattedData.paymentEntries.push({
                                            name: item.description || 'Qualifying Payment',
                                            amount: amount.toString(),
                                            type: paymentType
                                        });
                                        
                                        // Add to selected types if not already present
                                        if (!formattedData.selectedTypes.includes(paymentType)) {
                                            formattedData.selectedTypes.push(paymentType);
                                        }
                                    }
                                });
                            }
                        });

                        // Calculate total qualifying payments
                        formattedData.totalQualifyingPayments = 
                            formattedData.paymentEntries.reduce((sum, entry) => sum + Number(entry.amount), 0);

                        // Only update if we have data
                        if (formattedData.paymentEntries.length > 0) {
                            console.log('Formatted data for qualifying payments form:', formattedData);

                            // Update the form with the formatted data
                            setFormData(formattedData);
                            setShowForm(true);

                            // Update individual state variables
                            setPaymentEntries(formattedData.paymentEntries);
                            setSelectedTypes(formattedData.selectedTypes);
                            setTotalQualifyingPayments(formattedData.totalQualifyingPayments);

                            // Update specific entry types based on the data
                            formattedData.paymentEntries.forEach(entry => {
                                switch(entry.type) {
                                    case 'donations':
                                        setDonationEntries(prev => [...prev, { name: entry.name, amount: entry.amount }]);
                                        break;
                                    case 'samurdhi':
                                        setSamurdhiEntries(prev => [...prev, { name: entry.name, amount: entry.amount }]);
                                        break;
                                    case 'solar':
                                        setSolarEntries(prev => [...prev, { name: entry.name, amount: entry.amount }]);
                                        break;
                                    case 'cinema':
                                        setCinemaEntries(prev => [...prev, { name: entry.name, amount: entry.amount }]);
                                        break;
                                    case 'housing':
                                        setHousingEntries(prev => [...prev, { name: entry.name, amount: entry.amount }]);
                                        break;
                                    case 'other':
                                        setOtherEntries(prev => [...prev, { name: entry.name, amount: entry.amount }]);
                                        break;
                                }
                            });

                            // Store the formatted data in session storage
                            sessionStorage.setItem('qualifyingPaymentsData', JSON.stringify(formattedData));
                        } else {
                            console.log('No relevant qualifying payments data found in analysis');
                            // Reset form to default state if no data found
                            setPaymentEntries([{ name: 'Qualifying Payment', amount: '' }]);
                            setSelectedTypes([]);
                            setTotalQualifyingPayments(0);
                            setDonationEntries([]);
                            setSamurdhiEntries([]);
                            setSolarEntries([]);
                            setCinemaEntries([]);
                            setHousingEntries([]);
                            setOtherEntries([]);
                        }
                    } catch (error) {
                        console.error('Error processing stored analysis data:', error);
                        // Reset form to default state on error
                        setPaymentEntries([{ name: 'Qualifying Payment', amount: '' }]);
                        setSelectedTypes([]);
                        setTotalQualifyingPayments(0);
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
                    setPaymentEntries([{ name: 'Qualifying Payment', amount: '' }]);
                    setSelectedTypes([]);
                    setTotalQualifyingPayments(0);
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
                setPaymentEntries([{ name: 'Qualifying Payment', amount: '' }]);
                setSelectedTypes([]);
                setTotalQualifyingPayments(0);
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
                if (parsedData.paymentEntries && parsedData.paymentEntries.length > 0) {
                    setFormData(parsedData);
                    setShowForm(true);

                    // Update individual state variables
                    setPaymentEntries(parsedData.paymentEntries);
                    setSelectedTypes(parsedData.selectedTypes);
                    setTotalQualifyingPayments(parsedData.totalQualifyingPayments);

                    // Update specific entry types based on the stored data
                    parsedData.paymentEntries.forEach(entry => {
                        switch(entry.type) {
                            case 'donations':
                                setDonationEntries(prev => [...prev, { name: entry.name, amount: entry.amount }]);
                                break;
                            case 'samurdhi':
                                setSamurdhiEntries(prev => [...prev, { name: entry.name, amount: entry.amount }]);
                                break;
                            case 'solar':
                                setSolarEntries(prev => [...prev, { name: entry.name, amount: entry.amount }]);
                                break;
                            case 'cinema':
                                setCinemaEntries(prev => [...prev, { name: entry.name, amount: entry.amount }]);
                                break;
                            case 'housing':
                                setHousingEntries(prev => [...prev, { name: entry.name, amount: entry.amount }]);
                                break;
                            case 'other':
                                setOtherEntries(prev => [...prev, { name: entry.name, amount: entry.amount }]);
                                break;
                        }
                    });
                } else {
                    // Reset to default if stored data is invalid
                    setPaymentEntries([{ name: 'Qualifying Payment', amount: '' }]);
                    setSelectedTypes([]);
                    setTotalQualifyingPayments(0);
                    setDonationEntries([]);
                    setSamurdhiEntries([]);
                    setSolarEntries([]);
                    setCinemaEntries([]);
                    setHousingEntries([]);
                    setOtherEntries([]);
                }
            } catch (error) {
                console.error('Error parsing stored data:', error);
                // Reset to default on error
                setPaymentEntries([{ name: 'Qualifying Payment', amount: '' }]);
                setSelectedTypes([]);
                setTotalQualifyingPayments(0);
                setDonationEntries([]);
                setSamurdhiEntries([]);
                setSolarEntries([]);
                setCinemaEntries([]);
                setHousingEntries([]);
                setOtherEntries([]);
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
                        paymentEntries: data.QualifyingPayments.paymentEntries || [],
                        selectedTypes: data.QualifyingPayments.selectedTypes || [],
                        totalQualifyingPayments: data.QualifyingPayments.totalQualifyingPayments || 0
                    };

                    // Calculate total qualifying payments
                    formattedData.totalQualifyingPayments = 
                        formattedData.paymentEntries.reduce((sum, entry) => sum + Number(entry.amount), 0);

                    console.log('Setting new form data:', formattedData);
                    setFormData(formattedData);
                    setShowForm(true);

                    // Update individual state variables
                    setPaymentEntries(formattedData.paymentEntries);
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
        const total = paymentEntries.reduce((sum, entry) => sum + (Number(entry.amount) || 0), 0);
        setTotalQualifyingPayments(total);
    }, [paymentEntries]);

    const handleTypeToggle = (typeId) => {
        setSelectedTypes(prev => {
            const newTypes = prev.includes(typeId) 
                ? prev.filter(id => id !== typeId)
                : [...prev, typeId];
            
            // Handle entry initialization
            if (typeId === 'payment') {
                if (!prev.includes('payment')) {
                    setPaymentEntries([{ name: 'Qualifying Payment', amount: '' }]);
                } else {
                    setPaymentEntries([]);
                }
            }

            return newTypes;
        });
    };

    const handleEntryChange = (index, field, value) => {
        const newEntries = [...paymentEntries];
        newEntries[index][field] = value;
        setPaymentEntries(newEntries);
    };

    const handleAddEntry = () => {
        setPaymentEntries([...paymentEntries, { name: 'Qualifying Payment', amount: '' }]);
    };

    const handleRemoveEntry = (index) => {
        setPaymentEntries(paymentEntries.filter((_, i) => i !== index));
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

    return (
        <div className="qualifying-payments-page">
            <Header />
            <TaxationMenu />
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
                                        onChange={(e) => handleEntryChange(index, 'name', e.target.value)}
                                        placeholder="Description"
                                        className={styles.inputField}
                                    />
                                    <input
                                        type="number"
                                        value={entry.amount}
                                        onChange={(e) => handleEntryChange(index, 'amount', e.target.value)}
                                        placeholder="Amount"
                                        className={styles.inputField}
                                    />
                                    <button 
                                        type="button" 
                                        onClick={() => handleRemoveEntry(index)}
                                        className={styles.removeButton}
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))}
                            <button type="button" onClick={handleAddEntry} className={styles.addButton}>
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
                                        onChange={(e) => handleEntryChange(index, 'name', e.target.value)}
                                        placeholder="Description"
                                        className={styles.inputField}
                                    />
                                    <input
                                        type="number"
                                        value={entry.amount}
                                        onChange={(e) => handleEntryChange(index, 'amount', e.target.value)}
                                        placeholder="Amount"
                                        className={styles.inputField}
                                    />
                                    <button 
                                        type="button" 
                                        onClick={() => handleRemoveEntry(index)}
                                        className={styles.removeButton}
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))}
                            <button type="button" onClick={handleAddEntry} className={styles.addButton}>
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
                                            onChange={(e) => handleEntryChange(index, 'name', e.target.value)}
                                            placeholder="Description"
                                            className={styles.inputField}
                                        />
                                        <input
                                            type="number"
                                            value={entry.amount}
                                            onChange={(e) => handleEntryChange(index, 'amount', e.target.value)}
                                            placeholder="Amount"
                                            className={styles.inputField}
                                        />
                                        <button 
                                            type="button" 
                                            onClick={() => handleRemoveEntry(index)}
                                            className={styles.removeButton}
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                ))}
                                <button 
                                    type="button" 
                                    onClick={() => handleAddEntry()} 
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