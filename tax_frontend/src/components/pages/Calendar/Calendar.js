import React, { useState, useEffect } from 'react';
import Header from '../../common/Header/Header';
import styles from './Calendar.module.css';
import TaxNotificationService from '../../../services/taxNotificationService';

const Calendar = () => {
    const [selectedYear, setSelectedYear] = useState('2024/2025');
    const [activeView, setActiveView] = useState('monthly'); // 'monthly', 'quarterly', 'yearly'
    const [calendarData, setCalendarData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        let isMounted = true;
        setLoading(true);
        setError(null);
        TaxNotificationService.getCalendarData(selectedYear)
            .then((data) => {
                if (isMounted) {
                    setCalendarData(data);
                    setLoading(false);
                }
            })
            .catch((err) => {
                if (isMounted) {
                    setError('Failed to load calendar data.');
                    setLoading(false);
                }
            });
        return () => { isMounted = false; };
    }, [selectedYear]);

    const renderContent = () => {
        if (!calendarData) return null;
        const section = calendarData[activeView];
        if (!section) return null;
        const { deadlines, summary } = section;
        return (
            <>
                <h3 className={styles.sectionHeading}>{summary}</h3>
                {deadlines.length === 0 && <p>No deadlines available.</p>}
                {deadlines.map((item, index) => (
                    <p key={item.id || index}>
                        {item.title}: <strong>{TaxNotificationService.formatDeadlineDate(item.deadline_date)}</strong>
                    </p>
                ))}
            </>
        );
    };

    return (
        <div className="calendar-page">
            <Header />
            <div className={styles.calendarContainer}>
                <h2 className={styles.title}>Tax Calendar</h2>
                <div className={styles.controls}>
                    <label htmlFor="year-select" className={styles.yearLabel}>Year</label>
                    <select
                        id="year-select"
                        className={styles.yearDropdown}
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(e.target.value)}
                    >
                        <option value="2024/2025">2024/2025</option>
                        <option value="2025/2026">2025/2026</option>
                    </select>
                </div>

                <div className={styles.buttonGroup}>
                    <button
                        className={`${styles.button} ${activeView === 'monthly' ? styles.active : ''}`}
                        onClick={() => setActiveView('monthly')}
                    >
                        Monthly
                    </button>
                    <button
                        className={`${styles.button} ${activeView === 'quarterly' ? styles.active : ''}`}
                        onClick={() => setActiveView('quarterly')}
                    >
                        Quarterly
                    </button>
                    <button
                        className={`${styles.button} ${activeView === 'yearly' ? styles.active : ''}`}
                        onClick={() => setActiveView('yearly')}
                    >
                        Yearly
                    </button>
                </div>

                <div className={styles.contentArea}>
                    {loading && <p>Loading...</p>}
                    {error && <p style={{ color: 'red' }}>{error}</p>}
                    {!loading && !error && renderContent()}
                </div>
            </div>
        </div>
    );
};

export default Calendar;
