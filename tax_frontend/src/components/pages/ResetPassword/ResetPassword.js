import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../common/Header/Header';
import axios from 'axios';
import styles from './ResetPassword.module.css';

const ResetPassword = () => {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        document.body.className = 'reset-password-page';
        return () => {
            document.body.className = '';
        };
    }, []);

    // Auto-hide error and success messages after a few seconds
    useEffect(() => {
        let timer;
        if (message || error) {
            timer = setTimeout(() => {
                setMessage('');
                setError('');
            }, 3000); // 3 seconds
        }
        return () => clearTimeout(timer);
    }, [message, error]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');
        setLoading(true);

        if (!email) {
            setError('Please enter your email address');
            setLoading(false);
            return;
        }

        try {
            const response = await axios.post('http://localhost:8000/api/users/reset-password/', { email });
            setMessage('you will receive a password reset link to your Email.');
            setEmail('');
        } catch (err) {
            setError(err.response?.data?.message || 'An error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="reset-password-page">
            <Header />
            <div className={styles.resetPasswordContainer}>
                <div className={styles.resetPasswordBox}>
                    <h2>Reset Password</h2>
                    <p className={styles.subtext}>we'll help you get back in.</p>

                    {message && <div className={styles.successMessage}>{message}</div>}
                    {error && <div className={styles.errorMessage}>{error}</div>}

                    <form onSubmit={handleSubmit} className={styles.resetForm}>
                        <div className={styles.inputGroup}>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Enter your email"
                                className={styles.inputField}
                                autoComplete="new-password"
                                autoCorrect="off"
                                autoCapitalize="off"
                                spellCheck="false"
                            />
                        </div>
                        <button type="submit" className={styles.resetButton} disabled={loading}>
                            {loading ? 'Sending...' : 'Send Reset Link'}
                        </button>
                        <p className={styles.backToLogin}>
                            Remember your password? <span onClick={() => navigate('/login')}>Back to Login</span>
                        </p>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ResetPassword; 