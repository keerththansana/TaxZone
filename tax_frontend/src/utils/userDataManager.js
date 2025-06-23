import { saveUserData, loadUserData, clearUserData, getUserKey } from '../components/pages/Income/Data_Persistence';

// User Data Manager for comprehensive taxation data persistence
export class UserDataManager {
    constructor() {
        this.user = this.getCurrentUser();
    }

    getCurrentUser() {
        try {
            const userData = localStorage.getItem('user');
            return userData ? JSON.parse(userData) : null;
        } catch (error) {
            console.error('Error getting current user:', error);
            return null;
        }
    }

    // Check if user is logged in
    isUserLoggedIn() {
        return this.user !== null;
    }

    // Get user ID for storage keys
    getUserId() {
        if (!this.user) return 'anonymous';
        return this.user.id || this.user.username || 'anonymous';
    }

    // Save complete taxation session data
    saveTaxationSession(data) {
        if (!this.isUserLoggedIn()) {
            console.warn('User not logged in, cannot save taxation session');
            return false;
        }

        try {
            const sessionData = {
                ...data,
                lastUpdated: new Date().toISOString(),
                userId: this.getUserId()
            };

            saveUserData('taxationSession', sessionData);
            console.log('Taxation session saved successfully');
            return true;
        } catch (error) {
            console.error('Error saving taxation session:', error);
            return false;
        }
    }

    // Load complete taxation session data
    loadTaxationSession() {
        if (!this.isUserLoggedIn()) {
            console.warn('User not logged in, cannot load taxation session');
            return null;
        }

        try {
            const sessionData = loadUserData('taxationSession');
            if (sessionData && sessionData.userId === this.getUserId()) {
                console.log('Taxation session loaded successfully');
                return sessionData;
            }
            return null;
        } catch (error) {
            console.error('Error loading taxation session:', error);
            return null;
        }
    }

    // Save specific form data
    saveFormData(formType, data) {
        if (!this.isUserLoggedIn()) {
            console.warn('User not logged in, cannot save form data');
            return false;
        }

        try {
            const formData = {
                ...data,
                lastUpdated: new Date().toISOString(),
                formType: formType
            };

            saveUserData(`${formType}FormData`, formData);
            console.log(`${formType} form data saved successfully`);
            return true;
        } catch (error) {
            console.error(`Error saving ${formType} form data:`, error);
            return false;
        }
    }

    // Load specific form data
    loadFormData(formType) {
        if (!this.isUserLoggedIn()) {
            console.warn('User not logged in, cannot load form data');
            return null;
        }

        try {
            const formData = loadUserData(`${formType}FormData`);
            if (formData && formData.formType === formType) {
                console.log(`${formType} form data loaded successfully`);
                return formData;
            }
            return null;
        } catch (error) {
            console.error(`Error loading ${formType} form data:`, error);
            return null;
        }
    }

    // Save document upload data
    saveDocumentData(documents) {
        if (!this.isUserLoggedIn()) {
            console.warn('User not logged in, cannot save document data');
            return false;
        }

        try {
            const documentData = {
                documents: documents,
                lastUpdated: new Date().toISOString()
            };

            saveUserData('uploadedDocuments', documentData);
            console.log('Document data saved successfully');
            return true;
        } catch (error) {
            console.error('Error saving document data:', error);
            return false;
        }
    }

    // Load document upload data
    loadDocumentData() {
        if (!this.isUserLoggedIn()) {
            console.warn('User not logged in, cannot load document data');
            return null;
        }

        try {
            const documentData = loadUserData('uploadedDocuments');
            if (documentData) {
                console.log('Document data loaded successfully');
                return documentData;
            }
            return null;
        } catch (error) {
            console.error('Error loading document data:', error);
            return null;
        }
    }

    // Save user profile data (TIN, full name, etc.)
    saveUserProfile(profileData) {
        if (!this.isUserLoggedIn()) {
            console.warn('User not logged in, cannot save profile data');
            return false;
        }

        try {
            const profile = {
                ...profileData,
                lastUpdated: new Date().toISOString()
            };

            saveUserData('userProfile', profile);
            console.log('User profile saved successfully');
            return true;
        } catch (error) {
            console.error('Error saving user profile:', error);
            return false;
        }
    }

    // Load user profile data
    loadUserProfile() {
        if (!this.isUserLoggedIn()) {
            console.warn('User not logged in, cannot load profile data');
            return null;
        }

        try {
            const profile = loadUserData('userProfile');
            if (profile) {
                console.log('User profile loaded successfully');
                return profile;
            }
            return null;
        } catch (error) {
            console.error('Error loading user profile:', error);
            return null;
        }
    }

    // Save selected categories
    saveSelectedCategories(categories) {
        if (!this.isUserLoggedIn()) {
            console.warn('User not logged in, cannot save selected categories');
            return false;
        }

        try {
            saveUserData('selectedCategories', categories);
            console.log('Selected categories saved successfully');
            return true;
        } catch (error) {
            console.error('Error saving selected categories:', error);
            return false;
        }
    }

