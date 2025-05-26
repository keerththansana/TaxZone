import React, { useState } from 'react';
import AnalysisResults from './AnalysisResults';

const DocumentUpload = () => {
    const [files, setFiles] = useState([]);
    const [analysisResults, setAnalysisResults] = useState(null);
    const [employmentFormData, setEmploymentFormData] = useState({});

    const handleAutoFill = (mappedData) => {
        try {
            console.log('Auto-fill data:', mappedData);
            if (mappedData.EmploymentIncome) {
                setEmploymentFormData(prev => ({
                    ...prev,
                    ...mappedData.EmploymentIncome
                }));
                // Trigger form update event
                const event = new CustomEvent('formDataUpdated', {
                    detail: mappedData.EmploymentIncome
                });
                window.dispatchEvent(event);
            }
        } catch (error) {
            console.error('Auto-fill error:', error);
        }
    };

    // ...existing upload handlers...

    return (
        <div>
            {/* ...existing upload UI... */}
            
            {analysisResults && (
                <AnalysisResults 
                    results={analysisResults}
                    onClose={() => setAnalysisResults(null)}
                    onAutoFill={handleAutoFill}
                />
            )}
        </div>
    );
};

export default DocumentUpload;