import React, { useState } from 'react';
import Header from '../../common/Header/Header';
import styles from './Calendar.module.css';

const Calendar = () => {
    const [selectedYear, setSelectedYear] = useState('2024/2025');
    const [activeView, setActiveView] = useState('monthly'); // 'monthly', 'quarterly', 'yearly'

    // Define the tax data with structured headings and content
    const taxData = {
        '2024/2025': {
            monthly: [
                { type: 'heading', text: 'Monthly Obligations' },
                { type: 'paragraph', text: 'Advance Personal Income Tax (APIT) & Advance Income Tax (AIT)/Withholding Tax (WHT):' },
                { type: 'paragraph', text: '2024: Payments due by the 15th of the following month.' },
            ],
            quarterly: [
                { type: 'heading', text: 'Quarterly Obligations' },
                { type: 'paragraph', text: 'Self-Assessment Tax Instalments:' },
                { type: 'paragraph', text: '2024:' },
                { type: 'paragraph', text: '1st Instalment: 15 August 2024' },
                { type: 'paragraph', text: '2nd Instalment: 15 November 2024' },
                { type: 'paragraph', text: '3rd Instalment: 15 February 2025' },
                { type: 'paragraph', text: 'Final Payment: 30 September 2025' },
                { type: 'paragraph', text: 'Note: The instalment dates remain consistent year over year.' },
            ],
            yearly: [
                { type: 'heading', text: 'Annual Obligations' },
                { type: 'paragraph', text: 'Statement of Estimated Tax (SET):' },
                { type: 'paragraph', text: '2024: Due by 15 August 2024 for the Year of Assessment (Y/A) 2024/2025.' },
                { type: 'paragraph', text: 'Income Tax Return Filing:' },
                { type: 'paragraph', text: '2024: Due by 30 November 2024 for Y/A 2023/2024.' },
                { type: 'paragraph', text: 'Note: Filing deadlines remain unchanged.' },
            ]
        },
        '2025/2026': {
            monthly: [
                { type: 'heading', text: 'Monthly Obligations' },
                { type: 'paragraph', text: 'Advance Personal Income Tax (APIT) & Advance Income Tax (AIT)/Withholding Tax (WHT):' },
                { type: 'paragraph', text: '2025: No change; payments continue to be due by the 15th of the following month.' },
            ],
            quarterly: [
                { type: 'heading', text: 'Quarterly Obligations' },
                { type: 'paragraph', text: 'Self-Assessment Tax Instalments:' },
                { type: 'paragraph', text: '2025:' },
                { type: 'paragraph', text: '1st Instalment: 15 August 2025' },
                { type: 'paragraph', text: '2nd Instalment: 15 November 2025' },
                { type: 'paragraph', text: '3rd Instalment: 15 February 2026' },
                { type: 'paragraph', text: 'Final Payment: 30 September 2026' },
                { type: 'paragraph', text: 'Note: The instalment dates remain consistent year over year.' },
            ],
            yearly: [
                { type: 'heading', text: 'Annual Obligations' },
                { type: 'paragraph', text: 'Statement of Estimated Tax (SET):' },
                { type: 'paragraph', text: '2025: Due by 15 August 2025 for Y/A 2025/2026.' },
                { type: 'paragraph', text: 'Income Tax Return Filing:' },
                { type: 'paragraph', text: '2025: Due by 30 November 2025 for Y/A 2024/2025.' },
                { type: 'paragraph', text: 'Note: Filing deadlines remain unchanged.' },
            ]
        }
    };

    const renderContent = () => {
        const contentArray = taxData[selectedYear][activeView];
        const dateRegex = /\b(\d{1,2} (?:January|February|March|April|May|June|July|August|September|October|November|December) \d{4})\b/g;

        return contentArray.map((item, index) => {
            if (item.type === 'heading') {
                return <h3 key={index} className={styles.sectionHeading}>{item.text}</h3>;
            } else {
                const parts = [];
                let lastIndex = 0;
                let match;
                const line = item.text;

                while ((match = dateRegex.exec(line)) !== null) {
                    // Add text before the date
                    parts.push(line.substring(lastIndex, match.index));

                    // Add the bolded date
                    parts.push(<strong key={`${index}-${match.index}`}>{match[0]}</strong>);

                    lastIndex = dateRegex.lastIndex;
                }
                // Add any remaining text after the last date
                parts.push(line.substring(lastIndex));

                return <p key={index}>{parts}</p>;
            }
        });
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
                    {renderContent()}
                </div>
            </div>
        </div>
    );
};

export default Calendar;
