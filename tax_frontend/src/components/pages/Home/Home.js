import React from 'react';
import Header from '../../common/Header/Header';
import Hero from '../../Hero/Hero';
import Footer from '../../common/Footer/Footer';
import ServicesSection from '../ServicesSection/ServicesSection';
import Contact from '../Contact/Contact';
import Guidelines from '../Guidelines/Guidelines';
import Review from './Review';
import './Home.css';

const Home = () => {
  return (
    <div className="home-container">
      <Header />
      <Hero />
      <ServicesSection />
      <Guidelines />
      <Review />
      <Contact />
      <Footer />
    </div>
  );
};

export default Home;
