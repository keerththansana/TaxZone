import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import TaxLogo from '../../../assets/Tax_logo.png';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import './Login.css';

const Login = () => {
    const navigate = useNavigate();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [statusMessage, setStatusMessage] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // Set the login-page class on the body for specific styling
        document.body.classList.add('login-page');

        return () => {
            // Clean up by removing the class when the component unmounts
            document.body.classList.remove('login-page');
        };
    }, []);

    // Optional: Force style reload on component mount (can be useful during development)
    useEffect(() => {
        const links = document.getElementsByTagName('link');
        for (const link of links) {
            if (link.rel === "stylesheet") {
                link.href = link.href.split('?')[0] + "?reload=" + Date.now();
            }
        }
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setStatusMessage('');
        setLoading(true);

        try {
            const response = await axios.post('http://localhost:8000/api/login/', {
                username,
                password
            });
            localStorage.setItem('token', response.data.access);
            setStatusMessage('Login successful! Redirecting...');
            setTimeout(() => {
                navigate('/taxation');
            }, 1500); // Slightly shorter redirect time
        } catch (err) {
            let errorMessage = 'Login failed. Please check your credentials.';
            if (err.response && err.response.data && err.response.data.error) {
                errorMessage = err.response.data.error;
            } else if (err.message) {
                errorMessage = `Login failed: ${err.message}`;
            }
            setStatusMessage(errorMessage);
            console.error('Login failed:', err);
            setTimeout(() => {
                setStatusMessage('');
            }, 3000);
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSuccess = async (credentialResponse) => {
        try {
            const decoded = jwtDecode(credentialResponse.credential);
            const response = await axios.post('http://localhost:8000/api/login/google/', {
                email: decoded.email,
                given_name: decoded.name,
                google_id: decoded.sub,
                picture: decoded.picture
            });

            if (response.data.access) {
                localStorage.setItem('token', response.data.access);
                setStatusMessage('Google login successful! Redirecting...');
                setTimeout(() => {
                    navigate('/taxation');
                }, 1500); // Slightly shorter redirect time
            } else {
                throw new Error('No access token received from Google login.');
            }
        } catch (err) {
            let errorMessage = 'Login with Google failed. Please try again.';
            if (err.response && err.response.data && err.response.data.error) {
                errorMessage = err.response.data.error;
            } else if (err.message) {
                errorMessage = `Google login failed: ${err.message}`;
            }
            console.error('Google login failed:', err);
            setStatusMessage(errorMessage);
            setTimeout(() => {
                setStatusMessage('');
            }, 3000);
        }
    };

    return (
        <GoogleOAuthProvider clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID}>
            <div className="login-container">
                <div className="login-left">
                    <div className="brand-logo">
                        <img src={TaxLogo} alt="Tax_logo" className="tax-logo" />
                    </div>
                    <h2>Welcome Back to Tax.X</h2>
                    <p>Securely access your account to manage your taxes efficiently.</p>
                </div>
                <div className="login-right">
                    <h2>Login to your Account</h2>
                    <h4>Enter your credentials to access your dashboard</h4>
                    {statusMessage && <p className="message">{statusMessage}</p>}
                    <form onSubmit={handleSubmit} className="login-form">
                        <input
                            type="text"
                            placeholder="Username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            className="input-field"
                        />
                        <div className="password-container">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="input-field"
                            />
                            <FontAwesomeIcon
                                icon={showPassword ? faEye : faEyeSlash}
                                onClick={() => setShowPassword(!showPassword)}
                                className="eye-icon"
                            />
                        </div>

                        <button type="submit" className="submit-button" disabled={loading}>
                            {loading ? 'Logging in...' : 'Login'}
                        </button>
                        <p className="signup-link">
                            Don't have an account? <Link to="/signin">Sign Up</Link>
                        </p>
                    </form>
                    <div className="separator">
                        <span>OR</span>
                    </div>
                    <div className="google-login">
                        <GoogleLogin
                            onSuccess={handleGoogleSuccess}
                            onError={() => setStatusMessage('Google login failed. Please try again.')}
                            text="Sign in with Google" // More explicit button text
                        />
                    </div>
                </div>
            </div>
        </GoogleOAuthProvider>
    );
};

export default Login;