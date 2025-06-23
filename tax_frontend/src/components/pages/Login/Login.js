import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import { useAuth } from '../../../contexts/AuthContext';
import { initializeUserSession } from '../Income/Data_Persistence';
import Header from '../../common/Header/Header';
import TaxLogo from '../../../assets/logo4.png';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import './Login.css';

const Login = () => {
    const [formData, setFormData] = useState({
        username: '',
        password: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [statusMessage, setStatusMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const { login } = useAuth();

    // Get the return URL from location state, or default to home
    const from = location.state?.from?.pathname || '/';

    // Debug logging
    console.log('Login component - Return URL:', from);
    console.log('Login component - Location state:', location.state);

    useEffect(() => {
        document.body.className = 'login-page';
        return () => {
            document.body.className = '';
        };
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setStatusMessage(''); // Clear message on input change
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatusMessage('');
        setLoading(true);

        const { username, password } = formData;

        if (!username || !password) {
            setStatusMessage('All fields are required.');
            setLoading(false);
            return;
        }

        try {
            const response = await axios.post('http://localhost:8000/api/users/login/', {
                username: username.trim(),
                password
            });

            if (response.data.status === 'success') {
                // Use the auth context to login
                login(response.data.user, response.data.tokens);
                setStatusMessage('Login successful! ');
                setTimeout(() => setStatusMessage(''), 3000); // Hide after 3s
                setTimeout(() => navigate(from, { replace: true }), 3000);
            }
        } catch (error) {
            setStatusMessage(
                error.response?.data?.message || 
                'Invalid username or password'
            );
            console.error('Login error:', error);
            setTimeout(() => {
                setStatusMessage('');
                setFormData({ username: '', password: '' });
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
                // Initialize user session to clear previous user's data
                initializeUserSession();
                
                // Store user data properly like regular login
                const userData = {
                    id: response.data.user?.id || decoded.sub,
                    username: decoded.name || decoded.email,
                    email: decoded.email,
                    name: decoded.name,
                    picture: decoded.picture
                };
                
                localStorage.setItem('user', JSON.stringify(userData));
                localStorage.setItem('accessToken', response.data.access);
                localStorage.setItem('refreshToken', response.data.refresh);
                
                // Show success message with redirect info
                const redirectMessage = from !== '/' 
                    ? `Google login successful! `
                    : 'Google login successful!';
                setStatusMessage(redirectMessage);
                
                // Navigate immediately after a short delay for user feedback
                setTimeout(() => navigate(from, { replace: true }), 1000);
            }
        } catch (err) {
            console.error('Google login failed:', err);
            setStatusMessage('Google login failed. Please try again.');
        }
    };

    return (
        <GoogleOAuthProvider clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID}>
            <div className="page-container">
                <Header />
                <div className="login-container">
                    <div className="login-left">
                        <img src={TaxLogo} alt="Tax Logo" className="brand-logo" />
                        <h2>Welcome Back to TaxZone</h2>
                    </div>

                    <div className="login-right">
                        <h2>Login to Your Account</h2>
                        <p className="subtext">Enter your credentials to access your dashboard</p>

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
                                autoComplete="new-password"
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
                            <div className="forgot-password-container">
                                <button type="button" className="forgot-password-btn" onClick={() => navigate('/forgot-password')}>
                                    Forgot Password?
                                </button>
                            </div>
                            <button type="submit" className="submit-button" disabled={loading}>
                                {loading ? 'Logging in...' : 'Login'}
                            </button>
                            <p className="switch-link">Don't have an account? <span onClick={() => navigate('/signin')}>Sign Up</span></p>
                        </form>

                        <div className="separator">
                            <span>OR</span>
                        </div>

                        <div className="google-login">
                            <GoogleLogin
                                onSuccess={handleGoogleSuccess}
                                onError={() => setStatusMessage('Google login failed')}
                                text="signin_with"
                                theme="outline"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </GoogleOAuthProvider>
    );
};

export default Login;