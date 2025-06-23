import { API_ENDPOINTS } from '../config/api';

class TaxNotificationService {
    /**
     * Fetch calendar data for a specific year
     * @param {string} yearAssessment - The assessment year (e.g., '2024/2025')
     * @returns {Promise} - Promise with calendar data
     */
    async getCalendarData(yearAssessment = '2024/2025') {
        try {
            const response = await fetch(`${API_ENDPOINTS.CALENDAR_DATA}?year_assessment=${yearAssessment}`, {
                cache: 'no-store'
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.error || 'Failed to fetch calendar data');
            }
            
            return data.data;
        } catch (error) {
            console.error('Error fetching calendar data:', error);
            throw error;
        }
    }

    /**
     * Fetch available assessment years
     * @returns {Promise} - Promise with available years
     */
    async getAvailableYears() {
        try {
            const response = await fetch(API_ENDPOINTS.AVAILABLE_YEARS);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.error || 'Failed to fetch available years');
            }
            
            return data.years;
        } catch (error) {
            console.error('Error fetching available years:', error);
            throw error;
        }
    }

    /**
     * Fetch all tax deadlines with optional filters
     * @param {Object} filters - Optional filters (year_assessment, deadline_type)
     * @returns {Promise} - Promise with deadlines data
     */
    async getTaxDeadlines(filters = {}) {
        try {
            const queryParams = new URLSearchParams();
            
            if (filters.year_assessment) {
                queryParams.append('year_assessment', filters.year_assessment);
            }
            
            if (filters.deadline_type) {
                queryParams.append('deadline_type', filters.deadline_type);
            }
            
            const url = queryParams.toString() 
                ? `${API_ENDPOINTS.TAX_DEADLINES}?${queryParams.toString()}`
                : API_ENDPOINTS.TAX_DEADLINES;
            
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching tax deadlines:', error);
            throw error;
        }
    }

    /**
     * Format deadline date for display
     * @param {string} dateString - ISO date string
     * @returns {string} - Formatted date string
     */
    formatDeadlineDate(dateString) {
        const date = new Date(dateString);
        const options = { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        };
        return date.toLocaleDateString('en-US', options);
    }

    /**
     * Check if a deadline is overdue
     * @param {string} deadlineDate - ISO date string
     * @returns {boolean} - True if overdue
     */
    isDeadlineOverdue(deadlineDate) {
        const today = new Date();
        const deadline = new Date(deadlineDate);
        return deadline < today;
    }

    /**
     * Get days until deadline
     * @param {string} deadlineDate - ISO date string
     * @returns {number} - Days until deadline (negative if overdue)
     */
    getDaysUntilDeadline(deadlineDate) {
        const today = new Date();
        const deadline = new Date(deadlineDate);
        const diffTime = deadline - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    }
}

export default new TaxNotificationService(); 