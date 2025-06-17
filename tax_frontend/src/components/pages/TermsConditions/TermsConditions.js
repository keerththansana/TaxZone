import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../common/Header/Header';
import styles from './TermsConditions.module.css';

const TermsConditions = () => {
    const [hasAccepted, setHasAccepted] = useState(false);
    const navigate = useNavigate();

    const handleAccept = () => {
        if (hasAccepted) {
            // Store acceptance in localStorage or send to backend
            localStorage.setItem('termsAccepted', 'true');
            localStorage.setItem('termsAcceptedDate', new Date().toISOString());
            navigate('/'); // Redirect to home page
        }
    };

    const handleCancel = () => {
        navigate('/'); // Redirect to home page
    };

    const handleCheckboxChange = (e) => {
        setHasAccepted(e.target.checked);
    };

    return (
        <div className="terms-page">
            <Header />
            <div className={styles.container}>
                <div className={styles.content}>
                    <div className={styles.header}>
                        <h1>Terms and Conditions</h1>
                        <p className={styles.lastUpdated}>Last updated: {new Date().toLocaleDateString()}</p>
                    </div>

                    <div className={styles.termsContent}>
                        <section className={styles.section}>
                            <h2>1. Acceptance of Terms</h2>
                            <p>
                                By accessing and using Tax.X ("the Service"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service. These Terms and Conditions constitute a legally binding agreement between you and Tax.X regarding your use of our tax calculation and advisory platform.
                            </p>
                            <p>
                                Your continued use of the Service following the posting of any changes to these Terms constitutes acceptance of those changes. We reserve the right to modify these terms at any time, and such modifications shall be effective immediately upon posting of the modified terms on the Service.
                            </p>
                        </section>

                        <section className={styles.section}>
                            <h2>2. Description of Service</h2>
                            <p>
                                Tax.X provides comprehensive tax calculation, reporting, and advisory services for individuals and businesses operating in Sri Lanka. Our platform is designed to simplify the complex process of tax preparation and filing through advanced technology and user-friendly interfaces.
                            </p>
                            <p>
                                Our platform includes the following core services:
                            </p>
                            <ul>
                                <li><strong>Automated Tax Calculations:</strong> Advanced algorithms that compute tax liabilities based on current Sri Lankan tax laws and regulations, including income tax, VAT, and other applicable taxes.</li>
                                <li><strong>Document Processing:</strong> Secure upload and analysis of tax-related documents including payslips, bank statements, investment certificates, and business records.</li>
                                <li><strong>AI-Powered Assistance:</strong> Intelligent chatbot and virtual assistant that provides real-time guidance on tax-related queries and procedural questions.</li>
                                <li><strong>Tax Calendar Management:</strong> Automated reminders for important tax deadlines, filing dates, and payment schedules to ensure compliance.</li>
                                <li><strong>Report Generation:</strong> Professional tax reports and summaries that can be used for filing purposes or financial planning.</li>
                                <li><strong>Multi-Income Source Support:</strong> Comprehensive handling of employment income, business income, investment returns, and other income sources.</li>
                            </ul>
                        </section>

                        <section className={styles.section}>
                            <h2>3. User Responsibilities and Obligations</h2>
                            <p>
                                As a user of Tax.X, you acknowledge and agree to fulfill the following responsibilities to ensure the proper functioning of our service and maintain the integrity of the platform.
                            </p>
                            <p>
                                You agree to:
                            </p>
                            <ul>
                                <li><strong>Provide Accurate Information:</strong> Submit complete, accurate, and truthful information for all tax calculations and document uploads. This includes personal details, income sources, deductions, and any other relevant financial information.</li>
                                <li><strong>Maintain Account Security:</strong> Keep your account credentials confidential and secure. You are responsible for all activities that occur under your account, including unauthorized access.</li>
                                <li><strong>Compliance with Laws:</strong> Use the service in strict compliance with all applicable Sri Lankan tax laws, regulations, and guidelines. This includes adherence to the Inland Revenue Act and other relevant legislation.</li>
                                <li><strong>Regular Updates:</strong> Promptly update your information when there are changes to your financial circumstances, employment status, or other relevant details that may affect your tax calculations.</li>
                                <li><strong>Document Retention:</strong> Maintain proper records and documentation to support the information provided through our platform, as required by tax authorities.</li>
                                <li><strong>Professional Consultation:</strong> Seek professional tax advice for complex situations, business structures, or when you have specific concerns about your tax obligations.</li>
                            </ul>
                        </section>

                        <section className={styles.section}>
                            <h2>4. Data Privacy and Security</h2>
                            <p>
                                At Tax.X, we are committed to protecting your privacy and securing your sensitive personal and financial information. We understand the confidential nature of tax-related data and have implemented comprehensive security measures to safeguard your information.
                            </p>
                            <p>
                                <strong>Data Collection and Usage:</strong> We collect only the information necessary to provide our tax calculation services. This includes personal identification details, financial information, employment records, and tax-related documents. All data is processed in accordance with Sri Lankan data protection laws and our comprehensive Privacy Policy.
                            </p>
                            <p>
                                <strong>Security Measures:</strong> We employ industry-standard security protocols including end-to-end encryption, secure socket layer (SSL) technology, regular security audits, and secure data centers. Your information is protected during transmission and storage using advanced encryption algorithms.
                            </p>
                            <p>
                                <strong>Data Retention:</strong> We retain your information only for as long as necessary to provide our services and comply with legal obligations. You have the right to request deletion of your data, subject to legal requirements for record keeping.
                            </p>
                            <p>
                                <strong>Third-Party Access:</strong> We do not sell, trade, or otherwise transfer your personal information to third parties without your explicit consent, except as required by law or as necessary to provide our services.
                            </p>
                        </section>

                        <section className={styles.section}>
                            <h2>5. Accuracy and Reliability of Information</h2>
                            <p>
                                While Tax.X strives to provide accurate and up-to-date tax calculations and information, it is important to understand the limitations and scope of our service in relation to professional tax advice.
                            </p>
                            <p>
                                <strong>Calculation Accuracy:</strong> Our tax calculations are based on current Sri Lankan tax laws and regulations. We regularly update our algorithms to reflect changes in tax legislation, rates, and procedures. However, tax laws are complex and subject to interpretation, which may affect the accuracy of calculations in specific circumstances.
                            </p>
                            <p>
                                <strong>Not Professional Advice:</strong> Tax.X is designed to assist with tax preparation and should not be considered as professional tax advice. Our platform provides general guidance and calculations but does not replace the expertise of qualified tax professionals, especially for complex tax situations, business structures, or legal interpretations.
                            </p>
                            <p>
                                <strong>User Verification:</strong> Users are responsible for reviewing and verifying the accuracy of all calculations, information, and reports generated through our platform before filing with tax authorities. We recommend cross-checking results with official tax documentation and consulting with qualified professionals when necessary.
                            </p>
                            <p>
                                <strong>Updates and Changes:</strong> Tax laws and regulations change frequently. While we endeavor to update our system promptly, there may be delays in implementing new regulations. Users should verify that our calculations reflect the most current tax requirements.
                            </p>
                        </section>

                        <section className={styles.section}>
                            <h2>6. Limitation of Liability and Disclaimers</h2>
                            <p>
                                Tax.X and its service providers, including directors, employees, and agents, shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the service. This includes but is not limited to loss of profits, data, use, goodwill, or other intangible losses.
                            </p>
                            <p>
                                <strong>Service Availability:</strong> We strive to maintain high service availability but do not guarantee uninterrupted access to our platform. The service may be temporarily unavailable due to maintenance, technical issues, or other factors beyond our control.
                            </p>
                            <p>
                                <strong>Maximum Liability:</strong> In no event shall our total liability to you for all claims exceed the amount paid by you, if any, for accessing the service during the twelve (12) months preceding the claim.
                            </p>
                            <p>
                                <strong>Force Majeure:</strong> We shall not be liable for any failure to perform our obligations due to circumstances beyond our reasonable control, including but not limited to natural disasters, government actions, or technical failures.
                            </p>
                            <p>
                                <strong>Tax Authority Decisions:</strong> We are not responsible for decisions made by tax authorities regarding your tax returns, assessments, or any penalties or interest charges that may be imposed.
                            </p>
                        </section>

                        <section className={styles.section}>
                            <h2>7. Intellectual Property Rights</h2>
                            <p>
                                The Tax.X platform, including its original content, features, functionality, algorithms, and design, is and will remain the exclusive property of Tax.X and its licensors. The service is protected by copyright, trademark, patent, and other intellectual property laws.
                            </p>
                            <p>
                                <strong>Platform Ownership:</strong> All rights, title, and interest in and to the service, including all intellectual property rights, are and will remain the exclusive property of Tax.X. This includes but is not limited to software, algorithms, user interface designs, content, and any modifications or improvements.
                            </p>
                            <p>
                                <strong>User Content:</strong> You retain ownership of any content you submit to our platform. However, by submitting content, you grant us a non-exclusive, worldwide, royalty-free license to use, reproduce, and process your content solely for the purpose of providing our services.
                            </p>
                            <p>
                                <strong>Restrictions:</strong> You may not copy, modify, distribute, sell, or lease any part of our service without our explicit written permission. This includes reverse engineering, decompiling, or attempting to extract source code from our platform.
                            </p>
                        </section>

                        <section className={styles.section}>
                            <h2>8. Account Termination and Suspension</h2>
                            <p>
                                We reserve the right to terminate or suspend your account and access to the service immediately, without prior notice or liability, under our sole discretion, for any reason whatsoever and without limitation.
                            </p>
                            <p>
                                <strong>Grounds for Termination:</strong> Your account may be terminated for violation of these terms, fraudulent activity, providing false information, misuse of the service, or any other conduct that we deem inappropriate or harmful to our platform or other users.
                            </p>
                            <p>
                                <strong>Effect of Termination:</strong> Upon termination, your right to use the service will cease immediately. We may delete your account and all associated data, subject to legal requirements for data retention.
                            </p>
                            <p>
                                <strong>Survival of Terms:</strong> Certain provisions of these terms, including those relating to intellectual property, liability limitations, and dispute resolution, will survive termination of your account.
                            </p>
                            <p>
                                <strong>Voluntary Termination:</strong> You may terminate your account at any time by contacting our support team. Upon voluntary termination, we will process your request and delete your data in accordance with our data retention policies.
                            </p>
                        </section>

                        <section className={styles.section}>
                            <h2>9. Changes to Terms and Service</h2>
                            <p>
                                We reserve the right, at our sole discretion, to modify or replace these Terms and Conditions at any time. Changes may be made to reflect updates in our services, legal requirements, or business practices.
                            </p>
                            <p>
                                <strong>Notification of Changes:</strong> If a revision is material, we will provide at least 30 days notice prior to any new terms taking effect. We will notify users through email, in-app notifications, or by posting a prominent notice on our platform.
                            </p>
                            <p>
                                <strong>Acceptance of Changes:</strong> Your continued use of the service following the posting of any changes constitutes acceptance of those changes. If you do not agree to the new terms, you should discontinue use of the service.
                            </p>
                            <p>
                                <strong>Service Modifications:</strong> We may also modify, suspend, or discontinue any aspect of our service at any time, including the availability of certain features or content, without prior notice.
                            </p>
                            <p>
                                <strong>Historical Terms:</strong> Previous versions of these terms will be archived and available for reference. The date of the most recent update will be clearly indicated at the top of these terms.
                            </p>
                        </section>

                        <section className={styles.section}>
                            <h2>10. Contact Information and Support</h2>
                            <p>
                                If you have any questions, concerns, or need assistance regarding these Terms and Conditions or our services, we encourage you to reach out to our dedicated support team. We are committed to providing timely and helpful responses to all inquiries.
                            </p>
                            <p>
                                <strong>General Inquiries:</strong> For general questions about our services, platform features, or technical support, please contact our customer service team.
                            </p>
                            <p>
                                <strong>Legal Matters:</strong> For legal questions, privacy concerns, or issues related to these terms, please contact our legal department.
                            </p>
                            <div className={styles.contactInfo}>
                                <p><strong>Email Support:</strong> taxzone@gmail.com</p>
                                <p><strong>Phone Support:</strong> +94 710784556</p>
                                <p><strong>Business Hours:</strong> Monday - Friday, 9:00 AM - 5:00 PM </p>
                                <p><strong>Office Address:</strong> Standly Road, Jaffna, 40000.</p>
                            </div>
                            <p>
                                <strong>Response Time:</strong> We aim to respond to all inquiries within 24-48 hours during business days. For urgent matters, please indicate the urgency in your communication.
                            </p>
                        </section>
                    </div>

                    <div className={styles.actionSection}>
                        <div className={styles.checkboxContainer}>
                            <input
                                type="checkbox"
                                id="acceptTerms"
                                checked={hasAccepted}
                                onChange={handleCheckboxChange}
                                className={styles.checkbox}
                            />
                            <label htmlFor="acceptTerms" className={styles.checkboxLabel}>
                                I have read, understood, and agree to the Terms and Conditions outlined above. I acknowledge that I am legally bound by these terms and understand my rights and obligations as a user of Tax.X.
                            </label>
                        </div>
                        
                        <div className={styles.buttonContainer}>
                            <button
                                onClick={handleCancel}
                                className={`${styles.button} ${styles.cancelButton}`}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAccept}
                                disabled={!hasAccepted}
                                className={`${styles.button} ${styles.acceptButton} ${!hasAccepted ? styles.disabled : ''}`}
                            >
                                Accept Terms
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TermsConditions; 