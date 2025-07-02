import React from 'react';
import styles from './CategoryAlertModal.module.css';

const CategoryAlertModal = ({ onClose }) => (
  <div className={styles.overlay}>
    <div className={styles.modal}>
      <h2>Attention</h2><br></br>
      <p>Please select at least one category of your income<br></br> to prepare your tax report.</p>
      <button className={styles.okButton} onClick={onClose}>OK</button>
    </div>
  </div>
);

export default CategoryAlertModal; 