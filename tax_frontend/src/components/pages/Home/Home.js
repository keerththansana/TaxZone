import React, { useEffect, useState } from 'react';
import Header from '../../common/Header/Header';
import Hero from '../../Hero/Hero';
import Footer from '../../common/Footer/Footer';
import ServicesSection from '../ServicesSection/ServicesSection';
import Contact from '../Contact/Contact';
import Guidelines from '../Guidelines/Guidelines';
import Review from './Review';
import './Home.css';
import assistantImage from '../../../assets/Assistant.png';
import { useNavigate } from 'react-router-dom';

const Home = () => {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
    if (window.location.hash === '#guidelines') {
      setTimeout(() => {
        const el = document.getElementById('guidelines');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 200);
    }
  }, []);

  const navigate = useNavigate();
  const [showAssistantMsg, setShowAssistantMsg] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowAssistantMsg(false), 4000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="home-container">
      <Header />
      <Hero />
      <div id ="services-section">
      <ServicesSection />
      </div>
      <div id="guidelines">
        <Guidelines />
      </div>
      <Review />
      <div id="contact">
        <Contact />
      </div>
      <Footer />
      {/* Floating Assistant Button */}
      <button
        className="assistant-fab"
        onClick={() => navigate('/assistant')}
        title="Chat with Assistant"
        onMouseEnter={() => setShowAssistantMsg(true)}
        onMouseLeave={() => setShowAssistantMsg(false)}
        onFocus={() => setShowAssistantMsg(true)}
        onBlur={() => setShowAssistantMsg(false)}
      >
        <img src={assistantImage} alt="Assistant" className="assistant-fab-icon" />
      </button>
      {showAssistantMsg && (
        <div className="assistant-fab-message animated-fade-in">
          I am AI Assistant. How can I help you today? <span role="img" aria-label="wave"></span>
        </div>
      )}
    </div>
  );
};

export default Home;
