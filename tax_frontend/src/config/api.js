const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

export const API_ENDPOINTS = {
    AUTO_FILL: `${API_BASE_URL}/api/tax-report/auto-fill/`,
    UPLOAD_DOCUMENT: `${API_BASE_URL}/api/tax-report/upload-document/`,
    GET_DOCUMENTS: `${API_BASE_URL}/api/tax-report/documents/`,
    GET_DOCUMENT: `${API_BASE_URL}/api/tax-report/documents/`,
    DELETE_DOCUMENT: `${API_BASE_URL}/api/tax-report/documents/`,
    ANALYZE_DOCUMENT: `${API_BASE_URL}/api/tax-report/analyze-document/`,
    EXTRACT_CONTEXT: `${API_BASE_URL}/api/tax-report/documents/`,
    GET_FORM_MAPPINGS: `${API_BASE_URL}/api/tax-report/documents/`,
    CLEANUP_SESSION: `${API_BASE_URL}/api/tax-report/cleanup-session/`,
}; 