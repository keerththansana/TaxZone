import React from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../common/Header/Header';
import taxCalculator from '../../../assets/tax_calc.png';
import taxReportImage from '../../../assets/tax_generation.png';
import aiAdvisorImage from '../../../assets/tax_assist.png';
import taxDueDateImage from '../../../assets/deadline.png';
import './ServicesSection.css';

const ServicesSection = () => {
    const navigate = useNavigate();

    const handleServiceClick = (service) => {
        switch(service) {
            case 'tax-report':
                navigate('/tax-report-service');
                break;
            case 'tax-calculations':
                navigate('/calculator-service');  // Changed from '/calculation-service'
                break;
            case 'ai-advisor':
                navigate('/assistant-service');
                break;
            case 'tax-deadline':
                navigate('/notification-service');
                break;
            default:
                break;
        }
    };

    return (
        <div className="services-page">
            <Header />
            <section className="services-section">
                <h2>Our Services</h2>
                <div className="services-section-content">
                    <div className="service-block" onClick={() => handleServiceClick('tax-report')}>
                        <img src={taxReportImage} alt="Tax Report" />
                        <h3>Tax Report Preparation</h3>
                    </div>
                    
                    <div className="service-block" onClick={() => handleServiceClick('tax-calculations')}>
                        {/* Fixed the service name to match the switch case */}
                        <img src={taxCalculator} className="service-block-img" alt="Tax Calculations" />
                        <h3>Tax Calculations</h3>
                    </div>

                    <div className="service-block" onClick={() => handleServiceClick('ai-advisor')}>
                        <img src={aiAdvisorImage} alt="AI Advisor" />
                        <h3>AI Tax Advisor</h3>
                    </div>

                    <div className="service-block" onClick={() => handleServiceClick('tax-deadline')}>
                        <img src={taxDueDateImage} alt="Tax Due Date" />
                        <h3>Tax Deadline</h3>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default ServicesSection;