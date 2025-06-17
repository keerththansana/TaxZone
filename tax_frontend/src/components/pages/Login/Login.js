import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import { useAuth } from '../../../contexts/AuthContext';
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
    const { login } = useAuth();

    useEffect(() => {
        document.body.className = 'login-page';
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
                
                setStatusMessage('Login successful!');
                setTimeout(() => navigate('/'), 1500);
            }
        } catch (error) {
            setStatusMessage(
                error.response?.data?.message || 
                'Invalid username or password'
            );
            console.error('Login error:', error);
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
                setStatusMessage('Google login successful! ');
                setTimeout(() => navigate('/'), 1500);
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
        </GoogleOAuthProvider>
    );
};

export default Login;