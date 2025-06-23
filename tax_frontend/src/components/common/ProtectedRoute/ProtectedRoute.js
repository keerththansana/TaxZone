import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import './ProtectedRoute.css';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="protected-route-loading">
        Loading...
      </div>
    );
  }

  // If user is not authenticated, redirect to login with return URL
  if (!user) {
    // Store the intended destination for better UX
    const intendedPath = location.pathname;
    console.log(`Redirecting to login. Intended destination: ${intendedPath}`);
    
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If user is authenticated, render the protected component
  return children;
};

export default ProtectedRoute; 