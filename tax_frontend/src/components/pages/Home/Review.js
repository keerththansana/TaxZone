import React, { useState, useEffect } from 'react';
import { Star, ChevronLeft, ChevronRight } from 'lucide-react';
import './Review.css';

const Review = () => {
    const [reviews, setReviews] = useState([]);
    const [currentSlide, setCurrentSlide] = useState(0);

    // Function to load reviews from localStorage
    const loadReviews = () => {
        fetch('/api/users/tax-reviews/list/')
            .then(res => res.json())
            .then(data => {
                setReviews(data);
                localStorage.setItem('reviews', JSON.stringify(data));
            })
            .catch(() => {
                // fallback to localStorage if needed
                const storedReviews = JSON.parse(localStorage.getItem('reviews') || '[]');
                setReviews(storedReviews);
            });
    };

    useEffect(() => {
        // Load reviews on component mount
        loadReviews();

        // Listen for review updates
        const handleReviewsUpdated = () => {
            loadReviews();
        };

        window.addEventListener('reviewsUpdated', handleReviewsUpdated);

        // Cleanup
        return () => {
            window.removeEventListener('reviewsUpdated', handleReviewsUpdated);
        };
    }, []);

    const nextSlide = () => {
        setCurrentSlide((prev) => (prev + 3 >= reviews.length ? 0 : prev + 3));
    };

    const prevSlide = () => {
        setCurrentSlide((prev) => (prev - 3 < 0 ? Math.max(0, reviews.length - 3) : prev - 3));
    };

    const visibleReviews = reviews.slice(currentSlide, currentSlide + 3);

    return (
        <section className="review-section">
            <h2>What Our Users Say</h2>
            <div className="review-description">
                <p>
                    Discover what our valued users have to say about their experience with our AI-powered tax platform. 
                    From accurate calculations to personalized guidance, our users trust us to simplify their tax filing process 
                    and ensure compliance with Sri Lanka's tax.
                </p>
            </div>
            <div className="review-container">
                {reviews.length > 3 && (
                    <button className="nav-button prev" onClick={prevSlide}>
                        <ChevronLeft size={24} />
                    </button>
                )}
                {visibleReviews.map((review) => (
                    <div key={review.id} className="review-card">
                        <div className="review-header">
                            <img 
                                src={review.image} 
                                alt={review.name} 
                                className="reviewer-image"
                            />
                            <div className="reviewer-info">
                                <h3>{review.name}</h3>
                                <p className="reviewer-role">{review.role || 'User'}</p>
                            </div>
                        </div>
                        <div className="rating">
                            {[...Array(review.rating)].map((_, index) => (
                                <Star 
                                    key={index}
                                    size={20}
                                    fill="#023636"
                                    color="#023636"
                                />
                            ))}
                        </div>
                        <p className="review-text">{review.comment}</p>
                    </div>
                ))}
                {reviews.length > 3 && (
                    <button className="nav-button next" onClick={nextSlide}>
                        <ChevronRight size={24} />
                    </button>
                )}
            </div>
        </section>
    );
};

export default Review;