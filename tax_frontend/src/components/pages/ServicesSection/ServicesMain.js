import React from 'react';
import Header from '../../common/Header/Header';
import TaxReport_Service from './TaxReport_Service';
import Calculation_Service from './Calculation_Service';
import Assistant_Service from './Assistant_Service';
import Notification_Service from './Notification_Service';

const ServicesMain = () => {
  return (
    <div className="services-main-page">
      <Header />
      <div style={{ textAlign: 'center', padding: '50px 20px', backgroundColor: '#e8f8f8' }}>
        <h1 style={{ fontSize: '3em', color: '#023636', marginBottom: '10px' }}>Our Services</h1>
        <p style={{ fontSize: '1.2em', color: '#555', lineHeight: '1.6', marginBottom: '20px' }}>
          Explore our comprehensive suite of services designed to simplify your tax journey.
          <br />From automated calculations to personalized assistance, we've got you covered.
        </p>
        <Calculation_Service />
        <TaxReport_Service />
        <Notification_Service />
        <Assistant_Service />
      </div>
    </div>
  );
};

export default ServicesMain;
