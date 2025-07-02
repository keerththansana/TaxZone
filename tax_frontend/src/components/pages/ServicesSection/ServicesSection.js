import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import Header from '../../common/Header/Header';
import taxCalculator from '../../../assets/tax_cal.png';
import taxReportImage from '../../../assets/tax_generation.png';
import aiAdvisorImage from '../../../assets/tax_assist.jpg';
import taxDueDateImage from '../../../assets/deadline.png';
import './ServicesSection.css';

const ServicesSection = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();

    const handleServiceClick = (service) => {
        // Always navigate to the service main page and scroll to the section
        let sectionHash = '';
        switch(service) {
            case 'tax-report':
                sectionHash = '#tax-report';
                break;
            case 'tax-calculations':
                sectionHash = '#tax-calculations';
                break;
            case 'ai-advisor':
                sectionHash = '#ai-advisor';
                break;
            case 'tax-deadline':
                sectionHash = '#tax-deadline';
                break;
            default:
                sectionHash = '';
        }
        navigate(`/servicesMain${sectionHash}`);
    };

    return (
        <div className="services-page">
            <Header />
            <section className="services-section">
                <h2>Our Services</h2>
                <p className="services-description">
                    Discover our comprehensive suite of tax services designed to simplify your tax journey. 
                    From automated calculations to AI-powered guidance, we provide everything you need to 
                    handle your taxes with confidence and ease.
                </p>
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