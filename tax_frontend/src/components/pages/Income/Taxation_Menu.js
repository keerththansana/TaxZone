import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import styles from './Taxation_Menu.module.css';

const TaxationMenu = () => {
    const navigate = useNavigate();
    const location = useLocation();
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

    return (
        <div className={styles.menuContainer}>
            <div className={styles.menuWrapper}>
                {combinedMenuItems.map((item, index) => (
                    <React.Fragment key={item.id}>
                        <div 
                            className={`${styles.menuItem} ${isActive(item.path) ? styles.active : ''} ${
                                item.id === 'taxation' || item.id === 'preview' ? styles.fixed : ''
                            }`}
                            onClick={() => handleMenuClick(item.path, item.id)}
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