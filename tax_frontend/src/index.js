import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App'; // Make sure to import App.js
import { BrowserRouter as Router } from 'react-router-dom'; // Import Router here
import './axiosConfig';

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <Router> {/* Wrap the entire app with BrowserRouter here */}
    <App />
  </Router>
);