    // Load selected categories
    loadSelectedCategories() {
        if (!this.isUserLoggedIn()) {
            console.warn('User not logged in, cannot load selected categories');
            return [];
        }

        try {
            const categories = loadUserData('selectedCategories', []);
            console.log('Selected categories loaded successfully');
            return categories;
        } catch (error) {
            console.error('Error loading selected categories:', error);
            return [];
        }
    }

    // Save current step/progress
    saveCurrentStep(step) {
        if (!this.isUserLoggedIn()) {
            console.warn('User not logged in, cannot save current step');
            return false;
        }

        try {
            const stepData = {
                step: step,
                lastUpdated: new Date().toISOString()
            };

            saveUserData('currentStep', stepData);
            console.log('Current step saved successfully');
            return true;
        } catch (error) {
            console.error('Error saving current step:', error);
            return false;
        }
    }

    // Load current step/progress
    loadCurrentStep() {
        if (!this.isUserLoggedIn()) {
            console.warn('User not logged in, cannot load current step');
            return null;
        }

        try {
            const stepData = loadUserData('currentStep');
            if (stepData) {
                console.log('Current step loaded successfully');
                return stepData;
            }
            return null;
        } catch (error) {
            console.error('Error loading current step:', error);
            return null;
        }
    }

    // Save analysis results
    saveAnalysisResults(results) {
        if (!this.isUserLoggedIn()) {
            console.warn('User not logged in, cannot save analysis results');
            return false;
        }

        try {
            const analysisData = {
                results: results,
                lastUpdated: new Date().toISOString()
            };

            saveUserData('analysisResults', analysisData);
            console.log('Analysis results saved successfully');
            return true;
        } catch (error) {
            console.error('Error saving analysis results:', error);
            return false;
        }
    }

    // Load analysis results
    loadAnalysisResults() {
        if (!this.isUserLoggedIn()) {
            console.warn('User not logged in, cannot load analysis results');
            return null;
        }

        try {
            const analysisData = loadUserData('analysisResults');
            if (analysisData) {
                console.log('Analysis results loaded successfully');
                return analysisData;
            }
            return null;
        } catch (error) {
            console.error('Error loading analysis results:', error);
            return null;
        }
    }

    // Clear all user data
    clearAllUserData() {
        if (!this.isUserLoggedIn()) {
            console.warn('User not logged in, cannot clear user data');
            return false;
        }

        try {
            const keysToClear = [
                'taxationSession',
                'userProfile',
                'selectedCategories',
                'currentStep',
                'analysisResults',
                'uploadedDocuments',
                'employmentFormData',
                'businessFormData',
                'investmentFormData',
                'terminalFormData',
                'otherFormData',
                'qualifyingPaymentsFormData'
            ];

            keysToClear.forEach(key => {
                clearUserData(key);
            });

            console.log('All user data cleared successfully');
            return true;
        } catch (error) {
            console.error('Error clearing user data:', error);
            return false;
        }
    }

    // Get all user data summary
    getUserDataSummary() {
        if (!this.isUserLoggedIn()) {
            return null;
        }

        try {
            const summary = {
                user: this.user,
                hasProfile: !!this.loadUserProfile(),
                hasDocuments: !!this.loadDocumentData(),
                hasAnalysis: !!this.loadAnalysisResults(),
                selectedCategories: this.loadSelectedCategories(),
                currentStep: this.loadCurrentStep(),
                lastUpdated: new Date().toISOString()
            };

            return summary;
        } catch (error) {
            console.error('Error getting user data summary:', error);
            return null;
        }
    }

    // Restore complete user session
    restoreUserSession() {
        if (!this.isUserLoggedIn()) {
            console.warn('User not logged in, cannot restore session');
            return null;
        }

        try {
            const session = {
                profile: this.loadUserProfile(),
                documents: this.loadDocumentData(),
                analysis: this.loadAnalysisResults(),
                categories: this.loadSelectedCategories(),
                step: this.loadCurrentStep(),
                forms: {
                    employment: this.loadFormData('employment'),
                    business: this.loadFormData('business'),
                    investment: this.loadFormData('investment'),
                    terminal: this.loadFormData('terminal'),
                    other: this.loadFormData('other'),
                    qualifyingPayments: this.loadFormData('qualifyingPayments')
                }
            };

            console.log('User session restored successfully');
            return session;
        } catch (error) {
            console.error('Error restoring user session:', error);
            return null;
        }
    }
}

// Create a singleton instance
export const userDataManager = new UserDataManager();

// Export utility functions for backward compatibility
export const saveUserTaxationData = (data) => userDataManager.saveTaxationSession(data);
export const loadUserTaxationData = () => userDataManager.loadTaxationSession();
export const saveUserFormData = (formType, data) => userDataManager.saveFormData(formType, data);
export const loadUserFormData = (formType) => userDataManager.loadFormData(formType);
export const saveUserDocuments = (documents) => userDataManager.saveDocumentData(documents);
export const loadUserDocuments = () => userDataManager.loadDocumentData();
export const saveUserProfile = (profile) => userDataManager.saveUserProfile(profile);
export const loadUserProfile = () => userDataManager.loadUserProfile();
export const restoreUserSession = () => userDataManager.restoreUserSession(); 