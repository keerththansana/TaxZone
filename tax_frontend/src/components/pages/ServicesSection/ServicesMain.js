// ServicesSection.js
import React from 'react';
import taxCalculator from '../../../assets/tax_calc.png';
import taxReportImage from '../../../assets/tax_generation.png';
import aiAdvisorImage from '../../../assets/tax_assist.png';
import taxDueDateImage from '../../../assets/deadline.png';
import './ServicesSection.css';
import Button from '../../common/Button/Button';


const ServicesMain = () => {
    return (
        <section className="services-section">
            <h2>Our Services</h2><br></br>
            <div className="services-section-content">
                <div className="service-block">
                  <img src={taxCalculator} className=".service-block img" alt="Tax Calculations" />
                    <h3>Automated Tax Calculations & Smart Data Extraction</h3>
                    <p>
                        Never miss a tax deadline again! Our notification system keeps you updated:
                        <ul>
                            <li>Tax due date reminders to your email.</li>
                            <li>Calendar integration with Google Calendar to track your payment schedules.</li>
                            <li>Why This Matters:</li>
                            <li>Avoid penalties & late fees. Our system ensures you're always on time.</li>
                            <li>Relax: Ready with automated alerts & stress-free reminders.</li>
                        </ul>
                    </p>
                </div>

                <div className="service-block">
                    <img src={taxReportImage} alt="Tax Report" />
                    <h3>Tax Report Preparation in Professional Format</h3>
                    <p>
                        Never miss a tax deadline again! Our notification system keeps you updated:
                        <ul>
                            <li>Tax due date reminders to your email.</li>
                            <li>Calendar integration with Google Calendar to track your payment schedules.</li>
                            <li>Why This Matters:</li>
                            <li>Avoid penalties & late fees. Our system ensures you're always on time.</li>
                            <li>Relax: Ready with automated alerts & stress-free reminders.</li>
                        </ul>
                    </p>
                    
                </div>

                <div className="service-block">
                    <img src={aiAdvisorImage} alt="AI Advisor" />
                    <h3>AI Advisor</h3>
                    <p>
                        Taxation can be complex, but our AI-powered assistant makes it easy!
                        <ul>
                            <li>Get instant answers to your tax-related questions.</li>
                            <li>Understand Sri Lankan tax policies, deductions, and exemptions.</li>
                            <li>Personalized tax insights based on your financial data.</li>
                            <li>Chat with our AI assistant for on-demand guidance anytime.</li>
                        </ul>
                        Perfect for: Self-employed professionals, businesses, and international resident taxpayers.
                    </p>
                </div>

                <div className="service-block">
                    <img src={taxDueDateImage} alt="Tax Due Date" />
                    <h3>Tax Due Date & Confirmation Notifications</h3>
                    <p>
                        Never miss a tax deadline again! Our notification system keeps you updated:
                        <ul>
                            <li>Tax due date reminders to your email.</li>
                            <li>Calendar integration with Google Calendar to track your payment schedules.</li>
                            <li>Why This Matters:</li>
                            <li>Avoid penalties & late fees. Our system ensures you're always on time.</li>
                            <li>Relax: Ready with automated alerts & stress-free reminders.</li>
                        </ul>
                    </p>
                </div>
            </div>
        </section>
    );
};

export default ServicesMain;