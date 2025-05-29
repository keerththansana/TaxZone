import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Nav.css';
import TaxLogo from '../../../assets/Tax_logo.png';
import { FaChevronDown, FaBars, FaUser, FaSignOutAlt, FaStar } from 'react-icons/fa';

const Nav = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openDropdownIndex, setOpenDropdownIndex] = useState(null);
  const [user, setUser] = useState(null);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const navigate = useNavigate();

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

  useEffect(() => {
    // Check for user data on component mount
    const checkUser = () => {
      const userData = localStorage.getItem('user');
      if (userData) {
        try {
          const parsedUser = JSON.parse(userData);
          setUser(parsedUser);
        } catch (error) {
          console.error('Error parsing user data:', error);
          localStorage.removeItem('user');
          setUser(null);
        }
      } else {
        setUser(null);
      }
    };

    checkUser();
    // Listen for storage changes
    window.addEventListener('storage', checkUser);
    return () => window.removeEventListener('storage', checkUser);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setUser(null);
    setIsUserMenuOpen(false);
  };

  const handleReview = () => {
    navigate('/review-form');
    setIsUserMenuOpen(false);
  };

  const toggleMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const toggleDropdown = (index) => {
    setOpenDropdownIndex(openDropdownIndex === index ? null : index);
  };

  const toggleUserMenu = () => {
    setIsUserMenuOpen(!isUserMenuOpen);
  };

  return (
    <nav className="nav">
      <div className="nav-left">
        <Link to="/" className="logo-container">
          <img src={TaxLogo} alt="Tax_logo" className="tax-logo" />
        </Link>
      </div>

      <div className="hamburger" onClick={toggleMenu}>
        <FaBars />
      </div>

      <div className={`nav-items ${isMobileMenuOpen ? 'open' : ''}`}>
        {navItems.map((item, index) =>
          item.dropdown ? (
            <div key={index} className="dropdown">
              <div className="nav-item with-arrow" onClick={() => toggleDropdown(index)}>
                <Link to={item.to}>{item.label}</Link>
                <FaChevronDown className="dropdown-arrow" />
              </div>
              {openDropdownIndex === index && (
                <div className="dropdown-content">
                  {item.dropdown.map((dropdownItem, dropdownIndex) => (
                    <Link
                      key={dropdownIndex}
                      to={dropdownItem.to}
                      className="dropdown-link"
                    >
                      {dropdownItem.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <Link key={index} to={item.to} className="nav-item">
              {item.label}
            </Link>
          )
        )}
        {user ? (
          <div className="user-menu-container">
            <button className="user-icon-button" onClick={toggleUserMenu}>
              <FaUser className="user-icon" />
            </button>
            {isUserMenuOpen && (
              <div className="user-dropdown">
                <div className="user-info">
                  <span className="user-name">{user.name || user.username}</span>
                </div>
                <button className="logout-button" onClick={handleReview}>
                  <FaStar /> Review
                </button>
                <button className="logout-button" onClick={handleLogout}>
                  <FaSignOutAlt /> Logout
                </button>
              </div>
            )}
          </div>
        ) : (
          <Link to="/login" className="login-button">
            Login
          </Link>
        )}
      </div>
    </nav>
  );
};

export default Nav;
