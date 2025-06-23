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
              Tax.X is your premier financial partner, offering innovative solutions to propel your business forward. 
              With a focus on excellence and client satisfaction, we deliver bespoke financial services tailored to your needs.
            </p>
            <img src={TaxLogo} alt="TaxZone Logo" style={{ width: '350px', marginTop: '2rem' }} />
          </div>

          <div className="footer-section">
            <h3>OUR SERVICES</h3>
            <ul className="footer-list">
              <li className="footer-list-item">
                <Link to="/tax-report-service" className="footer-service-link">Tax Report Generation</Link>
              </li>
              <li className="footer-list-item">
                <Link to="/calculator-service" className="footer-service-link">Tax Instant Calculation</Link>
              </li>
              <li className="footer-list-item">
                <Link to="/assistant-service" className="footer-service-link">Tax AI Assistant Chat</Link>
              </li>
              <li className="footer-list-item">
                <Link to="/notification-service" className="footer-service-link">Tax Deadline Notification</Link>
              </li>
            </ul>
          </div>

          <div className="footer-section">
            <h3>CONTACT US</h3>
            <ul className="footer-list">
              <li className="footer-list-item">(+94) 710784556</li>
              <li className="footer-list-item">TaxZone@gmail.com</li>
              <li className="footer-list-item">Standly Road, Jaffna</li>
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