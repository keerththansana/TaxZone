import React, { useState } from 'react';
import styles from './UploadSuccessModal.module.css';

const SentMessageModel = ({ onClose }) => {
    const [hover, setHover] = useState(false);
    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>
                <div className={styles.icon}>✓</div>
                <h3>Message Sent</h3>
                <p>Your message has been sent successfully. We will get back to you soon.</p>
                <button
                    onClick={onClose}
                    className={styles.closeButton}
                    style={{
                        background: '#023636' ,
                        color: 'white',
                        border: 'none',
                        width: '25%',
                        padding: '0.75rem 0rem',
                        borderRadius: '4px',
                        fontSize: '1rem',
                        cursor: 'pointer',
                        transition: 'background-color 0.2s',
                    }}
                    onMouseEnter={() => setHover(true)}
                    onMouseLeave={() => setHover(false)}
                >
                    OK
                </button>
            </div>
        </div>
    );
};

export default SentMessageModel;
