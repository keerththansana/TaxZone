import React, { useState } from 'react';
import Header from '../../common/Header/Header';
import styles from './Contact.module.css';
import mailIcon from '../../../assets/mail.png';
import phoneIcon from '../../../assets/phone.png';
import locationIcon from '../../../assets/location.png';
import axios from 'axios';

const Contact = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        message: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const response = await axios.post('/api/users/contact/', formData);
            
            setFormData({
                name: '',
                email: '',
                phone: '',
                message: ''
            });

            alert(response.data.message || 'Thank you for your message. We will get back to you soon!');
        } catch (error) {
            console.error('Error submitting contact form:', error);
            alert(error.response?.data?.message || 'There was an error submitting your message. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="contact-page">
            <Header />
            <div className={styles.contactHeader}>
                <h2>Contact Us</h2>
                <p>
                    Ready to simplify your tax filing process? Get in touch with our expert team for personalized assistance, 
                    technical support, or any questions about our AI-powered tax platform. We're here to help you navigate 
                    Sri Lanka's tax regulations with confidence.
                </p>
            </div>
            <div className={styles.container}>
                <div className={styles.leftSection}>
                    <div className={styles.contactInfo}>
                        <h2>Get in Touch</h2>
                        <p>Have questions about our tax services? We're here to help. Our team of tax experts is ready to assist you with any inquiries about tax calculations, filing, or general tax-related matters.</p>
                        <div className={styles.infoDetails}>
                        </div>
                    </div>
                </div>
                <div className={styles.rightSection}>
                    <div className={styles.contactForm}>
                        <h2>Send us a Message</h2>
                        <form onSubmit={handleSubmit}>
                            <input 
                                type="text" 
                                name="name" 
                                placeholder="Your Full Name" 
                                value={formData.name} 
                                onChange={handleChange} 
                                required 
                                disabled={isSubmitting}
                            />
                            <input 
                                type="email" 
                                name="email" 
                                placeholder="Your Email Address" 
                                value={formData.email} 
                                onChange={handleChange} 
                                required 
                                disabled={isSubmitting}
                            />
                            <input 
                                type="tel" 
                                name="phone" 
                                placeholder="Your Phone Number" 
                                value={formData.phone} 
                                onChange={handleChange} 
                                disabled={isSubmitting}
                            />
                            <textarea 
                                name="message" 
                                placeholder="How can we help you?" 
                                value={formData.message} 
                                onChange={handleChange} 
                                required
                                disabled={isSubmitting}
                            ></textarea>
                            <button 
                                type="submit" 
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? 'Sending...' : 'Send Message'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Contact;