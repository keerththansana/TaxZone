import React, { useState, useEffect } from 'react';
import { Star, ChevronLeft, ChevronRight } from 'lucide-react';
import './Review.css';

const Review = () => {
    const [reviews, setReviews] = useState([]);
    const [currentSlide, setCurrentSlide] = useState(0);

    // Function to load reviews from localStorage
    const loadReviews = () => {
        const storedReviews = JSON.parse(localStorage.getItem('reviews') || '[]');
        // If no reviews in localStorage, use default reviews
        if (storedReviews.length === 0) {
            const defaultReviews = [
                {
                    id: 1,
                    name: "John Smith",
                    role: "Small Business Owner",
                    rating: 5,
                    comment: "This AI tax assistant has transformed how I handle my business taxes. The real-time guidance and automated calculations are invaluable.",
                    image: "https://randomuser.me/api/portraits/men/1.jpg"
                },
                {
                    id: 2,
                    name: "Sarah Fernando",
                    role: "Freelancer",
                    rating: 5,
                    comment: "As a freelancer, keeping track of tax obligations was challenging. This platform makes it simple and intuitive. Highly recommended!",
                    image: "https://randomuser.me/api/portraits/women/2.jpg"
                },
                {
                    id: 3,
                    name: "David Perera",
                    role: "Corporate Employee",
                    rating: 4,
                    comment: "The APIT calculator and policy updates have been extremely helpful. It's like having a personal tax consultant available 24/7.",
                    image: "https://randomuser.me/api/portraits/men/3.jpg"
                }
            ];
            setReviews(defaultReviews);
            localStorage.setItem('reviews', JSON.stringify(defaultReviews));
        } else {
            setReviews(storedReviews);
        }
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