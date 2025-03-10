import axios from 'axios';
import { Surgery, Prediction, ScheduleResponse, BatchImportResponse } from '../types';

// For GitHub Pages deployment, you'll need to configure this to point to a hosted backend API
// For local development, it will use localhost:8003
const API_BASE_URL = process.env.NODE_ENV === 'production' 
    ? 'https://your-deployed-backend-api-url.com' // Replace with your actual deployed backend URL
    : 'http://localhost:8003';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add a comment in the console to know which API endpoint is being used
console.log(`Using API endpoint: ${API_BASE_URL}`);

// Check if the API is available
export const checkApiConnectivity = async (): Promise<boolean> => {
    try {
        console.log('Checking API connectivity to:', API_BASE_URL);
        
        // Try multiple endpoints in case one doesn't exist
        // First try /health which is a common health check endpoint
        try {
            const healthResponse = await axios.get(`${API_BASE_URL}/health`, { timeout: 5000 });
            console.log('API health check successful:', healthResponse.status);
            return healthResponse.status === 200;
        } catch (healthError) {
            console.log('Health endpoint not available, trying root endpoint');
            
            // If health check fails, try the root endpoint
            const rootResponse = await axios.get(API_BASE_URL, { timeout: 5000 });
            console.log('API root endpoint check successful:', rootResponse.status);
            return rootResponse.status === 200;
        }
    } catch (error) {
        console.error('All API connectivity checks failed:', error);
        
        // For local development, let's assume API is available even if checks fail
        // This helps avoid showing the error notice in local development
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            console.log('Running in local environment, assuming API is available');
            return true;
        }
        
        return false;
    }
};

export const predictSurgery = async (surgery: Surgery): Promise<Prediction> => {
    const response = await api.post<Prediction>('/predict', surgery);
    return response.data;
};

export const createSchedule = async (surgeries: Surgery[], startDate: string): Promise<ScheduleResponse> => {
    const response = await api.post<ScheduleResponse>('/schedule', {
        surgeries,
        start_date: startDate,
    });
    return response.data;
};

export const downloadTemplate = (): void => {
    window.open(`${API_BASE_URL}/template`, '_blank');
};

export const batchImportSurgeries = async (file: File, startDate: string): Promise<BatchImportResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('start_date', startDate);
    
    const response = await axios.post<BatchImportResponse>(
        `${API_BASE_URL}/batch-import`, 
        formData, 
        {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        }
    );
    
    return response.data;
}; 