import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import Header from '../../common/Header/Header';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import styles from './NewPassword.module.css';

const NewPassword = () => {
    const [formData, setFormData] = useState({
        email: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { token } = useParams();
    const location = useLocation();

    useEffect(() => {
        document.body.className = 'new-password-page';
        // Get email from URL query parameters
        const searchParams = new URLSearchParams(location.search);
        const email = searchParams.get('email');
        if (email) {
            setFormData(prev => ({ ...prev, email }));
        }
        validateToken();
        return () => {
            document.body.className = '';
        };
    }, [token, location]);

    const validateToken = async () => {
        try {
            const response = await axios.get(`http://localhost:8000/api/users/reset-password/validate/${token}/`);
            if (response.data.valid) {
                // If email is not in URL, use the one from the response
                if (!formData.email && response.data.email) {
                    setFormData(prev => ({ ...prev, email: response.data.email }));
                }
            } else {
                setError('Invalid or expired reset link');
            }
        } catch (err) {
            setError('Invalid or expired reset link');
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevState => ({
            ...prevState,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');
        setLoading(true);

        // Validate passwords match
        if (formData.newPassword !== formData.confirmPassword) {
            setError('Passwords do not match');
            setLoading(false);
            return;
        }

        // Validate password strength
        if (formData.newPassword.length < 8) {
            setError('Password must be at least 8 characters long');
            setLoading(false);
            return;
        }

        try {
            const response = await axios.post('http://localhost:8000/api/users/reset-password/confirm/', {
                token: token,
                new_password: formData.newPassword,
                email: formData.email
            }, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.data.message) {
                setMessage('Password reset successful!');
                setTimeout(() => {
                    navigate('/login');
                }, 2000);
            }
        } catch (err) {
            console.error('Reset password error:', err);
            setError(err.response?.data?.message || 'Failed to reset password. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="new-password-page">
            <Header />
            <div className={styles.newPasswordContainer}>
                <div className={styles.newPasswordBox}>
                    <h2>Setup New Password</h2>
                    <p className={styles.subtext}>Please enter your new password</p>

                    {message && <div className={styles.successMessage}>{message}</div>}
                    {error && <div className={styles.errorMessage}>{error}</div>}

                    <form onSubmit={handleSubmit} className={styles.newPasswordForm}>
                        <div className={styles.inputGroup}>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="Email Address"
                                className={styles.inputField}
                                required
                                disabled
                                autoComplete="email"
                            />
                        </div>
                        <div className={styles.inputGroup}>
                            <div className={styles.passwordContainer}>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    name="newPassword"
                                    value={formData.newPassword}
                                    onChange={handleChange}
                                    placeholder="New Password"
                                    className={styles.inputField}
                                    required
                                    autoComplete="new-password"
                                />
                                <FontAwesomeIcon
                                    icon={showPassword ? faEye : faEyeSlash}
                                    onClick={() => setShowPassword(!showPassword)}
                                    className={styles.eyeIcon}
                                />
                            </div>
                        </div>
                        <div className={styles.inputGroup}>
                            <div className={styles.passwordContainer}>
                                <input
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    placeholder="Confirm Password"
                                    className={styles.inputField}
                                    required
                                    autoComplete="new-password"
                                />
                                <FontAwesomeIcon
                                    icon={showConfirmPassword ? faEye : faEyeSlash}
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className={styles.eyeIcon}
                                />
                            </div>
                        </div>
                        <button type="submit" className={styles.resetButton} disabled={loading}>
                            {loading ? 'Resetting...' : 'Reset Password'}
                        </button>
                    </form>

                    <div className={styles.backToLogin}>
                        Remember your password? <span onClick={() => navigate('/login')}>Back to Login</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NewPassword;
