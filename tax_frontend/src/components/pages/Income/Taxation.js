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
import AnalysisResults from './AnalysisResults'; // Import the new component

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
    const [documents, setDocuments] = useState(() => {
        const stored = sessionStorage.getItem('taxationDocuments');
        return stored ? JSON.parse(stored) : [];
    });
    const [uploadedDocuments, setUploadedDocuments] = useState(() => {
        // Initialize from session storage if available
        const stored = sessionStorage.getItem('taxationUploadedDocuments');
        return stored ? JSON.parse(stored) : [];
    });
    const [documentAnalysis, setDocumentAnalysis] = useState({});
    const [showAnalysis, setShowAnalysis] = useState(false);
    const [analysisResults, setAnalysisResults] = useState([]);
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
                withCredentials: true,
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.data.success && Array.isArray(response.data.documents)) {
                // Filter out any invalid documents
                const validDocuments = response.data.documents.filter(doc => 
                    doc && doc.id && doc.filename
                );
                setDocuments(validDocuments);
                // Update session storage with valid documents
                sessionStorage.setItem('taxationDocuments', JSON.stringify(validDocuments));
            } else {
                // If no documents or invalid response, set empty array
                setDocuments([]);
                sessionStorage.setItem('taxationDocuments', JSON.stringify([]));
            }
        } catch (error) {
            console.error('Error fetching documents:', error);
            // On error, initialize with empty array
            setDocuments([]);
            sessionStorage.setItem('taxationDocuments', JSON.stringify([]));
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

    // Add this function near the top of your component, after const categories
    const validateFiles = (files) => {
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

        return validFiles;
    };

    // Update the handleFileChange function
    const handleFileChange = async (event) => {
        try {
            const files = Array.from(event.target.files);
            const validFiles = validateFiles(files);

            for (const file of validFiles) {
                const formData = new FormData();
                formData.append('file', file);
                
                try {
                    const uploadResponse = await axios.post('/api/tax-report/upload-document/', formData, {
                        headers: {
                            'Content-Type': 'multipart/form-data'
                        },
                        withCredentials: true
                    });

                    if (!uploadResponse.data.success) {
                        console.error('Upload failed:', uploadResponse.data.error);
                        alert(`Failed to upload ${file.name}: ${uploadResponse.data.error}`);
                        continue;
                    }

                    const newDoc = uploadResponse.data.document;
                    if (!newDoc || !newDoc.doc_id) {
                        console.error('Invalid document data received from upload');
                        alert(`Invalid response received for ${file.name}`);
                        continue;
                    }

                    // Update documents state
                    setDocuments(prevDocs => {
                        const updatedDocs = [...prevDocs, {
                            id: newDoc.doc_id,
                            filename: file.name,
                            upload_date: new Date().toISOString(),
                            file_type: file.type,
                            analyzed: false
                        }];
                        sessionStorage.setItem('taxationDocuments', JSON.stringify(updatedDocs));
                        return updatedDocs;
                    });

                } catch (error) {
                    console.error('Upload failed for file:', file.name, error);
                    alert(`Failed to upload ${file.name}. Please try again.`);
                }
            }
        } catch (error) {
            console.error('File processing error:', error);
            alert('An error occurred while processing files. Please try again.');
        } finally {
            event.target.value = ''; // Reset input
        }
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
        
        if (selectedCategories.length === 0) {
            alert('Please select at least one category');
            return;
        }
        
        try {
            // Store current documents before navigation
            sessionStorage.setItem('taxationDocuments', JSON.stringify(documents));
            sessionStorage.setItem('taxationReturnPath', location.pathname);
            sessionStorage.setItem('selectedCategories', JSON.stringify(selectedCategories));
            sessionStorage.setItem('currentCategory', selectedCategories[0]);

            // Your navigation logic
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
    const handleRemoveDocument = async (event, docId) => {
        // Prevent any form submission or propagation
        event.preventDefault();
        event.stopPropagation();
        
        try {
            const response = await axios.delete(`/api/tax-report/remove-document/${docId}/`, {
                withCredentials: true
            });
            
            if (response.data.success) {
                // Update documents state with filtered documents
                const updatedDocs = documents.filter(doc => doc.id !== docId);
                setDocuments(updatedDocs);
                
                // Update session storage
                sessionStorage.setItem('taxationDocuments', JSON.stringify(updatedDocs));
            }
        } catch (error) {
            console.error('Error removing document:', error);
            alert('Failed to remove document');
        }
    };

    // Update the handleDocumentClick function
    const handleDocumentClick = async (docId) => {
        try {
            // Use the backend URL instead of frontend
            const documentUrl = `http://localhost:8000/api/tax-report/view-document/${docId}/`;
            window.open(documentUrl, '_blank');
        } catch (error) {
            console.error('Error opening document:', error);
            alert('Failed to open document. Please try again.');
        }
    };

    // Modify only the getFileIcon function
    const getFileIcon = (fileName) => {
        if (!fileName || typeof fileName !== 'string') {
            return <InsertDriveFileIcon data-filetype="default" />;
        }

        const extension = fileName.split('.').pop().toLowerCase();
        
        switch (extension) {
            case 'pdf':
                return <PictureAsPdfIcon data-filetype="pdf" />;
            case 'doc':
            case 'docx':
                return <DescriptionIcon data-filetype="doc" />;
            case 'xls':
            case 'xlsx':
            case 'csv':
                return <TableChartIcon data-filetype="excel" />;
            case 'jpg':
            case 'jpeg':
            case 'png':
                return <ImageIcon data-filetype="image" />;
            case 'txt':
                return <ArticleIcon data-filetype="txt" />;
            default:
                return <InsertDriveFileIcon data-filetype="default" />;
        }
    };

    // Add this function to your Taxation component
    const analyzeDocument = async (doc) => {
        try {
            const response = await axios.post(`/api/tax-report/analyze-document/${doc.id}/`, {
                withCredentials: true
            });
            
            if (response.data.success) {
                setDocumentAnalysis(prev => ({
                    ...prev,
                    [doc.id]: response.data.analysis
                }));
                return response.data.analysis;
            }
        } catch (error) {
            console.error('Error analyzing document:', error);
            return null;
        }
    };

    // Update the viewAnalysisResults function
    const viewAnalysisResults = async () => {
        if (!documents || documents.length === 0) {
            alert('Please upload documents first');
            return;
        }

        try {
            const results = [];
            
            // Analyze any unanalyzed documents
            for (const doc of documents) {
                if (!doc.analyzed) {
                    try {
                        const response = await axios.post(`/api/tax-report/analyze-document/${doc.id}/`, null, {
                            withCredentials: true,
                            headers: {
                                'Content-Type': 'application/json'
                            }
                        });

                        if (response.data.success) {
                            doc.analyzed = true;
                            doc.analysis = response.data.analysis;
                            setDocumentAnalysis(prev => ({
                                ...prev,
                                [doc.id]: response.data.analysis
                            }));
                        }
                    } catch (error) {
                        console.error(`Error analyzing document ${doc.filename}:`, error);
                    }
                }

                results.push({
                    filename: doc.filename,
                    analysis: doc.analysis || documentAnalysis[doc.id] || null
                });
            }

            const formattedResults = results
                .filter(result => result.analysis)
                .map(result => ({
                    filename: result.filename,
                    analysis: result.analysis
                }));

            if (formattedResults.length === 0) {
                alert('No analysis results available. Please ensure documents are properly uploaded.');
                return;
            }

            setAnalysisResults(formattedResults);
            setShowAnalysis(true);

        } catch (error) {
            console.error('Error displaying analysis:', error);
            alert('Error displaying analysis results. Please try again.');
        }
    };

    const handleReturnHome = async () => {
        try {
            await axios.post('/api/tax-report/cleanup-session/');
            // Clear all storage
            sessionStorage.removeItem('taxationDocuments');
            sessionStorage.removeItem('taxationReturnPath');
            navigate('/');
        } catch (error) {
            console.error('Error cleaning up session:', error);
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
                            {/* Display selected files waiting to be uploaded */}
                            {selectedFiles.map((file, index) => (
                                <div key={`selected-${index}`} className={styles.fileItem}>
                                    {getFileIcon(file.name)}
                                    <span className={styles.fileName}>{file.name}</span>
                                    <button 
                                        type="button"
                                        onClick={() => removeFile(index)}
                                        className={styles.removeButton}
                                    >
                                        <CloseIcon />
                                    </button>
                                </div>
                            ))}

                            {/* Display successfully uploaded documents */}
                            {documents.filter(doc => doc && doc.id && doc.filename).map((doc) => (
                                <div key={`uploaded-${doc.id}`} className={styles.fileItem}>
                                    <div 
                                        className={styles.fileContent}
                                        onClick={() => handleDocumentClick(doc.id)}
                                        data-doc-id={doc.id}
                                        role="button"
                                        tabIndex={0}
                                        style={{ 
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            flex: 1,
                                            padding: '8px',
                                            borderRadius: '4px'
                                        }}
                                    >
                                        <span className={styles.fileIcon}>
                                            {getFileIcon(doc.filename)}
                                        </span>
                                        <span className={styles.fileName}>{doc.filename}</span>
                                    </div>
                                    <button 
                                        type="button"
                                        className={styles.removeButton}
                                        onClick={(e) => handleRemoveDocument(e, doc.id)}
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
                        type="button"
                        className={styles.analysisButton}
                        onClick={viewAnalysisResults}
                        disabled={documents.length === 0}
                    >
                        Analysis
                    </button>
                    <button 
                        type="submit" 
                        className={styles.nextButton}
                    >
                        Next
                    </button>
                </div>
            </form>

            {showAnalysis && (
                <AnalysisResults 
                    results={analysisResults}
                    onClose={() => setShowAnalysis(false)}
                />
            )}
        </div>
    );
};

export default Taxation;