import React, { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import styles from './Taxation_Menu.module.css';

const TaxationMenu = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const menuContainerRef = useRef(null);
    const selectedCategories = JSON.parse(sessionStorage.getItem('selectedCategories') || '[]');

    const menuItems = [
        { id: 'employment', label: 'Employment Income', path: '/employment_income' },
        { id: 'business', label: 'Business Income', path: '/business_income' },
        { id: 'investment', label: 'Investment Income', path: '/investment_income' },
        { id: 'other', label: 'Other Income', path: '/other_income' },
        { id: 'terminal', label: 'Terminal Benefits', path: '/terminal_benefits' },
        { id: 'qualifying', label: 'Qualifying Payments', path: '/qualifying_payments' }
    ];

    // Filter selected income categories
    const filteredIncomeItems = menuItems.filter(item => 
        selectedCategories.includes(item.id)
    );

    // Combine fixed items with filtered income items
    const combinedMenuItems = [
        { id: 'taxation', label: 'Taxation', path: '/taxation' },
        ...filteredIncomeItems,
        { id: 'preview', label: 'Preview', path: '/preview' }
    ];

    const isActive = (path) => {
        return location.pathname === path;
    };

    const handleMenuClick = (path, itemId) => {
        const selectedCategories = JSON.parse(sessionStorage.getItem('selectedCategories') || '[]');
        const currentCategory = sessionStorage.getItem('currentCategory');

        // Only allow navigation if category is selected or it's taxation/preview
        if (itemId === 'taxation' || itemId === 'preview' || selectedCategories.includes(itemId)) {
            // Update current category when navigating
            if (itemId !== 'taxation' && itemId !== 'preview') {
                sessionStorage.setItem('currentCategory', itemId);
            }
            navigate(path);
        }
    };

    // Handle touch events for mobile scrolling
    useEffect(() => {
        const container = menuContainerRef.current;
        if (!container) return;

        let isScrolling = false;
        let startX;
        let scrollLeft;
        let lastScrollLeft = 0;

        const handleTouchStart = (e) => {
            isScrolling = true;
            startX = e.touches[0].pageX - container.offsetLeft;
            scrollLeft = container.scrollLeft;
            container.style.cursor = 'grabbing';
        };

        const handleTouchMove = (e) => {
            if (!isScrolling) return;
            e.preventDefault();
            const x = e.touches[0].pageX - container.offsetLeft;
            const walk = (x - startX) * 2;
            container.scrollLeft = scrollLeft - walk;
            lastScrollLeft = container.scrollLeft;
        };

        const handleTouchEnd = () => {
            isScrolling = false;
            container.style.cursor = 'grab';
            
            // Ensure the active item is visible
            const activeItem = container.querySelector(`.${styles.active}`);
            if (activeItem) {
                const containerWidth = container.offsetWidth;
                const itemLeft = activeItem.offsetLeft;
                const itemWidth = activeItem.offsetWidth;
                
                // If active item is not fully visible, scroll it into view
                if (itemLeft < container.scrollLeft || 
                    itemLeft + itemWidth > container.scrollLeft + containerWidth) {
                    container.scrollTo({
                        left: itemLeft - (containerWidth - itemWidth) / 2,
                        behavior: 'smooth'
                    });
                }
            }
        };

        // Handle mouse events for desktop
        const handleMouseDown = (e) => {
            isScrolling = true;
            startX = e.pageX - container.offsetLeft;
            scrollLeft = container.scrollLeft;
            container.style.cursor = 'grabbing';
        };

        const handleMouseMove = (e) => {
            if (!isScrolling) return;
            e.preventDefault();
            const x = e.pageX - container.offsetLeft;
            const walk = (x - startX) * 2;
            container.scrollLeft = scrollLeft - walk;
        };

        const handleMouseUp = () => {
            isScrolling = false;
            container.style.cursor = 'grab';
        };

        // Add event listeners
        container.addEventListener('touchstart', handleTouchStart, { passive: false });
        container.addEventListener('touchmove', handleTouchMove, { passive: false });
        container.addEventListener('touchend', handleTouchEnd);
        container.addEventListener('mousedown', handleMouseDown);
        container.addEventListener('mousemove', handleMouseMove);
        container.addEventListener('mouseup', handleMouseUp);
        container.addEventListener('mouseleave', handleMouseUp);

        // Set initial cursor style
        container.style.cursor = 'grab';

        return () => {
            container.removeEventListener('touchstart', handleTouchStart);
            container.removeEventListener('touchmove', handleTouchMove);
            container.removeEventListener('touchend', handleTouchEnd);
            container.removeEventListener('mousedown', handleMouseDown);
            container.removeEventListener('mousemove', handleMouseMove);
            container.removeEventListener('mouseup', handleMouseUp);
            container.removeEventListener('mouseleave', handleMouseUp);
        };
    }, []);

    // Scroll active item into view on mount and route change
    useEffect(() => {
        const container = menuContainerRef.current;
        if (!container) return;

        const activeItem = container.querySelector(`.${styles.active}`);
        if (activeItem) {
            const containerWidth = container.offsetWidth;
            const itemLeft = activeItem.offsetLeft;
            const itemWidth = activeItem.offsetWidth;
            
            container.scrollTo({
                left: itemLeft - (containerWidth - itemWidth) / 2,
                behavior: 'smooth'
            });
        }
    }, [location.pathname]);

    return (
        <div className={styles.menuContainer} ref={menuContainerRef}>
            <div className={styles.menuWrapper}>
                {combinedMenuItems.map((item, index) => (
                    <React.Fragment key={item.id}>
                        <div 
                            className={`${styles.menuItem} ${isActive(item.path) ? styles.active : ''} ${
                                item.id === 'taxation' || item.id === 'preview' ? styles.fixed : ''
                            }`}
                            onClick={() => handleMenuClick(item.path, item.id)}
                            role="button"
                            tabIndex={0}
                            onKeyPress={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    handleMenuClick(item.path, item.id);
                                }
                            }}
                        >
                            <span className={styles.menuNumber}>{index + 1}</span>
                            <span className={styles.menuLabel}>{item.label}</span>
                        </div>
                        {index < combinedMenuItems.length - 1 && (
                            <div className={styles.connector} />
                        )}
                    </React.Fragment>
                ))}
            </div>
        </div>
    );
};

export default TaxationMenu;