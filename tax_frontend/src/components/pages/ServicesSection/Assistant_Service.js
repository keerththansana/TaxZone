import React from 'react';
import styles from './Service.module.css';
import taxAssistImage from '../../../assets/tax_assist.jpg'; // Assuming this is the correct image for Tax Assistant
import Header from '../../common/Header/Header';
import { useNavigate } from 'react-router-dom';
import Button from '../../common/Button/Button'; // <-- Import your Button component
import { useAuth } from '../../../contexts/AuthContext';
const Assistant_Service = () => {
  const navigate = useNavigate();
    const { isLoggedIn } = useAuth();
  
    const handleTryItNow = () => {
      if (isLoggedIn) {
        navigate('/assistant'); // Change to your actual service route
      } else {
        navigate('/login', { state: { redirectTo: '/assistant' } });
      }
    };
  return (
    <div className="assistant-service-page">
      <Header />
      <div className={styles.servicePageContainer}>
        <div className={styles.serviceContentWrapper}>
          <h1 className={styles.serviceHeading}>Your Personal AI Tax Assistant</h1>
          <p className={styles.serviceSubheading}>
            Our intelligent AI Tax Assistant provides personalized guidance and support throughout your tax journey. It leverages advanced natural language processing to understand your queries, offer real-time answers to complex tax questions, and assist with navigating regulations. The assistant helps identify eligible deductions, optimize your tax strategy, and ensures a seamless and confident filing experience. From initial data gathering to final submission, our AI assistant is designed to simplify tax complexities, reduce stress, and maximize your financial benefits, acting as your knowledgeable partner in all tax-related matters.
          </p>
          <Button 
            className="get-started-button" // Use the same class as in Hero.js for consistent styling
            onClick={handleTryItNow}
          >
            Try It Now
          </Button>
        </div>
        <div className={styles.serviceImageWrapper}>
          <img src={taxAssistImage} alt="Tax Assistant Service" className={styles.serviceImage} />
        </div>
      </div>
    </div>
  );
};

export default Assistant_Service;
