import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

const RouteGuard = ({ children }) => {
    const location = useLocation();
    
    // Check if we have valid navigation state
    const navigationState = sessionStorage.getItem('taxationState');
    const documents = sessionStorage.getItem('taxationDocuments');

    // Allow direct access to taxation page
    if (location.pathname === '/taxation') {
        return children;
    }

    // For other routes, verify navigation state exists
    if (!navigationState || !documents) {
        return <Navigate to="/taxation" replace />;
    }

    return children;
};

export default RouteGuard;