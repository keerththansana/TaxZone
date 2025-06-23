import React, { useEffect, useState } from 'react';
import Header from '../../common/Header/Header';
import Footer from '../../common/Footer/Footer';
import TaxReport_Service from './TaxReport_Service';
import Calculation_Service from './Calculation_Service';
import Assistant_Service from './Assistant_Service';
import Notification_Service from './Notification_Service';
import assistantImage from '../../../assets/Assistant.png';
import { useNavigate } from 'react-router-dom';

const ServicesMain = () => {
  useEffect(() => {
    // Always scroll to top on mount
    window.scrollTo({ top: 0, behavior: 'auto' });
    // If there is a hash, scroll to the section after a short delay
    if (window.location.hash) {
      setTimeout(() => {
        const id = window.location.hash.replace('#', '');
        const el = document.getElementById(id);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 400);
    }
  }, []);

  const navigate = useNavigate();
  const [showAssistantMsg, setShowAssistantMsg] = useState(false);

  return (
    <div className="services-main-page">
      <Header />
      <div style={{ textAlign: 'center', padding: '50px 20px 0 20px', backgroundColor: '#e8f8f8', marginBottom: 0 }}>
        <h1 style={{ fontSize: '3em', color: '#023636', marginBottom: '10px' }}>Our Services</h1>
        <p style={{ fontSize: '1.2em', color: '#555', lineHeight: '1.6', marginBottom: '20px' }}>
          Explore our comprehensive suite of services designed to simplify your tax journey.
          <br />From automated calculations to personalized assistance, we've got you covered.
        </p>
        <div id="tax-calculations">
          <Calculation_Service />
        </div>
        <div id="tax-report">
          <TaxReport_Service />
        </div>
        <div id="tax-deadline">
          <Notification_Service />
        </div>
        <div id="ai-advisor">
          <Assistant_Service />
        </div>
      </div>
      <Footer />
      {/* Floating Assistant Button */}
      <button
        className="assistant-fab"
        onClick={() => navigate('/assistant')}
        title="Chat with Assistant"
        onMouseEnter={() => setShowAssistantMsg(true)}
        onMouseLeave={() => setShowAssistantMsg(false)}
        onFocus={() => setShowAssistantMsg(true)}
        onBlur={() => setShowAssistantMsg(false)}
      >
        <img src={assistantImage} alt="Assistant" className="assistant-fab-icon" />
      </button>
      {showAssistantMsg && (
        <div className="assistant-fab-message animated-fade-in">
          I am AI Assistant. How can I help you today? <span role="img" aria-label="wave">👋</span>
        </div>
      )}
    </div>
  );
};

export default ServicesMain;
