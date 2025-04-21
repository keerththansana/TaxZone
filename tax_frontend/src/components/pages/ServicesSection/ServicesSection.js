// ServicesSection.js
import React from 'react';
import taxCalculator from '../../../assets/tax_calc.png';
import taxReportImage from '../../../assets/tax_generation.png';
import aiAdvisorImage from '../../../assets/tax_assist.png';
import taxDueDateImage from '../../../assets/deadline.png';
import './ServicesSection.css';
import Button from '../../common/Button/Button';


const ServicesSection = () => {
    return (
        <section className="services-section">
            <h2>Our Services</h2><br></br>
            <div className="services-section-content">
                <div className="service-block">
                  <img src={taxCalculator} className=".service-block img" alt="Tax Calculations" />
                    <h3>Automated Tax Calculations & Smart Data Extraction</h3>
                    
                    <Button className="get-started-button">Read More</Button>
                </div>

                <div className="service-block">
                    <img src={taxReportImage} alt="Tax Report" />
                    <h3>Tax Report Preparation in Professional Format</h3>
                    <Button className="get-started-button">Read More</Button>
                    
                </div>

                <div className="service-block">
                    <img src={aiAdvisorImage} alt="AI Advisor" />
                    <h3>AI Advisor</h3>
                    <Button className="get-started-button">Read More</Button>
                </div>

                <div className="service-block">
                    <img src={taxDueDateImage} alt="Tax Due Date" />
                    <h3>Tax Due Date & Confirmation Notifications</h3>
                    <Button className="get-started-button">Read More</Button>
                </div>
            </div>
        </section>
    );
};

export default ServicesSection;