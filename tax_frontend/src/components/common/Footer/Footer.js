import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import '../../common/Footer/Footer.css';
import TaxLogo from '../../../assets/taxlogo.png';

const Footer = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const handleContactClick = (e) => {
    e.preventDefault();
    if (location.pathname === '/' || location.pathname === '/home') {
      // If already on home, scroll to contact section
      const el = document.getElementById('contact');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        window.location.hash = '#contact';
      }
    } else {
      // Navigate to home with #contact
      navigate('/#contact');
    }
  };

  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-content">
          <div className="footer-section">
            <h3>ABOUT US</h3>
            <p className="footer-description">
              TaxZone is your premier financial partner, offering innovative solutions to propel your business forward. 
              With a focus on excellence and client satisfaction, we deliver bespoke financial services tailored to your needs.
            </p>
          </div>

          <div className="footer-section">
            <h3>SERVICES</h3>
            <ul className="footer-list">
              <li className="footer-list-item">
                <Link to="/tax-report-service" className="footer-service-link">Tax Report Generation Using AI</Link>
              </li>
              <li className="footer-list-item">
                <Link to="/calculator-service" className="footer-service-link">Tax Instant Calculator for taxes </Link>
              </li>
              <li className="footer-list-item">
                <Link to="/assistant-service" className="footer-service-link">Tax AI Assistant Chatbot System</Link>
              </li>
              <li className="footer-list-item">
                <Link to="/notification-service" className="footer-service-link">Tax Deadline Notification System</Link>
              </li>
            </ul>
          </div>

          <div className="footer-section">
            <h3>CONTACTS</h3>
            <ul className="footer-list">
              <li className="footer-list-item">Email   : TaxZone@gmail.com</li>
              <li className="footer-list-item">Address : Standly Road, Jaffna</li>
              <li className="footer-list-item">Phone   : +94 77 123 4567</li>
              <li className="footer-list-item">Website : www.taxzone.lk</li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <div className="footer-bottom-content">
            <p className="copyright-text">&copy; Copyright {new Date().getFullYear()}. Powered By TaxZone</p>
            <div className="footer-links">
              <a href="/terms" className="footer-link">Terms and Conditions</a>
              <a href="/contact" className="footer-link" onClick={handleContactClick}>Contact Us</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;