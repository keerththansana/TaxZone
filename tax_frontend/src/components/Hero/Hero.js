import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../common/Button/Button';
import image1 from '../../assets/Home_Image.png';
import image2 from '../../assets/home image.jpg';
import image3 from '../../assets/home2.jpg';
import image4 from '../../assets/home7.jpg';
import './Hero.css';

const Hero = () => {
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [direction, setDirection] = useState('left');

  const slides = [
    { image: image1, alt: "Tax Calculation" },
    { image: image2, alt: "Policy Updates" },
    { image: image3, alt: "Tax Filing" },
    { image: image4, alt: "AI Assistant" }
  ];

  const handleGetStarted = () => {
    navigate('/taxation');
  };

  const nextSlide = () => {
    setCurrentSlide((current) => (current + 1) % slides.length);
  };

  const handleIndicatorClick = (index) => {
    // Calculate the shortest direction to reach the target slide
    const currentPosition = currentSlide;
    const targetPosition = index;
    const totalSlides = slides.length;
    
    // Calculate forward and backward distances
    const forwardDistance = (targetPosition - currentPosition + totalSlides) % totalSlides;
    const backwardDistance = (currentPosition - targetPosition + totalSlides) % totalSlides;
    
    // Choose the shortest path
    const newDirection = forwardDistance <= backwardDistance ? 'left' : 'right';
    setDirection(newDirection);
    setCurrentSlide(index);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      nextSlide();
      setDirection('left'); // Always maintain left direction for auto-slide
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="hero">
      <div className="hero-content">
        <div className="hero-text">
          <h1>Effortless Taxation With AI!</h1>
          <p>
            Our AI-powered tax assistant provides accurate tax calculations, real-time policy updates, 
            and personalized guidance to ensure compliance with Sri Lanka's Inland Revenue regulations. 
            Simplify your tax filing process with automated calculations, exemption insights, and timely 
            due date notifications, all in one seamless platform.
          </p>
          <Button 
            className="get-started-button"
            onClick={handleGetStarted}
          >
            Get Started
          </Button>
        </div>
        <div className="hero-slider">
          <div className="slider-container">
            <div 
              className={`slider-track ${direction}`}
              style={{ 
                transform: `translateX(-${currentSlide * 100}%)`,
                transition: 'transform 0.5s ease-in-out'
              }}
            >
              {slides.map((slide, index) => (
                <div key={index} className="slide">
                  <div className="image-container">
                    <img 
                      src={slide.image} 
                      alt={slide.alt}
                      className="slide-image"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="slide-indicators">
            {slides.map((_, index) => (
              <button
                key={index}
                className={`indicator ${index === currentSlide ? 'active' : ''}`}
                onClick={() => handleIndicatorClick(index)}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
