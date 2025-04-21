import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import TaxLogo from '../../../assets/Tax_logo.png';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import './Signin.css';

const Signin = () => {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [statusMessage, setStatusMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        document.body.className = 'signin-page';
        return () => {
            document.body.className = '';
        };
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setStatusMessage('');
        setLoading(true);
        if (password !== confirmPassword) {
            setStatusMessage('Passwords do not match.');
            setLoading(false);
            return;
        }
        try {
            const response = await axios.post('http://localhost:8000/api/signin/', {
                username,
                email,
                password,
                confirmPassword
            });
            setStatusMessage('Registration successful!');
            setTimeout(() => {
                navigate('/login'); // Redirect to login page after successful registration
            }, 2000);
        } catch (error) {
            let errorMessage = 'Registration failed. Please try again.';
            if (error.response && error.response.data && error.response.data.error) {
                errorMessage = error.response.data.error;
            } else if (error.message) {
                errorMessage = `Registration failed: ${error.message}`;
            }
            setStatusMessage(errorMessage);
            console.error('Registration failed:', error);
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
                setStatusMessage('Registration/Login with Google successful! Redirecting...');
                setTimeout(() => {
                    navigate('/emotion'); // Or your desired logged-in route
                }, 2000);
            } else {
                throw new Error('No access token received');
            }
        } catch (error) {
            console.error('Google login failed:', error);
            setStatusMessage('Login with Google failed. Please try again.');
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
                    <h2>Welcome to Tax.X</h2>
                    <p>Manage your taxes with ease and security.</p>
                </div>
                <div className="login-right">
                    <h2>Create your Account</h2>
                    <h4>If you don't have an account, register here to start your tax journey</h4>
                    {statusMessage && <p className="message">{statusMessage}</p>}
                    <form onSubmit={handleSubmit} className="login-form">
                        <input
                            type="text"
                            placeholder="User Name"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            className="input-field"
                        />
                        <input
                            type="email"
                            placeholder="Enter your email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
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
                        <div className="password-container">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                placeholder="Confirm Password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                className="input-field"
                            />
                            <FontAwesomeIcon
                                icon={showPassword ? faEye : faEyeSlash}
                                onClick={() => setShowPassword(!showPassword)}
                                className="eye-icon"
                            />
                        </div>
                        <div className="terms-container">
                            <input type="checkbox" required /> I agree with Terms & Conditions
                        </div>
                        <button type="submit" className="submit-button" disabled={loading}>
                            {loading ? 'Signing up...' : 'Sign Up'}
                        </button>
                        <h4>Already Registered?</h4>
                        <button type="button" className="secondary-button" onClick={() => navigate('/login')}>Sign In</button>
                    </form>
                    <div className="google-login">
                        <GoogleLogin onSuccess={handleGoogleSuccess} onError={() => console.log('Google Login Error')} text="Sign up with Google" />
                    </div>
                </div>
            </div>
        </GoogleOAuthProvider>
    );
};

export default Signin;