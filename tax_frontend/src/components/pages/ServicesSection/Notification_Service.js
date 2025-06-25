import React from 'react';
import Header from '../../common/Header/Header';
import styles from './Service.module.css';
import notificationImage from '../../../assets/deadline.png';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext'; // <-- Add this line
import Button from '../../common/Button/Button';

const Notification_Service = () => {
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();

  const handleTryItNow = () => {
    const servicePath = '/tax-calendar'; // Use your actual route
    if (isLoggedIn) {
      navigate(servicePath);
    } else {
      navigate('/login', { state: { redirectTo: '/tax-calendar' } });
    }
  };

  return (
    <div className="notification-service-page">
      <Header />
      <div className={styles.servicePageContainer}>
        <div className={styles.serviceImageWrapper}>
          <img src={notificationImage} alt="Notification System" className={styles.serviceImage} />
        </div>
        <div className={styles.serviceContentWrapper}>
          <h1 className={styles.serviceHeading}>Never miss a tax deadline again!</h1>
          <p className={styles.serviceSubheading}>
            Our comprehensive notification system ensures you're always on track with your tax obligations by providing timely email reminders for tax due dates and seamless calendar integration with Google Calendar to manage your payment schedules. This proactive approach helps you avoid penalties, late fees, and ensures a stress-free tax season with automated alerts.
          </p>
          <Button
            className="get-started-button"
            onClick={handleTryItNow}
          >
            Try It Now
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Notification_Service;
