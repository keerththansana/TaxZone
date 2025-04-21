import React from 'react';
import '../../common/Footer/Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <p>&copy; {new Date().getFullYear()} Tax.X. All rights reserved.</p>
    </footer>
  );
};

export default Footer;
