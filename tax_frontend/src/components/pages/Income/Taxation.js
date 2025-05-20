import React, { useState, useEffect, useCallback } from 'react';
import { ChevronDown } from "lucide-react";
import { useNavigate, useLocation } from 'react-router-dom';
import styles from './Taxation.module.css';
import axios from 'axios';
import CloseIcon from '@mui/icons-material/Close';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import ImageIcon from '@mui/icons-material/Image';
import DescriptionIcon from '@mui/icons-material/Description';
import ArticleIcon from '@mui/icons-material/Article';
import TableChartIcon from '@mui/icons-material/TableChart';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';

const Taxation = () => {
    // 1. First define all constants
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

    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [openCategory, setOpenCategory] = useState(null);
    const [selectedCategories, setSelectedCategories] = useState([]);
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [isDragging, setIsDragging] = useState(false);
    const [selectAll, setSelectAll] = useState(false);
    const [selectedYear, setSelectedYear] = useState('2024/2025');
    const [documents, setDocuments] = useState([]);
    const navigate = useNavigate();
    const location = useLocation();

    // Place all hooks and effects before any conditional returns
    useEffect(() => {
        // Any effects you need
        fetchSessionDocuments();
    }, []);

    const fetchSessionDocuments = async () => {
        try {
            const response = await axios.get('/api/tax-report/session-documents/', {
                withCredentials: true  // Important for session cookies
            });
            
            if (response.data.success) {
                setDocuments(response.data.documents);
            }
        } catch (error) {
            console.error('Error fetching documents:', error);
        }
    };

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
        // Validate file types
        const allowedTypes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'text/csv',
            'text/plain',
            'image/jpeg',
            'image/png'
        ];

        const validFiles = files.filter(file => 
            allowedTypes.includes(file.type) || 
            file.name.match(/\.(pdf|doc|docx|xls|xlsx|csv|txt|jpg|jpeg|png)$/i)
        );

        if (validFiles.length !== files.length) {
            alert('Some files were not added. Only PDF, Word, Excel, CSV, Text, and Image files are allowed.');
        }

        setSelectedFiles(prevFiles => [...prevFiles, ...validFiles]);
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
        const allowedTypes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'text/csv',
            'text/plain',
            'image/jpeg',
            'image/png'
        ];

        const validFiles = files.filter(file => 
            allowedTypes.includes(file.type) || 
            file.name.match(/\.(pdf|doc|docx|xls|xlsx|csv|txt|jpg|jpeg|png)$/i)
        );

        if (validFiles.length !== files.length) {
            alert('Some files were not added. Only PDF, Word, Excel, CSV, Text, and Image files are allowed.');
        }

        setSelectedFiles(prevFiles => [...prevFiles, ...validFiles]);
    }, []);

    // Add state for tracking form navigation
    const [isInternalNavigation, setIsInternalNavigation] = useState(false);

    // Modify your documents state initialization
    useEffect(() => {
        const loadDocuments = async () => {
            try {
                // Check if we're returning from internal navigation
                const returnPath = sessionStorage.getItem('taxationReturnPath');
                const isReturning = returnPath === location.pathname;

                if (!isReturning) {
                    // Clear documents if we're not returning from internal navigation
                    setDocuments([]);
                    sessionStorage.removeItem('taxationDocuments');
                } else {
                    // Load stored documents if returning from internal navigation
                    const storedDocs = sessionStorage.getItem('taxationDocuments');
                    if (storedDocs) {
                        setDocuments(JSON.parse(storedDocs));
                    }
                }
                
                // Clear the return path
                sessionStorage.removeItem('taxationReturnPath');
            } catch (error) {
                console.error('Error loading documents:', error);
            }
        };

        loadDocuments();
    }, [location.pathname]);

    // Modify your handleSubmit function
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        try {
            // Store documents in sessionStorage before navigation
            sessionStorage.setItem('taxationDocuments', JSON.stringify(documents));
            
            // Store the current path as return path
            sessionStorage.setItem('taxationReturnPath', location.pathname);

            // Your existing navigation logic
            const firstCategory = selectedCategories[0];
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
                setIsInternalNavigation(true);
                navigate(route);
            }
        } catch (error) {
            console.error('Error processing form:', error);
            alert('An error occurred. Please try again.');
        }
    };

    // Add cleanup on component unmount
    useEffect(() => {
        return () => {
            if (!isInternalNavigation) {
                // Clear stored documents if leaving the taxation flow
                sessionStorage.removeItem('taxationDocuments');
                sessionStorage.removeItem('taxationReturnPath');
            }
        };
    }, [isInternalNavigation]);

    const handleSelectAll = useCallback(() => {
        setSelectAll(!selectAll);
        if (!selectAll) {
            // Select all categories
            setSelectedCategories(categories.map(category => category.id));
        } else {
            // Deselect all categories
            setSelectedCategories([]);
        }
    }, [selectAll, categories]);

    const handleYearChange = (e) => {
        const newYear = e.target.value;
        setSelectedYear(newYear);
        sessionStorage.setItem('taxationYear', newYear);
        // Dispatch event to notify other components
        window.dispatchEvent(new CustomEvent('taxationYearChanged', { detail: newYear }));
    };

    //if (!isAuthenticated) {
    //    return <AuthPrompt service="Tax Declaration" />;
    //}

    // Update handleRemoveDocument function
    const handleRemoveDocument = async (docId) => {
        try {
            const response = await axios.delete(`/api/tax-report/remove-document/${docId}/`);
            if (response.data.success) {
                setDocuments(prev => prev.filter(doc => doc.id !== docId));
            }
        } catch (error) {
            console.error('Error removing document:', error);
            alert('Failed to remove document');
        }
    };

    // Add this function near your other handlers
    const handleDocumentClick = async (doc) => {
        try {
            // Add loading state if needed
            const response = await axios.get(`/api/tax-report/view-document/${doc.id}/`, {
                responseType: 'blob',
                headers: {
                    'Accept': '*/*'  // Accept all content types
                }
            });
            
            // Get the file extension
            const fileExtension = doc.filename.split('.').pop().toLowerCase();
            
            // Map file extensions to MIME types
            const mimeTypes = {
                'pdf': 'application/pdf',
                'doc': 'application/msword',
                'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'xls': 'application/vnd.ms-excel',
                'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'csv': 'text/csv',
                'txt': 'text/plain',
                'jpg': 'image/jpeg',
                'jpeg': 'image/jpeg',
                'png': 'image/png'
            };
            
            // Get content type and create blob
            const contentType = mimeTypes[fileExtension] || response.headers['content-type'];
            const blob = new Blob([response.data], { type: contentType });
            const url = window.URL.createObjectURL(blob);

            // Create and click a temporary link to download/open the file
            const link = document.createElement('a');
            link.href = url;
            
            // For PDFs and images, open in new tab
            if (contentType.includes('pdf') || contentType.includes('image/')) {
                link.target = '_blank';
                link.rel = 'noopener noreferrer';
            } else {
                // For other files, trigger download
                link.download = doc.filename;
            }
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            // Clean up
            setTimeout(() => {
                window.URL.revokeObjectURL(url);
            }, 100);
        } catch (error) {
            console.error('Error viewing document:', error);
            alert('Unable to open document. Please try again.');
        }
    };

    // Add this function near your other utility functions
    const getFileIcon = (filename) => {
        const extension = filename.split('.').pop().toLowerCase();
        const iconProps = {
            className: styles.fileIcon,
            'data-filetype': extension,
            sx: { fontSize: 28 }  // Slightly larger size for better visibility
        };
        
        switch (extension) {
            case 'pdf':
                return <PictureAsPdfIcon {...iconProps} />;
            case 'doc':
            case 'docx':
                return <DescriptionIcon {...iconProps} />;
            case 'xls':
            case 'xlsx':
            case 'csv':
                return <TableChartIcon {...iconProps} />;
            case 'jpg':
            case 'jpeg':
            case 'png':
                return <ImageIcon {...iconProps} />;
            case 'txt':
                return <ArticleIcon {...iconProps} />;
            default:
                return <InsertDriveFileIcon {...iconProps} />;
        }
    };

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
                                onChange={handleFileChange}
                                className={styles.fileInput}
                                accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.jpg,.jpeg,.png"
                            />
                            <label htmlFor="fileUpload" className={styles.uploadButton}>
                                Upload Documents
                            </label>
                            <p className={styles.dragText}>or drag and drop files/folders here</p>
                        </div>

                        <div className={styles.fileList}>
                            {/* Show selected files waiting to be uploaded */}
                            {selectedFiles.map((file, index) => (
                                <div key={`selected-${index}`} className={styles.fileItem}>
                                    {getFileIcon(file.name)}
                                    <span className={styles.fileName}>{file.name}</span>
                                    <button 
                                        onClick={() => removeFile(index)}
                                        className={styles.removeButton}
                                    >
                                        <CloseIcon />
                                    </button>
                                </div>
                            ))}

                            {/* Show uploaded documents */}
                            {documents.map((doc) => (
                                <div key={`uploaded-${doc.id}`} className={styles.fileItem}>
                                    <div 
                                        className={styles.fileContent}
                                        onClick={() => handleDocumentClick(doc)}
                                        onKeyPress={(e) => e.key === 'Enter' && handleDocumentClick(doc)}
                                        role="button"
                                        tabIndex={0}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        {getFileIcon(doc.filename)}
                                        <span className={styles.fileName}>{doc.filename}</span>
                                    </div>
                                    <button 
                                        type="button"
                                        className={styles.removeButton}
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            handleRemoveDocument(doc.id);
                                        }}
                                    >
                                        <CloseIcon sx={{ fontSize: 20 }} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className={styles.buttonContainer}>
                    <button 
                        type="submit" 
                        className={styles.nextButton}
                        onClick={handleSubmit}
                    >
                        Next
                    </button>
                </div>
            </form>
        </div>
    );
};

export default Taxation;