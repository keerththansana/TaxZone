import React, { useEffect, useState } from 'react';
import { AutoFillHelper } from '../../../utils/autoFillHelper';
import styles from './AnalysisResults.module.css';
import AutoFillSuccessModal from '../../common/AutoFillSuccessModal';

const AnalysisResults = ({ results, onClose, onAutoFill }) => {
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState(null);
    const [editableAmounts, setEditableAmounts] = useState({});
    const [modifiedResults, setModifiedResults] = useState([]);
    const [addingItem, setAddingItem] = useState(null);
    const [newItem, setNewItem] = useState({ description: '', amount: '', category: '', type: '' });
    const [editingItem, setEditingItem] = useState(null);
    const [editingDescription, setEditingDescription] = useState('');
    
    // Add history state for undo/redo
    const [history, setHistory] = useState([]);
    const [currentHistoryIndex, setCurrentHistoryIndex] = useState(-1);
    const [canUndo, setCanUndo] = useState(false);
    const [canRedo, setCanRedo] = useState(false);
    const [showAutoFillSuccess, setShowAutoFillSuccess] = useState(false);

    useEffect(() => {
        // Store analysis results in session storage when component mounts
        if (results && results.length > 0) {
            sessionStorage.setItem('last_analysis', JSON.stringify(results));
            console.log('Stored analysis results:', results);
        }
    }, [results]);

    // Function to generate a unique ID for each item
    const getItemId = (item, index, category, isDeduction) => {
        const prefix = isDeduction ? 'deduction' : 'income';
        const description = item.description || item.type || item.name || 'item';
        return `${prefix}-${category}-${description}-${index}`;
    };

    // Function to add a new state to history
    const addToHistory = (newState) => {
        const newHistory = history.slice(0, currentHistoryIndex + 1);
        newHistory.push({
            results: JSON.parse(JSON.stringify(newState)),
            amounts: JSON.parse(JSON.stringify(editableAmounts))
        });
        setHistory(newHistory);
        setCurrentHistoryIndex(newHistory.length - 1);
        setCanUndo(newHistory.length > 1);
        setCanRedo(false);
    };

    // Function to handle undo
    const handleUndo = () => {
        if (currentHistoryIndex > 0) {
            const newIndex = currentHistoryIndex - 1;
            const previousState = history[newIndex];
            setModifiedResults(previousState.results);
            setEditableAmounts(previousState.amounts);
            setCurrentHistoryIndex(newIndex);
            setCanUndo(newIndex > 0);
            setCanRedo(true);
        }
    };

    // Function to handle redo
    const handleRedo = () => {
        if (currentHistoryIndex < history.length - 1) {
            const newIndex = currentHistoryIndex + 1;
            const nextState = history[newIndex];
            setModifiedResults(nextState.results);
            setEditableAmounts(nextState.amounts);
            setCurrentHistoryIndex(newIndex);
            setCanUndo(true);
            setCanRedo(newIndex < history.length - 1);
        }
    };

    // Initialize history when results change
    useEffect(() => {
        if (results) {
            const initialAmounts = {};
            const initialResults = JSON.parse(JSON.stringify(results));
            
            initialResults.forEach(result => {
                if (result.analysis) {
                    // Initialize income items
                    if (result.analysis.income_items) {
                        const categorizedItems = categorizeIncomeItems(result.analysis.income_items);
                        Object.entries(categorizedItems).forEach(([category, items]) => {
                            items.forEach((item, index) => {
                                const itemId = getItemId(item, index, category, false);
                                initialAmounts[itemId] = item.amount;
                            });
                        });
                    }
                    // Initialize deductions
                    if (result.analysis.deductions) {
                        const categorizedDeductions = categorizeDeductions(result.analysis.deductions);
                        Object.entries(categorizedDeductions).forEach(([category, deductions]) => {
                            deductions.forEach((deduction, index) => {
                                const itemId = getItemId(deduction, index, category, true);
                                initialAmounts[itemId] = deduction.amount;
                            });
                        });
                    }
                }
            });
            
            setEditableAmounts(initialAmounts);
            setModifiedResults(initialResults);
            
            // Initialize history with initial state
            setHistory([{
                results: initialResults,
                amounts: initialAmounts
            }]);
            setCurrentHistoryIndex(0);
            setCanUndo(false);
            setCanRedo(false);
        }
    }, [results]);

    const handleAmountChange = (itemId, newAmount) => {
        const newAmounts = {
            ...editableAmounts,
            [itemId]: newAmount
        };
        setEditableAmounts(newAmounts);

        // Update the modified results
        const updated = JSON.parse(JSON.stringify(modifiedResults));
        
        updated.forEach(result => {
            if (result.analysis) {
                // Update income items
                if (result.analysis.income_items) {
                    const categorizedItems = categorizeIncomeItems(result.analysis.income_items);
                    Object.entries(categorizedItems).forEach(([category, items]) => {
                        items.forEach((item, index) => {
                            const currentId = getItemId(item, index, category, false);
                            if (currentId === itemId) {
                                const originalIndex = result.analysis.income_items.findIndex(i => 
                                    i.description === item.description && 
                                    i.amount === item.amount
                                );
                                if (originalIndex !== -1) {
                                    result.analysis.income_items[originalIndex].amount = Number(newAmount);
                                }
                            }
                        });
                    });
                }
                
                // Update deductions
                if (result.analysis.deductions) {
                    const categorizedDeductions = categorizeDeductions(result.analysis.deductions);
                    Object.entries(categorizedDeductions).forEach(([category, deductions]) => {
                        deductions.forEach((deduction, index) => {
                            const currentId = getItemId(deduction, index, category, true);
                            if (currentId === itemId) {
                                const originalIndex = result.analysis.deductions.findIndex(d => 
                                    d.description === deduction.description && 
                                    d.amount === deduction.amount
                                );
                                if (originalIndex !== -1) {
                                    result.analysis.deductions[originalIndex].amount = Number(newAmount);
                                }
                            }
                        });
                    });
                }
            }
        });

        setModifiedResults(updated);
        addToHistory(updated);
    };

    // Function to get the current amount (edited or original)
    const getCurrentAmount = (item, itemId) => {
        return editableAmounts[itemId] !== undefined ? editableAmounts[itemId] : item.amount;
    };

    const handleAutoFill = async () => {
        try {
            setIsProcessing(true);
            setError(null);

            const formData = {
                employmentIncome: {
                    primaryEmploymentEntries: [],
                    secondaryEmploymentEntries: [],
                    apitDeductionEntries: []
                },
                businessIncome: {
                    soleProprietorshipEntries: [],
                    partnershipEntries: [],
                    trustBeneficiaryEntries: [],
                    bettingGamingEntries: [],
                    otherBusinessEntries: []
                },
                investmentIncome: {
                    interestIncomeEntries: [],
                    dividendIncomeEntries: [],
                    rentalIncomeEntries: [],
                    capitalGainEntries: [],
                    otherInvestmentEntries: []
                },
                otherIncome: {
                    serviceIncomeEntries: [],
                    royaltyIncomeEntries: [],
                    naturalResourceEntries: [],
                    gemSaleEntries: [],
                    whtDeductionEntries: [],
                    otherIncomeEntries: []
                },
                terminalBenefits: {
                    commutedPensionEntries: [],
                    retiringGratuityEntries: [],
                    compensationEntries: [],
                    etfPaymentEntries: [],
                    otherTerminalEntries: []
                },
                qualifyingPayments: {
                    donationEntries: [],
                    solarPanelEntries: [],
                    housingConstructionEntries: [],
                    otherQualifyingEntries: []
                }
            };

            // Process income items
            modifiedResults.forEach(result => {
                if (result.analysis && result.analysis.income_items) {
                    result.analysis.income_items.forEach(item => {
                        const entry = {
                            description: item.description,
                            amount: item.amount
                        };

                        // Handle capital gains specifically
                        if (item.type === 'Capital Gains' || 
                            (item.description && item.description.toLowerCase().includes('capital gain'))) {
                            formData.investmentIncome.capitalGainEntries.push(entry);
                            return;
                        }

                        // Process other income types
                        switch (item.category) {
                            case 'Employment Income':
                                if (item.type === 'Primary Employment') {
                                    formData.employmentIncome.primaryEmploymentEntries.push(entry);
                                } else if (item.type === 'Secondary Employment') {
                                    formData.employmentIncome.secondaryEmploymentEntries.push(entry);
                                }
                                break;
                            case 'Business Income':
                                if (item.type === 'Sole Proprietorship' || item.description.includes('sole')) {
                                    formData.businessIncome.soleProprietorshipEntries.push(entry);
                                } else if (item.type === 'Partnership' || item.description.includes('partnership')) {
                                    formData.businessIncome.partnershipEntries.push(entry);
                                } else if (item.type === 'Trust Beneficiary' || item.description.includes('trust')) {
                                    formData.businessIncome.trustBeneficiaryEntries.push(entry);
                                } else if (item.type === 'Betting, Gaming, Liquor & Tobacco' || 
                                         item.description.includes('betting') || item.description.includes('gaming')) {
                                    formData.businessIncome.bettingGamingEntries.push(entry);
                                } else {
                                    formData.businessIncome.otherBusinessEntries.push(entry);
                                }
                                break;
                            case 'Investment Income':
                                if (item.type === 'Interest Income' || item.description.includes('interest')) {
                                    formData.investmentIncome.interestIncomeEntries.push(entry);
                                } else if (item.type === 'Dividend Income' || item.description.includes('dividend')) {
                                    formData.investmentIncome.dividendIncomeEntries.push(entry);
                                } else if (item.type === 'Rental Income' || item.description.includes('rent')) {
                                    formData.investmentIncome.rentalIncomeEntries.push(entry);
                                } else if (item.type === 'Capital Gains' || item.description.includes('capital') || item.description.includes('gain')) {
                                    formData.investmentIncome.capitalGainEntries.push(entry);
                                } else {
                                    formData.investmentIncome.otherInvestmentEntries.push(entry);
                                }
                                break;
                            case 'Other Income':
                                if (item.type === 'Service Income (WHT)' || item.description.includes('service')) {
                                    formData.otherIncome.serviceIncomeEntries.push(entry);
                                } else if (item.type === 'Royalty (WHT)' || item.description.includes('royalty')) {
                                    formData.otherIncome.royaltyIncomeEntries.push(entry);
                                } else if (item.type === 'Natural Resource Payment (WHT)' || item.description.includes('natural resource')) {
                                    formData.otherIncome.naturalResourceEntries.push(entry);
                                } else if (item.type === 'Auctioned Gem Sale (WHT)' || item.description.includes('gem')) {
                                    formData.otherIncome.gemSaleEntries.push(entry);
                                } else {
                                    formData.otherIncome.otherIncomeEntries.push(entry);
                                }
                                break;
                            case 'Terminal Benefits':
                                formData.terminalBenefits.commutedPensionEntries.push(entry);
                                break;
                            case 'Qualifying Payments':
                                formData.qualifyingPayments.donationEntries.push(entry);
                                break;
                            default:
                                formData.otherIncome.otherIncomeEntries.push(entry);
                        }
                    });
                }

                // Process deductions
                if (result.analysis.deductions) {
                    result.analysis.deductions.forEach(deduction => {
                        const entry = {
                            description: deduction.description,
                            amount: deduction.amount
                        };

                        // Skip capital gains entries
                        if (deduction.description.toLowerCase().includes('capital gain')) {
                            return;
                        }

                        if (deduction.type?.toLowerCase().includes('apit') || deduction.category === 'Employment Income') {
                            formData.employmentIncome.apitDeductionEntries.push(entry);
                        } else if (deduction.type?.toLowerCase().includes('wht') || deduction.category === 'Other Income') {
                            formData.otherIncome.whtDeductionEntries.push(entry);
                        }
                    });
                }
            });

            // Store the formatted data in session storage
            Object.entries(formData).forEach(([formType, data]) => {
                sessionStorage.setItem(`${formType}Data`, JSON.stringify(data));
            });

            // Store the array of results for last_analysis (for forms to parse)
            sessionStorage.setItem('last_analysis', JSON.stringify(modifiedResults));

            // Dispatch the auto-fill update event
            window.postMessage({
                type: 'autoFillUpdate',
                payload: formData
            }, '*');

            onAutoFill && onAutoFill(modifiedResults);
            
            // After successful auto-fill
            setShowAutoFillSuccess(true);
            onClose(); // Close the analysis results view
        } catch (error) {
            console.error('Error during auto-fill:', error);
            setError('Failed to auto-fill forms. Please try again.');
        } finally {
            setIsProcessing(false);
        }
    };

    const categorizeIncomeItems = (items) => {
        const categories = {
            'Employment Income': [],
            'Business Income': [],
            'Investment Income': [],
            'Other Income': [],
            'Terminal Benefits': [],
            'Qualifying Payments': []
        };

        items.forEach(item => {
            // Ensure capital gains are always categorized as Investment Income
            if (item.type === 'Capital Gains' || 
                (item.description && item.description.toLowerCase().includes('capital gain'))) {
                categories['Investment Income'].push({
                    ...item,
                    category: 'Investment Income',
                    type: 'Capital Gains'
                });
                return;
            }

            // Categorize other items based on their category
            if (categories[item.category]) {
                categories[item.category].push(item);
            } else {
                categories['Other Income'].push(item);
            }
        });

        // Remove empty categories
        Object.keys(categories).forEach(category => {
            if (categories[category].length === 0) {
                delete categories[category];
            }
        });

        return categories;
    };

    const categorizeDeductions = (deductions) => {
        const categories = {
            'Employment Income': [],
            'Other Income': [],
            'Other Deductions': []
        };

        deductions.forEach(deduction => {
            const type = deduction.type?.toLowerCase() || '';
            const description = deduction.description?.toLowerCase() || '';
            const category = deduction.category || '';

            // Skip capital gains entries as they should be income items
            if (description.includes('capital gain')) {
                return;
            }

            // Categorize based on type and category
            if (type.includes('apit') || category === 'Employment Income') {
                categories['Employment Income'].push({
                    ...deduction,
                    type: 'APIT Deduction'
                });
            } else if (type.includes('wht') || category === 'Other Income') {
                categories['Other Income'].push({
                    ...deduction,
                    type: 'WHT Deduction'
                });
            } else {
                categories['Other Deductions'].push(deduction);
            }
        });

        // Remove empty categories
        Object.keys(categories).forEach(category => {
            if (categories[category].length === 0) {
                delete categories[category];
            }
        });

        return categories;
    };

    const handleDeleteItem = (category, index, isDeduction = false) => {
        const updated = JSON.parse(JSON.stringify(modifiedResults));
        updated.forEach(result => {
            if (result.analysis) {
                if (isDeduction) {
                    if (result.analysis.deductions) {
                        const categorizedDeductions = categorizeDeductions(result.analysis.deductions);
                        if (categorizedDeductions[category] && categorizedDeductions[category][index]) {
                            const deductionToDelete = categorizedDeductions[category][index];
                            
                            // Find the original deduction in the result's deductions array
                            const originalIndex = result.analysis.deductions.findIndex(d => {
                                // Match by description and amount, ignoring type changes
                                return d.description === deductionToDelete.description && 
                                       d.amount === deductionToDelete.amount;
                            });
                            
                            if (originalIndex !== -1) {
                                const itemId = getItemId(deductionToDelete, index, category, true);
                                const newAmounts = { ...editableAmounts };
                                delete newAmounts[itemId];
                                setEditableAmounts(newAmounts);
                                result.analysis.deductions.splice(originalIndex, 1);
                            }
                        }
                    }
                } else {
                    if (result.analysis.income_items) {
                        const categorizedItems = categorizeIncomeItems(result.analysis.income_items);
                        if (categorizedItems[category] && categorizedItems[category][index]) {
                            const itemToDelete = categorizedItems[category][index];
                            const originalIndex = result.analysis.income_items.findIndex(item => 
                                item.description === itemToDelete.description && 
                                item.amount === itemToDelete.amount
                            );
                            
                            if (originalIndex !== -1) {
                                const itemId = getItemId(itemToDelete, index, category, false);
                                const newAmounts = { ...editableAmounts };
                                delete newAmounts[itemId];
                                setEditableAmounts(newAmounts);
                                result.analysis.income_items.splice(originalIndex, 1);
                            }
                        }
                    }
                }
            }
        });
        setModifiedResults(updated);
        addToHistory(updated);
    };

    const handleAddItemSubmit = (e, type, category, resultIndex) => {
        e.preventDefault();
        handleAddItem(type, category, resultIndex);
    };

    const handleAddItem = (type, category, resultIndex = 0) => {
        if (!newItem.description || !newItem.amount) {
            setError('Please fill in all fields');
            return;
        }
        const newItemWithType = {
            ...newItem,
            category: category,
            type: type === 'deduction' ?
                (category === 'Employment Income' ? 'APIT Deduction' :
                    category === 'Other Income' ? 'WHT Deduction' : 'Other Deduction') :
                newItem.type
        };
        const updated = JSON.parse(JSON.stringify(modifiedResults));
        if (updated[resultIndex] && updated[resultIndex].analysis) {
            if (type === 'income') {
                if (!updated[resultIndex].analysis.income_items) {
                    updated[resultIndex].analysis.income_items = [];
                }
                updated[resultIndex].analysis.income_items.push(newItemWithType);
            } else {
                if (!updated[resultIndex].analysis.deductions) {
                    updated[resultIndex].analysis.deductions = [];
                }
                updated[resultIndex].analysis.deductions.push(newItemWithType);
            }
        }
        setModifiedResults(updated);
        setNewItem({ description: '', amount: 0, type: '' });
        setAddingItem(null);
        addToHistory(updated);
    };

    const handleEditLabel = (itemId, currentDescription) => {
        setEditingItem(itemId);
        setEditingDescription(currentDescription);
    };

    const handleKeyPress = (e, itemId, category, index, isDeduction) => {
        if (e.key === 'Enter') {
            if (!editingDescription.trim()) {
                setError('Description cannot be empty');
                return;
            }

            const updated = JSON.parse(JSON.stringify(modifiedResults));
            updated.forEach(result => {
                if (result.analysis) {
                    if (isDeduction) {
                        if (result.analysis.deductions) {
                            const categorizedDeductions = categorizeDeductions(result.analysis.deductions);
                            if (categorizedDeductions[category] && categorizedDeductions[category][index]) {
                                const deduction = categorizedDeductions[category][index];
                                
                                // Find the original deduction in the result's deductions array
                                const originalIndex = result.analysis.deductions.findIndex(d => {
                                    // Match by description and amount, ignoring type changes
                                    return d.description === deduction.description && 
                                           d.amount === deduction.amount;
                                });
                                
                                if (originalIndex !== -1) {
                                    result.analysis.deductions[originalIndex].description = editingDescription;
                                    const newItemId = getItemId(deduction, index, category, true);
                                    const oldAmount = editableAmounts[itemId];
                                    if (oldAmount !== undefined) {
                                        const newAmounts = { ...editableAmounts };
                                        delete newAmounts[itemId];
                                        newAmounts[newItemId] = oldAmount;
                                        setEditableAmounts(newAmounts);
                                    }
                                }
                            }
                        }
                    } else {
                        if (result.analysis.income_items) {
                            const categorizedItems = categorizeIncomeItems(result.analysis.income_items);
                            if (categorizedItems[category] && categorizedItems[category][index]) {
                                const item = categorizedItems[category][index];
                                const originalIndex = result.analysis.income_items.findIndex(i => 
                                    i.description === item.description && 
                                    i.amount === item.amount
                                );
                                
                                if (originalIndex !== -1) {
                                    result.analysis.income_items[originalIndex].description = editingDescription;
                                    const newItemId = getItemId(item, index, category, false);
                                    const oldAmount = editableAmounts[itemId];
                                    if (oldAmount !== undefined) {
                                        const newAmounts = { ...editableAmounts };
                                        delete newAmounts[itemId];
                                        newAmounts[newItemId] = oldAmount;
                                        setEditableAmounts(newAmounts);
                                    }
                                }
                            }
                        }
                    }
                }
            });
            setModifiedResults(updated);
            addToHistory(updated);
            setEditingItem(null);
            setEditingDescription('');
        } else if (e.key === 'Escape') {
            setEditingItem(null);
            setEditingDescription('');
        }
    };

    const renderIncomeItems = (items, resultIndex = 0) => {
        if (!items || items.length === 0) return <p>No income items found</p>;

        const categorizedItems = categorizeIncomeItems(items);

        return Object.entries(categorizedItems).map(([category, items]) => (
            <div key={category} className={styles.categorySection}>
                <div className={styles.categoryHeader}>
                    <h4>{category}</h4>
                    <button 
                        className={styles.addCategoryButton}
                        onClick={() => setAddingItem({ category, isDeduction: false, resultIndex })}
                    >
                        + Add Item
                    </button>
                </div>
                {addingItem && addingItem.category === category && !addingItem.isDeduction && addingItem.resultIndex === resultIndex && (
                    <form className={styles.addItemForm} onSubmit={(e) => handleAddItemSubmit(e, 'income', category, resultIndex)}>
                        <select
                            value={newItem.type || ''}
                            onChange={(e) => setNewItem(prev => ({ ...prev, type: e.target.value }))}
                            className={styles.typeSelect}
                        >
                            <option value="">Select Type</option>
                            {getTypeOptions(category)}
                        </select>
                        <input
                            type="text"
                            placeholder="Description"
                            value={newItem.description}
                            onChange={(e) => setNewItem(prev => ({ ...prev, description: e.target.value }))}
                        />
                        <input
                            type="number"
                            placeholder="Amount"
                            value={newItem.amount}
                            onChange={(e) => setNewItem(prev => ({ ...prev, amount: e.target.value }))}
                            min="0"
                            step="0.01"
                        />
                        <button type="submit">Add</button>
                        <button type="button" onClick={() => setAddingItem(null)}>Cancel</button>
                    </form>
                )}
                
                {/* Table Header */}
                <div className={styles.tableHeader}>
                    <div className={styles.headerType}>Type</div>
                    <div className={styles.headerDescription}>Description</div>
                    <div className={styles.headerAmount}>Amount (Rs.)</div>
                    <div className={styles.headerActions}>Actions</div>
                </div>
                
                <ul>
                    {items.map((item, i) => {
                        const itemId = getItemId(item, i, category, false);
                        const currentAmount = getCurrentAmount(item, itemId);
                        const isEditing = editingItem === itemId;
                        
                        return (
                            <li key={i} className={isEditing ? styles.editingItem : ''}>
                                <span className={styles.itemType}>{item.type || ''}</span>
                                <span className={styles.itemDescription}>
                                    {isEditing ? (
                                        <input
                                            type="text"
                                            value={editingDescription}
                                            onChange={(e) => setEditingDescription(e.target.value)}
                                            onKeyDown={(e) => handleKeyPress(e, itemId, category, i, false)}
                                            className={styles.descriptionInput}
                                            autoFocus
                                        />
                                    ) : (
                                        <>
                                            <span>{item.description || item.name || 'Income Item'}</span>
                                            <button 
                                                className={`${styles.actionButton} ${styles.editButton}`}
                                                onClick={() => handleEditLabel(itemId, item.description || item.name || 'Income Item')}
                                                title="Edit description"
                                            >
                                                ✎
                                            </button>
                                        </>
                                    )}
                                </span>
                                <div className={styles.itemAmount}>
                                    <span>Rs. </span>
                                    <input
                                        type="number"
                                        value={currentAmount}
                                        onChange={(e) => handleAmountChange(itemId, e.target.value)}
                                        className={styles.amountInput}
                                        min="0"
                                        step="0.01"
                                    />
                                </div>
                                <div className={styles.itemActions}>
                                    <button 
                                        className={`${styles.actionButton} ${styles.deleteButton}`}
                                        onClick={() => handleDeleteItem(category, i, false)}
                                        title="Delete item"
                                    >
                                        ×
                                    </button>
                                </div>
                            </li>
                        );
                    })}
                </ul>
            </div>
        ));
    };

    const getTypeOptions = (category) => {
        switch (category) {
            case 'Employment Income':
                return [
                    <option key="primary" value="Primary Employment">Primary Employment</option>,
                    <option key="secondary" value="Secondary Employment">Secondary Employment</option>
                ];
            case 'Business Income':
                return [
                    <option key="sole" value="Sole Proprietorship">Sole Proprietorship</option>,
                    <option key="partnership" value="Partnership">Partnership</option>,
                    <option key="trust" value="Trust Beneficiary">Trust Beneficiary</option>,
                    <option key="betting" value="Betting, Gaming, Liquor & Tobacco">Betting, Gaming, Liquor & Tobacco</option>,
                    <option key="other" value="Other Business Income">Other Business Income</option>
                ];
            case 'Investment Income':
                return [
                    <option key="interest" value="Interest Income">Interest Income</option>,
                    <option key="dividend" value="Dividend Income">Dividend Income</option>,
                    <option key="rental" value="Rental Income">Rental Income</option>,
                    <option key="capital" value="Capital Gains">Capital Gains</option>,
                    <option key="other" value="Other Investment Income">Other Investment Income</option>
                ];
            case 'Other Income':
                return [
                    <option key="service" value="Service Income (WHT)">Service Income (WHT)</option>,
                    <option key="royalty" value="Royalty (WHT)">Royalty (WHT)</option>,
                    <option key="natural" value="Natural Resource Payment (WHT)">Natural Resource Payment (WHT)</option>,
                    <option key="gem" value="Auctioned Gem Sale (WHT)">Auctioned Gem Sale (WHT)</option>,
                    <option key="other" value="Other Investment Income">Other Investment Income</option>
                ];
            case 'Terminal Benefits':
                return [
                    <option key="pension" value="Commuted Pension">Commuted Pension</option>,
                    <option key="gratuity" value="Retiring Gratuity">Retiring Gratuity</option>,
                    <option key="compensation" value="Compensation for Job Loss">Compensation for Job Loss</option>,
                    <option key="etf" value="ETF Payment">ETF Payment</option>,
                    <option key="other" value="Other Terminal Benefits">Other Terminal Benefits</option>
                ];
            case 'Qualifying Payments':
                return [
                    <option key="donations" value="Donations">Donations</option>,
                    <option key="samurdhi" value="Shop Setup for Samurdhi Beneficiary">Shop Setup for Samurdhi Beneficiary</option>,
                    <option key="solar" value="Solar Panel Installation">Solar Panel Installation</option>,
                    <option key="film" value="Film & Cinema Industry Expenditure">Film & Cinema Industry Expenditure</option>,
                    <option key="housing" value="Low-Income Housing Construction">Low-Income Housing Construction</option>,
                    <option key="other" value="Other Qualifying Payments">Other Qualifying Payments</option>
                ];
            default:
                return [];
        }
    };

    const renderDeductions = (deductions, resultIndex = 0) => {
        if (!deductions || deductions.length === 0) return <p>No deductions found</p>;

        const categorizedDeductions = categorizeDeductions(deductions);

        return Object.entries(categorizedDeductions).map(([category, items]) => (
            <div key={category} className={styles.categorySection}>
                <div className={styles.categoryHeader}>
                    <h3>{category}</h3>
                    <button
                        className={styles.addCategoryButton}
                        onClick={() => setAddingItem({ category, isDeduction: true, resultIndex })}
                    >
                        Add {category} Item
                    </button>
                </div>

                {/* Table Header for Deductions */}
                <div className={styles.tableHeader}>
                    <div className={styles.headerType}>Type</div>
                    <div className={styles.headerDescription}>Description</div>
                    <div className={styles.headerAmount}>Amount (Rs.)</div>
                    <div className={styles.headerActions}>Actions</div>
                </div>

                <ul>
                    {items.map((item, index) => {
                        const itemId = getItemId(item, index, category, true);
                        const currentAmount = getCurrentAmount(item, itemId);
                        const isEditing = editingItem === itemId;
                        
                        return (
                            <li key={index} className={isEditing ? styles.editingItem : ''}>
                                <span className={styles.itemType}>{item.type || ''}</span>
                                <span className={styles.itemDescription}>
                                    {isEditing ? (
                                        <input
                                            type="text"
                                            value={editingDescription}
                                            onChange={(e) => setEditingDescription(e.target.value)}
                                            onKeyDown={(e) => handleKeyPress(e, itemId, category, index, true)}
                                            className={styles.descriptionInput}
                                            autoFocus
                                        />
                                    ) : (
                                        <>
                                            <span>{item.description || item.name || 'Deduction Item'}</span>
                                            <button 
                                                className={`${styles.actionButton} ${styles.editButton}`}
                                                onClick={() => handleEditLabel(itemId, item.description || item.name || 'Deduction Item')}
                                                title="Edit description"
                                            >
                                                ✎
                                            </button>
                                        </>
                                    )}
                                </span>
                                <div className={styles.itemAmount}>
                                    <span>Rs. </span>
                                    <input
                                        type="number"
                                        value={currentAmount}
                                        onChange={(e) => handleAmountChange(itemId, e.target.value)}
                                        className={styles.amountInput}
                                        min="0"
                                        step="0.01"
                                    />
                                </div>
                                <div className={styles.itemActions}>
                                    <button 
                                        className={`${styles.actionButton} ${styles.deleteButton}`}
                                        onClick={() => handleDeleteItem(category, index, true)}
                                        title="Delete item"
                                    >
                                        ×
                                    </button>
                                </div>
                            </li>
                        );
                    })}
                </ul>

                {addingItem?.type === 'deduction' && addingItem?.category === category && addingItem?.resultIndex === resultIndex && (
                    <form className={styles.addItemForm} onSubmit={(e) => handleAddItemSubmit(e, 'deduction', category, resultIndex)}>
                        <select
                            value={newItem.type || ''}
                            onChange={(e) => setNewItem(prev => ({ ...prev, type: e.target.value }))}
                            className={styles.typeSelect}
                        >
                            <option value="">Select Type</option>
                            <option value="APIT Deduction">APIT Deduction</option>
                            <option value="WHT Deduction">WHT Deduction</option>
                            <option value="Other Deduction">Other Deduction</option>
                        </select>
                        <input
                            type="text"
                            placeholder="Description"
                            value={newItem.description}
                            onChange={(e) => setNewItem(prev => ({ ...prev, description: e.target.value }))}
                        />
                        <input
                            type="number"
                            placeholder="Amount"
                            value={newItem.amount}
                            onChange={(e) => setNewItem(prev => ({ ...prev, amount: e.target.value }))}
                            min="0"
                            step="0.01"
                        />
                        <button type="submit">Add</button>
                        <button type="button" onClick={() => setAddingItem(null)}>Cancel</button>
                    </form>
                )}
            </div>
        ));
    };

    const getDocumentTypeIcon = (documentType) => {
        const type = (documentType || '').toLowerCase();
        if (type.includes('payslip') || type.includes('salary')) return '';
        if (type.includes('business') || type.includes('invoice')) return '';
        if (type.includes('investment') || type.includes('bank')) return '';
        if (type.includes('tax') || type.includes('return')) return '';
        return '';
    };

    return (
        <div className={styles.overlay}>
            <div className={styles.container}>
                <div className={styles.header}>
                    <h1>Tax Document Analysis Results</h1>
                    <div className={styles.headerActions}>
                        <button 
                            onClick={handleUndo} 
                            className={`${styles.actionButton} ${styles.undoButton}`}
                            disabled={!canUndo}
                            title="Undo"
                        >
                            ↶
                        </button>
                        <button 
                            onClick={handleRedo} 
                            className={`${styles.actionButton} ${styles.redoButton}`}
                            disabled={!canRedo}
                            title="Redo"
                        >
                            ↷
                        </button>
                        <button onClick={onClose} className={styles.closeButton}>×</button>
                    </div>
                </div>
                <div className={styles.content}>
                    {error && <div className={styles.error}>{error}</div>}
                    {modifiedResults.map((result, index) => (
                        <div key={index} className={styles.resultCard}>
                            <h2>
                                {getDocumentTypeIcon(result.analysis?.document_type)} {result.filename}
                            </h2>
                            {result.error ? (
                                <div className={styles.error}>{result.error}</div>
                            ) : (
                                <div className={styles.analysis}>
                                    <div className={styles.section}>
                                        <h3>Document Type</h3>
                                        <p>{result.analysis.document_type || 'Unknown'}</p>
                                    </div>

                                    <div className={styles.section}>
                                        <h3>Income Items</h3>
                                        {renderIncomeItems(result.analysis.income_items, index)}
                                    </div>

                                    <div className={styles.section}>
                                        <h3>Deductions</h3>
                                        {renderDeductions(result.analysis.deductions, index)}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
                <div className={styles.footer}>
                    <button 
                        className={styles.autoFillButton}
                        onClick={handleAutoFill}
                        disabled={isProcessing}
                    >
                        {isProcessing ? ' Processing...' : ' Auto-Fill Forms'}
                    </button>
                </div>
            </div>
            {showAutoFillSuccess && (
                <AutoFillSuccessModal onClose={() => setShowAutoFillSuccess(false)} />
            )}
        </div>
    );
};

export default AnalysisResults;