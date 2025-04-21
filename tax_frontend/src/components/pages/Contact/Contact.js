import React, { useState } from 'react';
import styles from './Contact.module.css'; // Import the CSS module
import mailIcon from '../../../assets/mail.png';
import phoneIcon from '../../../assets/phone.png';
import locationIcon from '../../../assets/location.png';
import websiteIcon from '../../../assets/website.png'; // Fixed filename typo

const Contact = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        message: ''
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log(formData);
        
        setFormData({
            name: '',
            email: '',
            phone: '',
            message: ''
        });

        alert('Form submitted successfully!');
    };

    return (
        <div className={styles.container}>
            <div className={styles.leftSection}>
                <div className={styles.contactInfo}>
                    <h2>Contact Us</h2>
                    <p>Whether you have questions about our services, need support, or want to share your feedback, our dedicated team is here to assist you every step of the way.</p>
                    <div className={styles.infoDetails}>
                        <div className={styles.infoItem}>
                            <img src={mailIcon} alt="Email" /> 
                            <p>Email<br />hello@reallygreatsite.com</p>
                        </div>
                        <div className={styles.infoItem}>
                            <img src={websiteIcon} alt="Website" /> 
                            <p>Website<br />reallygreatsite.com</p>
                        </div>
                        <div className={styles.infoItem}>
                            <img src={phoneIcon} alt="Phone" /> 
                            <p>Phone<br />+123-456-7890</p>
                        </div>
                        <div className={styles.infoItem}>
                            <img src={locationIcon} alt="Location" /> 
                            <p>Location<br />123 Anywhere St., Any City</p>
                        </div>
                    </div>
                </div>
            </div>
            <div className={styles.rightSection}>
                <div className={styles.contactForm}>
                    <h2>Get in touch.</h2>
                    <form onSubmit={handleSubmit}>
                        <input type="text" name="name" placeholder="Your Name" value={formData.name} onChange={handleChange} required />
                        <input type="email" name="email" placeholder="Email Address" value={formData.email} onChange={handleChange} required />
                        <input type="tel" name="phone" placeholder="Phone Number" value={formData.phone} onChange={handleChange} />
                        <textarea name="message" placeholder="Message" value={formData.message} onChange={handleChange} required></textarea>
                        <button type="submit">Submit</button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Contact;
