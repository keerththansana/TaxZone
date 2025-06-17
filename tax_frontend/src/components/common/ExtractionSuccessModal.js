import React from 'react';
import styles from './ExtractionSuccessModal.module.css';

const ExtractionSuccessModal = ({ onClose, documentCount }) => {
    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>
                <div className={styles.icon}>✓</div>
                <h3>Extraction Successful</h3>
                <p>
                    {documentCount === 1 
                        ? "Document has been successfully analyzed and extracted."
                        : `${documentCount} documents have been successfully analyzed and extracted.`
                    }
                </p>
                <p className={styles.subText}>
                    You can now review and edit the extracted information.
                </p>
                <button onClick={onClose} className={styles.closeButton}>
                    Review Results
                </button>
            </div>
        </div>
    );
};

export default ExtractionSuccessModal; 