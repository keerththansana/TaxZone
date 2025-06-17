import axios from 'axios';

// Create a single axios instance with default configuration
const axiosInstance = axios.create({
    // Use relative URLs since we have proxy configured in package.json
    baseURL: '',
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json'
    }
});

export default axiosInstance;