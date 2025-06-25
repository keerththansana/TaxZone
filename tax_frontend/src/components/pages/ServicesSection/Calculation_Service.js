import React from 'react';
import Header from '../../common/Header/Header';
import styles from './Service.module.css';
import taxCalcImage from '../../../assets/tax_calc.png'; // Assuming the image is in assets folder
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import Button from '../../common/Button/Button';
const Calculation_Service = () => {
  const navigate = useNavigate();
    const { isLoggedIn } = useAuth();
  
    const handleTryItNow = () => {
      if (isLoggedIn) {
        navigate('/calculator'); // Change to your actual service route
      } else {
        navigate('/login', { state: { redirectTo: '/calculator' } });
      }
    };
  return (
    <div className="calculation-service-page">
      <Header />
      <div className={styles.servicePageContainer}>
        <div className={styles.serviceImageWrapper}>
          <img src={taxCalcImage} alt="Automated Tax Calculations" className={styles.serviceImage} />
        </div>
        <div className={styles.serviceContentWrapper}>
          <h1 className={styles.serviceHeading}>Effortless Tax Calculations </h1>
          <p className={styles.serviceSubheading}>
            Our advanced tax calculation service offers automated tax computation for various taxes, intelligent data extraction from your documents, and scenario analysis for optimized financial planning. It ensures accuracy and compliance with current tax laws, helping you save time and effort, reduce errors, stay compliant, and make informed financial decisions.
          </p>
          <Button 
            className="get-started-button" // Use the same class as in Hero.js for consistent styling
            onClick={handleTryItNow}
          >
            Try It Now
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Calculation_Service;
