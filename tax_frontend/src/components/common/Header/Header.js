import React, { useState } from 'react';
import Nav from './Nav';
import './Header.css';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <header className="header">
      <div className="header-content">
        <div className="brand">
          <img src="/logo.png" alt="Tax.X Logo" className="tax-logo" />
          <h1 className="brand-name">Tax.X</h1>
        </div>
        
        <button 
          className={`mobile-menu-btn ${isMenuOpen ? 'active' : ''}`}
          onClick={toggleMenu}
          aria-label="Toggle menu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        <Nav isMenuOpen={isMenuOpen} />
      </div>
    </header>
  );
};

export default Header;
