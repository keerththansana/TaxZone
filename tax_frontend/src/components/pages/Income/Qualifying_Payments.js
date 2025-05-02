import React, { useState, useEffect } from 'react';
import { ChevronDown, Plus, Trash2 } from "lucide-react";
import { useNavigate } from 'react-router-dom';
import styles from './Employment_Income.module.css';
import TaxationMenu from './Taxation_Menu';

const QualifyingPayments = () => {
    const [selectedTypes, setSelectedTypes] = useState([]);
    const [openDescription, setOpenDescription] = useState(null);
    const [donationEntries, setDonationEntries] = useState([]);
    const [samurdhiEntries, setSamurdhiEntries] = useState([]);
    const [solarEntries, setSolarEntries] = useState([]);
    const [cinemaEntries, setCinemaEntries] = useState([]);
    const [housingEntries, setHousingEntries] = useState([]);
    const [otherEntries, setOtherEntries] = useState([]);
    const [totalQualifyingPayments, setTotalQualifyingPayments] = useState(0); // Added state for total
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
        // Calculate total qualifying payments
        const donationTotal = donationEntries.reduce((sum, entry) => sum + (Number(entry.amount) || 0), 0);
        const samurdhiTotal = samurdhiEntries.reduce((sum, entry) => sum + (Number(entry.amount) || 0), 0);
        const solarTotal = solarEntries.reduce((sum, entry) => sum + (Number(entry.amount) || 0), 0);
        const cinemaTotal = cinemaEntries.reduce((sum, entry) => sum + (Number(entry.amount) || 0), 0);
        const housingTotal = housingEntries.reduce((sum, entry) => sum + (Number(entry.amount) || 0), 0);
        const otherTotal = otherEntries.reduce((sum, entry) => sum + (Number(entry.amount) || 0), 0);

        setTotalQualifyingPayments(
            donationTotal + 
            samurdhiTotal + 
            solarTotal + 
            cinemaTotal + 
            housingTotal + 
            otherTotal
        );
    }, [donationEntries, samurdhiEntries, solarEntries, cinemaEntries, housingEntries, otherEntries]);

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

    const handleTypeToggle = (typeId) => {
        setSelectedTypes(prev => {
            const newTypes = prev.includes(typeId) 
                ? prev.filter(id => id !== typeId)
                : [...prev, typeId];
            
            // Initialize entries when checkbox is selected
            if (!prev.includes(typeId)) {
                switch(typeId) {
                    case 'donations':
                        setDonationEntries([
                            { name: 'Approved Charity', amount: '' },
                            { name: 'Government Donation', amount: '' }
                        ]);
                        break;
                    case 'cinema':
                        setCinemaEntries([
                            { name: 'Film Production', amount: '' },
                            { name: 'Cinema Upgrading', amount: '' },
                            { name: 'Cinema Construction', amount: '' }
                        ]);
                        break;
                    case 'samurdhi':
                        setSamurdhiEntries([{ name: 'Samurdhi Shop Setup', amount: '' }]);
                        break;
                    case 'solar':
                        setSolarEntries([{ name: 'Solar Installation', amount: '' }]);
                        break;
                    case 'housing':
                        setHousingEntries([{ name: 'Low-Income Housing', amount: '' }]);
                        break;
                    case 'other':
                        setOtherEntries([{ name: 'Other Payment', amount: '' }]);
                        break;
                }
            } else {
                // Clear entries when checkbox is unselected
                switch(typeId) {
                    case 'donations':
                        setDonationEntries([]);
                        break;
                    case 'cinema':
                        setCinemaEntries([]);
                        break;
                    case 'samurdhi':
                        setSamurdhiEntries([]);
                        break;
                    case 'solar':
                        setSolarEntries([]);
                        break;
                    case 'housing':
                        setHousingEntries([]);
                        break;
                    case 'other':
                        setOtherEntries([]);
                        break;
                }
            }
            return newTypes;
        });
    };

    const handleEntryChange = (category, index, field, value) => {
        if (category === 'donations') {
            setDonationEntries(prev => prev.map((entry, i) => 
                i === index ? { ...entry, [field]: value } : entry
            ));
        } else if (category === 'cinema') {
            setCinemaEntries(prev => prev.map((entry, i) => 
                i === index ? { ...entry, [field]: value } : entry
            ));
        } else if (category === 'samurdhi') {
            const newEntries = [...samurdhiEntries];
            newEntries[index][field] = value;
            setSamurdhiEntries(newEntries);
        } else if (category === 'solar') {
            const newEntries = [...solarEntries];
            newEntries[index][field] = value;
            setSolarEntries(newEntries);
        } else if (category === 'housing') {
            const newEntries = [...housingEntries];
            newEntries[index][field] = value;
            setHousingEntries(newEntries);
        } else if (category === 'other') {
            const newEntries = [...otherEntries];
            newEntries[index][field] = value;
            setOtherEntries(newEntries);
        }
    };

    const handleAddEntry = (category) => {
        if (category === 'donations') {
            setDonationEntries([...donationEntries, { name: '', amount: '' }]);
        } else if (category === 'cinema') {
            setCinemaEntries([...cinemaEntries, { name: '', amount: '' }]);
        } else if (category === 'samurdhi') {
            setSamurdhiEntries([...samurdhiEntries, { name: '', amount: '' }]);
        } else if (category === 'solar') {
            setSolarEntries([...solarEntries, { name: '', amount: '' }]);
        } else if (category === 'housing') {
            setHousingEntries([...housingEntries, { name: '', amount: '' }]);
        } else if (category === 'other') {
            setOtherEntries([...otherEntries, { name: '', amount: '' }]);
        }
    };

    const handleRemoveEntry = (category, index) => {
        if (category === 'donations') {
            setDonationEntries(prev => prev.filter((_, i) => i !== index));
        } else if (category === 'cinema') {
            setCinemaEntries(prev => prev.filter((_, i) => i !== index));
        } else if (category === 'samurdhi') {
            setSamurdhiEntries(prev => prev.filter((_, i) => i !== index));
        } else if (category === 'solar') {
            setSolarEntries(prev => prev.filter((_, i) => i !== index));
        } else if (category === 'housing') {
            setHousingEntries(prev => prev.filter((_, i) => i !== index));
        } else if (category === 'other') {
            setOtherEntries(prev => prev.filter((_, i) => i !== index));
        }
    };

    const handleAddDonation = () => {
        setDonationEntries([...donationEntries, { source: '', amount: '' }]);
    };

    const handleAddCinema = () => {
        setCinemaEntries([...cinemaEntries, { source: '', amount: '' }]);
    };

    const handleDonationChange = (index, field, value) => {
        const newEntries = [...donationEntries];
        newEntries[index][field] = value;
        setDonationEntries(newEntries);
    };

    const handleCinemaChange = (index, field, value) => {
        const newEntries = [...cinemaEntries];
        newEntries[index][field] = value;
        setCinemaEntries(newEntries);
    };

    const handleRemoveDonation = (index) => {
        setDonationEntries(prev => prev.filter((_, i) => i !== index));
    };

    const handleRemoveCinema = (index) => {
        setCinemaEntries(prev => prev.filter((_, i) => i !== index));
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
        <>
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
                                        onChange={(e) => handleDonationChange(index, 'name', e.target.value)}
                                        placeholder="Description"
                                        className={styles.inputField}
                                    />
                                    <input
                                        type="number"
                                        value={entry.amount}
                                        onChange={(e) => handleDonationChange(index, 'amount', e.target.value)}
                                        placeholder="Amount"
                                        className={styles.inputField}
                                    />
                                    <button 
                                        type="button" 
                                        onClick={() => handleRemoveDonation(index)}
                                        className={styles.removeButton}
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))}
                            <button type="button" onClick={handleAddDonation} className={styles.addButton}>
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
                                        onChange={(e) => handleCinemaChange(index, 'name', e.target.value)}
                                        placeholder="Description"
                                        className={styles.inputField}
                                    />
                                    <input
                                        type="number"
                                        value={entry.amount}
                                        onChange={(e) => handleCinemaChange(index, 'amount', e.target.value)}
                                        placeholder="Amount"
                                        className={styles.inputField}
                                    />
                                    <button 
                                        type="button" 
                                        onClick={() => handleRemoveCinema(index)}
                                        className={styles.removeButton}
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))}
                            <button type="button" onClick={handleAddCinema} className={styles.addButton}>
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
                                            onChange={(e) => handleEntryChange(type, index, 'name', e.target.value)}
                                            placeholder="Description"
                                            className={styles.inputField}
                                        />
                                        <input
                                            type="number"
                                            value={entry.amount}
                                            onChange={(e) => handleEntryChange(type, index, 'amount', e.target.value)}
                                            placeholder="Amount"
                                            className={styles.inputField}
                                        />
                                        <button 
                                            type="button" 
                                            onClick={() => handleRemoveEntry(type, index)}
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
        </>
    );
};

export default QualifyingPayments;