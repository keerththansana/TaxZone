import React from 'react';
import { useNavigate } from 'react-router-dom';
import './AuthPrompt.css';

const AuthPrompt = () => {
    const navigate = useNavigate();

    return (
        <div className="auth-overlay">
            <div className="auth-prompt">
                <h2>Sign In Required</h2>
                <p>Please sign in or create an account to access our tax services:</p>
                <ul>
                    <li>AI Tax Assistant</li>
                    <li>Tax Calculator</li>
                    <li>Tax Reports</li>
                </ul>
                <div className="auth-buttons">
                    <button 
                        onClick={() => navigate('/login')}
                        className="login-btn"
                    >
                        Login
                    </button>
                    <button 
                        onClick={() => navigate('/signin')}
                        className="signin-btn"
                    >
                        Sign Up
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AuthPrompt;