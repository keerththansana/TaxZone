import React, { useState, useEffect } from 'react';
import { FaStar } from 'react-icons/fa';
import './ReviewFrom.css';

const ReviewForm = () => {
    const [rating, setRating] = useState(0);
    const [hover, setHover] = useState(0);
    const [feedback, setFeedback] = useState('');
    const [userName, setUserName] = useState('');
    const [position, setPosition] = useState('');
    const [submitted, setSubmitted] = useState(false);

    useEffect(() => {
        // Get user data from localStorage
        const userData = localStorage.getItem('user');
        if (userData) {
            try {
                const parsedUser = JSON.parse(userData);
                // Use name if available, otherwise use username
                setUserName(parsedUser.name || parsedUser.username || '');
            } catch (error) {
                console.error('Error parsing user data:', error);
            }
        }
    }, []);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (rating === 0) {
            alert('Please select a rating');
            return;
        }

        // Create new review object
        const newReview = {
            id: Date.now(), // Use timestamp as unique ID
            name: userName,
            role: position,
            rating: rating,
            comment: feedback,
            date: new Date().toISOString(),
            image: `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=023636&color=fff`
        };

        // Get existing reviews from localStorage
        const existingReviews = JSON.parse(localStorage.getItem('reviews') || '[]');
        
        // Add new review to the beginning of the array
        const updatedReviews = [newReview, ...existingReviews];
        
        // Store updated reviews in localStorage
        localStorage.setItem('reviews', JSON.stringify(updatedReviews));

        // Dispatch custom event to notify Review component
        window.dispatchEvent(new CustomEvent('reviewsUpdated'));

        // Reset form
        setRating(0);
        setFeedback('');
        setPosition('');
        setSubmitted(true);
    };

    return (
        <div className="review-form-container">
            <div className="review-form-content">
                <h1>Share Your Experience</h1>
                <p>We value your feedback! Please take a moment to rate our service and share your thoughts.</p>

                {!submitted ? (
                    <form onSubmit={handleSubmit} className="review-form">
                        <div className="form-group">
                            <label>Your Name:</label>
                            <input
                                type="text"
                                value={userName}
                                onChange={(e) => setUserName(e.target.value)}
                                required
                                placeholder="Enter your name"
                                disabled={userName !== ''} // Disable if name is pre-filled
                            />
                        </div>

                        <div className="form-group">
                            <label>Your Position:</label>
                            <input
                                type="text"
                                value={position}
                                onChange={(e) => setPosition(e.target.value)}
                                required
                                placeholder="e.g., Small Business Owner, Freelancer, Corporate Employee"
                            />
                        </div>

                        <div className="form-group">
                            <label>Your Rating:</label>
                            <div className="stars-container">
                                {[...Array(5)].map((_, index) => {
                                    const ratingValue = index + 1;
                                    return (
                                        <FaStar
                                            key={index}
                                            className="star"
                                            color={ratingValue <= (hover || rating) ? "#023636" : "#e4e5e9"}
                                            size={30}
                                            onClick={() => setRating(ratingValue)}
                                            onMouseEnter={() => setHover(ratingValue)}
                                            onMouseLeave={() => setHover(0)}
                                        />
                                    );
                                })}
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Your Feedback:</label>
                            <textarea
                                value={feedback}
                                onChange={(e) => setFeedback(e.target.value)}
                                placeholder="Share your experience with us..."
                                required
                            />
                        </div>

                        <button type="submit" className="submit-button">
                            Submit Review
                        </button>
                    </form>
                ) : (
                    <div className="thank-you-message">
                        <h2>Thank You for Your Feedback!</h2>
                        <p>Your review has been submitted successfully.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ReviewForm;
