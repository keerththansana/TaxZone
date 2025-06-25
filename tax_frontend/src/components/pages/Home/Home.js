import React, { useEffect, useState } from 'react';
import Header from '../../common/Header/Header';
import Hero from '../../Hero/Hero';
import Footer from '../../common/Footer/Footer';
import ServicesSection from '../ServicesSection/ServicesSection';
import Contact from '../Contact/Contact';
import Review from './Review';
import { ChevronDown } from 'lucide-react';
import './Home.css';
import assistantImage from '../../../assets/Assistant.png';
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const [openFAQIndex, setOpenFAQIndex] = useState(null);

  const faqData = [
    {
      question: "Is TaxZone free to use or do I need to pay?",
      answer: "TaxZone offers both free and premium features. Basic tax calculations and general guidelines are available for free. However, advanced features like AI-powered tax assistance, detailed tax reports, automated form filling, and priority support require a subscription. We offer flexible pricing plans to suit different needs, from individual taxpayers to businesses. Contact our support team for detailed pricing information."
    },
    {
      question: "How do I create an account and get started with TaxZone?",
      answer: "Getting started with TaxZone is simple! Click the 'Sign Up' button in the top navigation to create your account. You'll need to provide basic information like your name, email, and create a password. Once registered, you can access our free features immediately. For premium features, you can upgrade your account through our subscription plans. Our platform is designed to be user-friendly, so you can start using it right away."
    },
    {
      question: "What features are included in the free version vs premium?",
      answer: "Free version includes: basic tax calculations, access to general tax guidelines, and limited AI assistant queries. Premium features include: unlimited AI tax assistant access, detailed tax reports and analysis, automated document processing, priority customer support, tax deadline reminders, personalized tax-saving recommendations, and advanced tax planning tools. Premium users also get access to our mobile app and priority updates."
    },
    {
      question: "How secure is my personal and financial information on TaxZone?",
      answer: "Your security is our top priority. TaxZone uses bank-level encryption (256-bit SSL) to protect all your data. We never store your complete financial information on our servers - sensitive data is encrypted and processed securely. We comply with international data protection standards and Sri Lankan privacy laws. Your personal information is only used for tax calculations and is never shared with third parties without your explicit consent."
    },
    {
      question: "Can I use TaxZone on my mobile device?",
      answer: "Yes! TaxZone is fully responsive and works on all devices including smartphones and tablets. You can access all features through your mobile browser. We also offer a dedicated mobile app for premium users that provides enhanced functionality, offline access to saved calculations, and push notifications for important tax deadlines. The mobile experience is optimized for touch interfaces and provides the same security and accuracy as the desktop version."
    }
  ];

  const handleFAQClick = (index) => {
    setOpenFAQIndex(openFAQIndex === index ? null : index);
  };

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
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
      <ServicesSection />
      <Review />
      <section className="faq-section">
        <div className="faq-container">
          <h2 className="faq-title">Frequently Asked Questions</h2>
          <p className="faq-description">
            Find answers to common questions about tax filing, our platform, and Sri Lanka's tax system. 
            If you don't find what you're looking for, feel free to contact our support team.
          </p>
          <div className="faq-list">
            {faqData.map((item, index) => (
              <div key={index} className="faq-item">
                <button
                  className="faq-toggle-button"
                  onClick={() => handleFAQClick(index)}
                  aria-expanded={openFAQIndex === index}
                  aria-controls={`faq-content-${index}`}
                >
                  {item.question}
                  <ChevronDown 
                    className={openFAQIndex === index ? 'rotated' : ''} 
                    aria-hidden="true"
                  />
                </button>
                {openFAQIndex === index && (
                  <div 
                    id={`faq-content-${index}`}
                    className="faq-content"
                    role="region"
                    aria-label={`Answer for ${item.question}`}
                  >
                    <p>{item.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
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
