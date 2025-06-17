import React, { useState } from 'react';
import AnalysisResults from './AnalysisResults';
import { AutoFillHelper } from '../../../utils/autoFillHelper';

const DocumentUpload = () => {
    const [files, setFiles] = useState([]);
    const [analysisResults, setAnalysisResults] = useState(null);
    const [employmentFormData, setEmploymentFormData] = useState({});
    const [showAnalysisResults, setShowAnalysisResults] = useState(false);

    const handleAutoFill = async (results) => {
        try {
            console.log('Starting auto-fill with results:', results);
            
            // Ensure we have the correct data structure
            if (!results || !results.income_items || !results.deductions) {
                console.error('Invalid analysis results:', results);
                throw new Error('Invalid analysis results format');
            }

            // Format the data for the employment form
            const formattedData = {
                primaryEntries: [],
                secondaryEntries: [],
                apitEntries: []
            };

            // Process income items
            results.income_items.forEach(item => {
                if (item.category === 'Employment Income') {
                    formattedData.primaryEntries.push({
                        name: 'Primary Salary',
                        amount: item.amount.toString()
                    });
                }
            });

            // Process deductions
            results.deductions.forEach(deduction => {
                if (deduction.type === 'APIT') {
                    formattedData.apitEntries.push({
                        source: 'Primary Employment',
                        name: 'APIT Deduction',
                        amount: deduction.amount.toString()
                    });
                }
            });

            console.log('Formatted data for employment form:', formattedData);

            // Store the data in sessionStorage for persistence
            sessionStorage.setItem('employmentFormData', JSON.stringify(formattedData));

            // Update local state
            setEmploymentFormData(formattedData);

            // Trigger form update event with formatted data
            const event = new CustomEvent('formDataUpdated', {
                detail: formattedData
            });
            window.dispatchEvent(event);

            // Navigate to the employment form
            window.location.href = '/taxation/employment';
        } catch (error) {
            console.error('Auto-fill error:', error);
        }
    };

    const handleAnalysisComplete = (results) => {
        console.log('Analysis complete with results:', results);
        
        // Validate results structure
        if (!results || !Array.isArray(results) || results.length === 0) {
            console.error('Invalid analysis results structure:', results);
            return;
        }

        // Get the first result
        const result = results[0];
        
        // Validate result structure
        if (!result.document_type || !result.income_items || !result.deductions) {
            console.error('Invalid result structure:', result);
            return;
        }

        // Log the result details
        console.log('Processing analysis result:', {
            documentType: result.document_type,
            incomeItems: result.income_items,
            deductions: result.deductions,
            totalIncome: result.total_assessable_income
        });

        // Store the results in state
        setAnalysisResults(results);
        setShowAnalysisResults(true);

        // Store the results in localStorage for persistence
        try {
            localStorage.setItem('lastAnalysisResults', JSON.stringify(results));
        } catch (error) {
            console.error('Error storing analysis results:', error);
        }
    };

    // ...existing upload handlers...

    return (
        <div>
            {/* ...existing upload UI... */}
            
            {showAnalysisResults && (
                <AnalysisResults 
                    results={analysisResults}
                    onClose={() => setShowAnalysisResults(false)}
                    onAutoFill={handleAutoFill}
                />
            )}
        </div>
    );
};

export default DocumentUpload;