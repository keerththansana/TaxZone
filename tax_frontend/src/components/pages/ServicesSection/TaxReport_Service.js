import React from 'react';
import Header from '../../common/Header/Header';
import styles from './Service.module.css';
import taxReportImage from '../../../assets/tax_generation.png'; // Corrected image name

const TaxReport_Service = () => {
  return (
    <div className="tax-report-service-page">
      <Header />
      <div className={styles.servicePageContainer}>
        <div className={styles.serviceContentWrapper}>
          <h1 className={styles.serviceHeading}>Comprehensive Tax Report Generation</h1>
          <p className={styles.serviceSubheading}>
            Our tax report service provides detailed, accurate, and customizable reports essential for informed financial decision-making and seamless tax filing. Leveraging intelligent data aggregation, the system compiles all necessary financial information into a clear, understandable format, highlights key insights, and ensures compliance with the latest tax regulations. This comprehensive reporting functionality allows you to easily track your income, expenses, deductions, and credits, simplifying the entire tax preparation process and giving you a complete overview of your financial health for tax purposes.
          </p>
        </div>
        <div className={styles.serviceImageWrapper}>
          <img src={taxReportImage} alt="Tax Report Generation" className={styles.serviceImage} />
        </div>
      </div>
    </div>
  );
};

export default TaxReport_Service;
