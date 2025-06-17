import React from "react";
import { Routes, Route, createBrowserRouter } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import Home from "./components/pages/Home/Home"; // Correct path to Home.js
import Login from "./components/pages/Login/Login"; // Import Login component
import './App.css'; // If you have any global styles in App.css
import Signin from "./components/pages/Signin/Signin";
import Assistant from "./components/pages/Assistant/Assistant";
import ServicesSection from "./components/pages/ServicesSection/ServicesSection";
import ServicesMain from "./components/pages/ServicesSection/ServicesMain";
import Contact from "./components/pages/Contact/Contact"; 
import Guidelines from "./components/pages/Guidelines/Guidelines"; 
import TermsConditions from "./components/pages/TermsConditions/TermsConditions"; // Import TermsConditions component
import Taxation from "./components/pages/Income/Taxation";
import Employment_Income from "./components/pages/Income/Employment_Income";
import Investment_Income from "./components/pages/Income/Investment_Income";
import Other_Income from "./components/pages/Income/Other_Income";
import Qualifying_Payments from "./components/pages/Income/Qualifying_Payments";
import Terminal_Benefits from "./components/pages/Income/Terminal_Benefits";
import Business_Income from "./components/pages/Income/Business_Income";
import Preview from "./components/pages/Income/Preview";
import Calculator from "./components/pages/Calculator/Calculator";
import ReviewForm from "./components/pages/Home/ReviewForm";
import Calendar from "./components/pages/Calendar/Calendar"; // Import Calendar component
import ResetPassword from "./components/pages/ResetPassword/ResetPassword"; // Import ResetPassword component
import NewPassword from "./components/pages/ResetPassword/NewPassword";
import Calculation_Service from "./components/pages/ServicesSection/Calculation_Service";
import TaxReport_Service from "./components/pages/ServicesSection/TaxReport_Service";
import Assistant_Service from "./components/pages/ServicesSection/Assistant_Service";
import Notification_Service from "./components/pages/ServicesSection/Notification_Service";
import UserDetails from "./components/pages/Admin/UserDetails"; // Import UserDetails component

import './axiosConfig';

export const router = createBrowserRouter(
  [
  {
    path: "/",
    element: <Home />,
  },
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/signin",
    element: <Signin />,
  },
  {
    path: "/assistant",
    element: <Assistant />,
  },
  {
    path: "/services",
    element: <ServicesSection />,
  },
  {
    path: "/servicesMain",
    element: <ServicesMain />,
  },
  {
    path: "/contact",
    element: <Contact />,
  },
  {
    path: "/guidelines",
    element: <Guidelines />,
  },
  {
    path: "/terms",
    element: <TermsConditions />,
  },
  {
    path: "/taxation",
    element: <Taxation />,
  },
  {
    path: "/employment_income",
    element: <Employment_Income />,
  },
  {
    path: "/business_income",
    element: <Business_Income />,
  },
  {
    path: "/investment_income",
    element: <Investment_Income />,
  },
  {
    path: "/other_income",
    element: <Other_Income />,
  },
  {
    path: "/qualifying_payments",
    element: <Qualifying_Payments />,
  },
  {
    path: "/terminal_benefits",
    element: <Terminal_Benefits />,
  },
  {
    path: "/preview",
    element: <Preview />,
  },
  {
    path: "/calculator",
    element: <Calculator />,
  },
  {
    path: "/review-form",
    element: <ReviewForm />,
  },
  {
    path: "/tin-registration",
    element: <tin-registration />,
  },
  {
    path: "/tin-registration",
    element: <tin-registration />,
  },
  {
    path: "/tin-registration",
    element: <tin-registration />,
  },
  {
    path: "/tin-registration",
    element: <tin-registration />,
  },
  {
    path: "/tin-registration",
    element: <tin-registration />,
  },
  {
    path: "/tin-registration",
    element: <tin-registration />,
  },
  {
    path: "/tin-registration",
    element: <tin-registration />,
  },
  {
    path: "/tin-registration",
    element: <tin-registration />,
  },
  {
    path: "/tin-registration",
    element: <tin-registration />,
  },
  {
    path: "/tin-registration",
    element: <tin-registration />,
  },
  {
    path: "/tax-calendar",
    element: <Calendar />,
  },
  {
    path: "/forgot-password",
    element: <ResetPassword />,
  },
], {
  future: {
    v7_startTransition: true,
    v7_relativeSplatPath: true
  }
});

const App = () => {
  return (
    <AuthProvider>
      <div className="App">
        <Routes>
          <Route path="/" element={<Home />} /> {/* Home Page Route */}
          <Route path="/login" element={<Login />} /> {/* Login Page Route */}
          <Route path="/signin" element={<Signin />} /> {/* Signin Page Route */}
          <Route path="/assistant" element={<Assistant />} /> {/* Assistant Page Route */}
          <Route path="/services" element={<ServicesSection />} /> {/* Assistant Page Route */}
          <Route path="/servicesMain" element={<ServicesMain />} /> {/* Assistant Page Route */}
          <Route path="/contact" element={<Contact />} /> {/* Contact Page Route */}
          <Route path="/guidelines" element={<Guidelines/>} /> {/*Guideline Page Route */}
          <Route path="/terms" element={<TermsConditions />} /> {/* terms-conditions Page Route */}
          <Route path="/taxation" element={<Taxation />} /> {/* Income Page Route */}
          <Route path="/employment_income" element={<Employment_Income />} /> {/* Income Page Route */}
          <Route path="/business_income" element={<Business_Income />} /> {/* Income Page Route */}
          <Route path="/investment_income" element={<Investment_Income />} /> {/* Income Page Route */}
          <Route path="/other_income" element={<Other_Income />} /> {/* Income Page Route */}
          <Route path="/qualifying_payments" element={<Qualifying_Payments />} /> {/* Income Page Route */}
          <Route path="/terminal_benefits" element={<Terminal_Benefits />} /> {/* Income Page Route */}
          <Route path="/preview" element={<Preview/>} /> {/*Guideline Page Route */}  
          <Route path="/calculator" element={<Calculator/>} /> {/*Guideline Page Route */}  
          <Route path="/tin-registration" element={<tin-registration/>} /> {/*Guideline Page Route */}
          <Route path="/review-form" element={<ReviewForm />} />
          <Route path="/tax-calendar" element={<Calendar />} /> {/* Tax Calendar Page Route */}
          <Route path="/forgot-password" element={<ResetPassword />} /> {/* Reset Password Page Route */}
          <Route path="/new-password/:token" element={<NewPassword />} /> {/* New Password Page Route */}
          <Route path="/calculator-service" element={<Calculation_Service />} /> {/* calculator-service Page Route */}
          <Route path="/tax-report-service" element={<TaxReport_Service />} /> {/* tax-report-service Page Route */}
          <Route path="/assistant-service" element={<Assistant_Service />} /> {/* assistant-service Page Route */}
          <Route path="/notification-service" element={<Notification_Service />} /> {/* notification-service Page Route */}
        </Routes>
      </div>
    </AuthProvider>
  );
};

export default App;
