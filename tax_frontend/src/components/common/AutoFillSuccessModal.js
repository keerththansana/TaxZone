import React from 'react';
import styles from './AutoFillSuccessModal.module.css';

const AutoFillSuccessModal = ({ onClose }) => {
    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>
                <div className={styles.icon}>✓</div>
                <h3>Auto-Fill Successful</h3>
                <p>All forms have been successfully auto-filled with the extracted information.</p>
                <p className={styles.subText}>
                    You can now review and edit the filled information in each form.
                </p>
                <button onClick={onClose} className={styles.closeButton}>
                    Continue
                </button>
            </div>
        </div>
    );
};

export default AutoFillSuccessModal; 