import React from 'react';
import styles from './UploadSuccessModal.module.css';

const UploadSuccessModal = ({ filename, onClose }) => {
    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>
                <div className={styles.icon}>✓</div>
                <h3>Upload Successful</h3>
                <p>Document "{filename}" has been successfully uploaded.</p>
                <button onClick={onClose} className={styles.closeButton}>
                    OK
                </button>
            </div>
        </div>
    );
};

export default UploadSuccessModal; 