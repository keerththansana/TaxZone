import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import './Nav.css';
import TaxLogo from '../../../assets/taxlogo.png';
import { FaChevronDown, FaBars, FaUser, FaSignOutAlt, FaStar, FaTimes } from 'react-icons/fa';

const Nav = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openDropdownIndex, setOpenDropdownIndex] = useState(null);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const navRef = useRef(null);
  const userMenuRef = useRef(null);

  const navItems = [
    { to: '/', label: 'Home' },
    {
      to: '/servicesMain',
      label: 'Services',
      dropdown: [
        { to: '/assistant', label: 'AI tax Assistant', requiresAuth: true },
        { to: '/calculator', label: 'Tax Calculator', requiresAuth: true },
        { to: '/Taxation', label: 'Tax Report', requiresAuth: true },
        { to: '/tax-calendar', label: 'Tax Calendar', requiresAuth: true },
      ],
    },
    { to: '/guidelines', label: 'Guidelines' },
    { to: '/contact', label: 'Contact' },
  ];

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setOpenDropdownIndex(null);
    setIsUserMenuOpen(false);
  }, [location.pathname]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.classList.add('menu-open');
    } else {
      document.body.classList.remove('menu-open');
    }

    return () => {
      document.body.classList.remove('menu-open');
    };
  }, [isMobileMenuOpen]);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (navRef.current && !navRef.current.contains(event.target)) {
        setIsMobileMenuOpen(false);
        setOpenDropdownIndex(null);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Close mobile menu on escape key
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setIsMobileMenuOpen(false);
        setOpenDropdownIndex(null);
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const handleLogout = () => {
    logout();
    setIsUserMenuOpen(false);
    setIsMobileMenuOpen(false);
  };

  const handleReview = () => {
    navigate('/review-form');
    setIsUserMenuOpen(false);
    setIsMobileMenuOpen(false);
  };

  const toggleMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
    // Close other menus when opening mobile menu
    if (!isMobileMenuOpen) {
      setOpenDropdownIndex(null);
      setIsUserMenuOpen(false);
    }
  };

  const toggleDropdown = (index) => {
    setOpenDropdownIndex(openDropdownIndex === index ? null : index);
  };

  const toggleUserMenu = () => {
    setIsUserMenuOpen(!isUserMenuOpen);
  };

  const handleNavItemClick = () => {
    // Close mobile menu when clicking on nav items
    if (isMobileMenuOpen) {
      setIsMobileMenuOpen(false);
      setOpenDropdownIndex(null);
    }
  };

  const handleServiceClick = (serviceItem, e) => {
    e.preventDefault();
    
    // Check if the service requires authentication
    if (serviceItem.requiresAuth && !user) {
      // Debug logging
      console.log('Service requires auth, user not logged in');
      console.log('Target service:', serviceItem.to);
      console.log('Redirecting to login with return URL:', serviceItem.to);
      
      // Redirect to login page with the target service URL as return URL
      navigate('/login', { state: { from: { pathname: serviceItem.to } } });
      return;
    }
    
    // If authenticated or no auth required, navigate normally
    console.log('User authenticated, navigating to:', serviceItem.to);
    navigate(serviceItem.to);
    handleNavItemClick();
  };

  return (
    <nav className="nav" ref={navRef}>
      <div className="nav-left">
        <Link to="/" className="logo-container" onClick={handleNavItemClick}>
          <img src={TaxLogo} alt="Tax_logo4" className="tax-logo" />
        </Link>
      </div>

      <div className="hamburger" onClick={toggleMenu} aria-label="Toggle navigation menu">
        {isMobileMenuOpen ? <FaTimes /> : <FaBars />}
      </div>

      <div className={`nav-items ${isMobileMenuOpen ? 'open' : ''}`}>
        {navItems.map((item, index) =>
          item.dropdown ? (
            <div key={index} className="dropdown">
              <div className="nav-item with-arrow" onClick={() => toggleDropdown(index)}>
                <Link to={item.to} onClick={handleNavItemClick}>{item.label}</Link>
                <FaChevronDown className={`dropdown-arrow ${openDropdownIndex === index ? 'rotated' : ''}`} />
              </div>
              {openDropdownIndex === index && (
                <div className="dropdown-content">
                  {item.dropdown.map((dropdownItem, dropdownIndex) => (
                    <a
                      key={dropdownIndex}
                      href={dropdownItem.to}
                      className="dropdown-link"
                      onClick={(e) => handleServiceClick(dropdownItem, e)}
                    >
                      {dropdownItem.label}
                    </a>
                  ))}
                </div>
              )}
            </div>
          ) : (
            item.label === 'Home' ? (
              <a
                key={index}
                href="/"
                className="nav-item"
                onClick={e => {
                  e.preventDefault();
                  if (location.pathname === '/' || location.pathname === '/home') {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  } else {
                    navigate('/');
                  }
                  handleNavItemClick();
                }}
              >
                {item.label}
              </a>
            ) : item.label === 'Guidelines' ? (
              <Link
                key={index}
                to="/guidelines"
                className="nav-item"
                onClick={handleNavItemClick}
              >
                {item.label}
              </Link>
            ) : item.label === 'Contact' ? (
              <a
                key={index}
                href="/#contact"
                className="nav-item"
                onClick={e => {
                  e.preventDefault();
                  if (location.pathname === '/' || location.pathname === '/home') {
                    // If already on home, just scroll
                    const el = document.getElementById('contact');
                    if (el) {
                      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    } else {
                      window.location.hash = '#contact';
                    }
                  } else {
                    navigate('/#contact');
                  }
                  handleNavItemClick();
                }}
              >
                {item.label}
              </a>
            ) : (
              <Link key={index} to={item.to} className="nav-item" onClick={handleNavItemClick}>
                {item.label}
              </Link>
            )
          )
        )}
        {user ? (
          <div className="user-menu-container" ref={userMenuRef}>
            <button 
              className="user-icon-button" 
              onClick={toggleUserMenu}
              aria-label="User menu"
            >
              {/* Show user profile image if available (Google), else user icon for normal, else email icon as fallback */}
              {user.picture ? (
                <img
                  src={user.picture}
                  alt="User"
                  className="user-profile-image"
                  style={{ width: 28, height: 28, borderRadius: '50%' }}
                />
              ) : (
                <FaUser className="user-icon" />
              )}
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
          <Link to="/login" className="login-button" onClick={handleNavItemClick}>
            Login
          </Link>
        )}
      </div>
    </nav>
  );
};

export default Nav;
