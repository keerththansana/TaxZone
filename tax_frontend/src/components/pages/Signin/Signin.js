import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import TaxLogo from '../../../assets/logo4.png';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import './Signin.css';

const Signin = () => {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
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

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatusMessage('');
        setLoading(true);

        const { username, email, password, confirmPassword } = formData;

        if (!username || !email || !password || !confirmPassword) {
            setStatusMessage('All fields are required.');
            setLoading(false);
            return;
        }

        if (password !== confirmPassword) {
            setStatusMessage('Passwords do not match.');
            setLoading(false);
            return;
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            setStatusMessage('Please enter a valid email address.');
            setLoading(false);
            return;
        }

        try {
            const response = await axios.post('http://localhost:8000/api/users/signin/', {
                username,
                email,
                password,
                password2: confirmPassword
            });

            setStatusMessage('Registration successful! Redirecting...');
            setTimeout(() => navigate('/login'), 2000);
        } catch (error) {
            const errData = error.response?.data;
            // Only show email-related errors, ignore username errors
            setStatusMessage(
                errData?.email?.[0] || 
                errData?.password?.[0] || 
                errData?.message || 
                'Registration failed. Please try again.'
            );
            console.error('Registration error:', error);
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
                setTimeout(() => navigate('/emotion'), 2000);
            }
        } catch (err) {
            console.error('Google login failed:', err);
            setStatusMessage('Google login failed. Please try again.');
        }
    };

    return (
        <GoogleOAuthProvider clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID}>
            <div className="login-container">
                <div className="login-left">
                    <img src={TaxLogo} alt="Tax Logo" className="brand-logo" />
                    <h2>Welcome to TaxZone</h2>
                    <p>Secure and simplified tax management for individuals.</p>
                </div>

                <div className="login-right">
                    <h2>Create Your Account</h2>
                    <p className="subtext">Join now and manage your taxes with ease.</p>

                    {statusMessage && (
                        <div className={`status-message ${statusMessage.includes('successful') ? 'success' : 'error'}`}>
                            {statusMessage}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="login-form" autoComplete="off">
                        <input
                            type="text"
                            name="username"
                            placeholder="Username"
                            value={formData.username}
                            onChange={handleChange}
                            className="input-field"
                            autoComplete="off"
                            autoCorrect="off"
                            autoCapitalize="off"
                            spellCheck="false"
                        />
                        <input
                            type="email"
                            name="email"
                            placeholder="Email"
                            value={formData.email}
                            onChange={handleChange}
                            className="input-field"
                            autoComplete="off"
                            autoCorrect="off"
                            autoCapitalize="off"
                            spellCheck="false"
                        />
                        <div className="password-container">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                name="password"
                                placeholder="Password"
                                value={formData.password}
                                onChange={handleChange}
                                className="input-field"
                                autoComplete="new-password"
                                autoCorrect="off"
                                autoCapitalize="off"
                                spellCheck="false"
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
                                name="confirmPassword"
                                placeholder="Confirm Password"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                className="input-field"
                                autoComplete="new-password"
                                autoCorrect="off"
                                autoCapitalize="off"
                                spellCheck="false"
                            />
                            <FontAwesomeIcon
                                icon={showPassword ? faEye : faEyeSlash}
                                onClick={() => setShowPassword(!showPassword)}
                                className="eye-icon"
                            />
                        </div>
                        <label className="terms-checkbox">
                            <input type="checkbox" required />
                            I agree to the <a href="/terms" target="_blank" rel="noopener noreferrer" className="terms-link">Terms & Conditions</a>
                        </label>
                        <button type="submit" className="submit-button" disabled={loading}>
                            {loading ? 'Registering...' : 'Sign Up'}
                        </button>
                        <p className="switch-link">Already have an account? <span onClick={() => navigate('/login')}>Sign In</span></p>
                    </form>

                    <div className="google-login">
                        <GoogleLogin
                            onSuccess={handleGoogleSuccess}
                            onError={() => setStatusMessage('Google login failed')}
                            text="signup_with"
                            theme="outline"
                        />
                    </div>
                </div>
            </div>
        </GoogleOAuthProvider>
    );
};

export default Signin;
