import React, { useState, useCallback } from 'react';
import { ChevronDown } from "lucide-react";
import { useNavigate } from 'react-router-dom';
import styles from './Taxation.module.css';

const Taxation = () => {
    const [openCategory, setOpenCategory] = useState(null);
    const [selectedCategories, setSelectedCategories] = useState([]);
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [isDragging, setIsDragging] = useState(false);
    const [selectAll, setSelectAll] = useState(false);
    const [selectedYear, setSelectedYear] = useState('2024/2025'); // Default year
    const navigate = useNavigate();

    const handleArrowClick = (e, categoryId) => {
        e.stopPropagation();
        setOpenCategory(openCategory === categoryId ? null : categoryId);
    };

    const handleCheckboxChange = (categoryId) => {
        setSelectedCategories(prev => {
            const newSelection = prev.includes(categoryId)
                ? prev.filter(id => id !== categoryId)
                : [...prev, categoryId];
                
            // Update selectAll state based on whether all categories are selected
            setSelectAll(newSelection.length === categories.length);
            
            return newSelection;
        });
    };

    const handleFileChange = (event) => {
        const files = Array.from(event.target.files);
        setSelectedFiles(prevFiles => [...prevFiles, ...files]);
        event.target.value = ''; // Reset input for next upload
    };

    
    const removeFile = (index) => {
        setSelectedFiles(prevFiles => 
            prevFiles.filter((_, fileIndex) => fileIndex !== index)
        );
    };

    const handleDragEnter = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        const files = Array.from(e.dataTransfer.files);
        setSelectedFiles(prevFiles => [...prevFiles, ...files]);
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (selectedCategories.length === 0) {
            alert('Please select at least one category');
            return;
        }
    
        try {
            // Store selected categories
            await sessionStorage.setItem('selectedCategories', JSON.stringify(selectedCategories));
            
            // Get first selected category
            const firstCategory = selectedCategories[0];
            await sessionStorage.setItem('currentCategory', firstCategory);
    
            // Store file data
            if (selectedFiles.length > 0) {
                await sessionStorage.setItem('uploadedFiles', JSON.stringify(selectedFiles.map(f => f.name)));
            }
    
            // Navigate to first form
            const routes = {
                business: '/business_income',
                employment: '/employment_income',
                investment: '/investment_income',
                other: '/other_income',
                terminal: '/terminal_benefits',
                qualifying: '/qualifying_payments'
            };
    
            const route = routes[firstCategory];
            if (route) {
                navigate(route);
            } else {
                throw new Error(`Invalid category: ${firstCategory}`);
            }
    
        } catch (error) {
            console.error('Error processing form:', error);
            alert('An error occurred. Please try again.');
        }
    };

    const handleSelectAll = () => {
        setSelectAll(!selectAll);
        if (!selectAll) {
            // Select all categories
            setSelectedCategories(categories.map(category => category.id));
        } else {
            // Deselect all categories
            setSelectedCategories([]);
        }
    };

    const handleYearChange = (e) => {
        const newYear = e.target.value;
        setSelectedYear(newYear);
        sessionStorage.setItem('taxationYear', newYear);
        // Dispatch event to notify other components
        window.dispatchEvent(new CustomEvent('taxationYearChanged', { detail: newYear }));
    };

    const categories = [
        {
            id: 'employment',
            title: 'Employment Income',
            options: ['Primary Employment', 'Secondary Employment', 'Other Employment']
        },
        {
            id: 'business',
            title: 'Business Income',
            options: ['Sole Proprietorship', 'Partnership', 'Other Business']
        },
        {
            id: 'investment',
            title: 'Investment Income',
            options: ['Interest Income', 'Dividend Income', 'Rent Income']
        },
        {
            id: 'other',
            title: 'Other Income',
            options: ['Royalties', 'Annuities', 'Miscellaneous']
        },
        {
            id: 'terminal',
            title: 'Terminal Benefits',
            options: ['Retirement Benefits', 'Compensation', 'Gratuity']
        },
        {
            id: 'qualifying',
            title: 'Qualifying Payment',
            options: ['Donations', 'Investments', 'Other Payments']
        }
    ];

    const taxYears = [
        { value: '2024/2025', label: '2024/2025' },
        { value: '2025/2026', label: '2025/2026' }
    ];

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>Taxation</h1>
                <p className={styles.subtitle}>Select Applicable Income Taxes</p>
            </div>
            
            <form className={styles.formContainer} onSubmit={handleSubmit}>
                <div className={styles.selectAllContainer}>
                    <label className={styles.selectAllLabel}>
                        <input 
                            type="checkbox"
                            className={styles.checkbox}
                            checked={selectAll}
                            onChange={handleSelectAll}
                        />
                        <span>Select All Categories</span>
                    </label>
                    <div className={styles.yearSelectContainer}>
                        <label className={styles.yearSelectLabel}>Taxation Year:</label>
                        <select 
                            className={styles.yearSelect}
                            value={selectedYear}
                            onChange={handleYearChange}
                        >
                            {taxYears.map(year => (
                                <option key={year.value} value={year.value}>
                                    {year.label}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className={styles.categoryList}>
                    {categories.map((category) => (
                        <div key={category.id} className={styles.categoryItem}>
                            <div className={`${styles.categoryHeader} ${openCategory === category.id ? styles.active : ''}`}>
                                <div className={styles.checkboxWrapper}>
                                    <input 
                                        type="checkbox" 
                                        className={styles.checkbox}
                                        checked={selectedCategories.includes(category.id)}
                                        onChange={() => handleCheckboxChange(category.id)}
                                        onClick={(e) => e.stopPropagation()}
                                    />
                                    <span className={styles.categoryTitle}>{category.title}</span>
                                </div>
                                <div 
                                    className={styles.arrowWrapper}
                                    onClick={(e) => handleArrowClick(e, category.id)}
                                >
                                    <ChevronDown className={`${styles.arrow} ${openCategory === category.id ? styles.rotated : ''}`} />
                                </div>
                            </div>
                            
                            {openCategory === category.id && (
                                <div className={styles.optionsList}>
                                    {category.options.map((option, index) => (
                                        <div key={index} className={styles.optionItem}>
                                            <span>{option}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                <div className={styles.uploadContainer}>
                    <div
                        className={`${styles.uploadArea} ${isDragging ? styles.dragging : ''}`}
                        onDragEnter={handleDragEnter}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                    >
                        <div className={styles.uploadButtonWrapper}>
                            <input
                                type="file"
                                id="fileUpload"
                                multiple
                                webkitdirectory=""
                                directory=""
                                onChange={handleFileChange}
                                className={styles.fileInput}
                                accept="*/*"
                            />
                            <label htmlFor="fileUpload" className={styles.uploadButton}>
                                Upload Documents
                            </label>
                            <p className={styles.dragText}>or drag and drop files/folders here</p>
                        </div>

                        {selectedFiles.length > 0 && (
                            <div className={styles.fileList}>
                                {selectedFiles.map((file, index) => (
                                    <div key={index} className={styles.fileItem}>
                                        <span className={styles.fileName}>{file.name}</span>
                                        <button 
                                            onClick={() => removeFile(index)}
                                            className={styles.removeButton}
                                        >
                                            ×
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className={styles.buttonContainer}>
                    <button type="submit" className={styles.nextButton}>Next</button>
                </div>
            </form>
        </div>
    );
};

export default Taxation;