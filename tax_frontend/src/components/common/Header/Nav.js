import React from 'react';
import { Link } from 'react-router-dom';
import './Nav.css';
import TaxLogo from '../../../assets/Tax_logo.png';
import { FaChevronDown } from 'react-icons/fa';

const Nav = () => {
  const navItems = [
    { to: '/', label: 'Home' },
    {
      to: '/servicesMain',
      label: 'Services',
      dropdown: [
        { to: '/assistant', label: 'AI Assistant' },
        { to: '/calculator', label: 'Calculator' },
        { to: '/Taxation', label: 'Report' },
      ],
    },
    { to: '/guidelines', label: 'Guidelines' },
    { to: '/contact', label: 'Contact' },
  ];

  return (
    <nav className="nav">
      <div className="nav-left">
        <Link to="/" className="logo-container">
          <img src={TaxLogo} alt="Tax_logo" className="tax-logo" />
        </Link>
      </div>
      <div className="nav-items">
        {navItems.map((item, index) => (
          item.dropdown ? (
            <div key={index} className="dropdown">
              <Link to={item.to} className="nav-item">
                {item.label}
                <FaChevronDown className="dropdown-arrow" />
              </Link>
              <div className="dropdown-content">
                {item.dropdown.map((dropdownItem, dropdownIndex) => (
                  <Link key={dropdownIndex} to={dropdownItem.to}>
                    {dropdownItem.label}
                  </Link>
                ))}
              </div>
            </div>
          ) : (
            <Link key={index} to={item.to} className="nav-item">
              {item.label}
            </Link>
          )
        ))}
        <Link to="/login" className="login-button">
            Login
        </Link>
      </div>
    </nav>
  );
};

export default Nav;