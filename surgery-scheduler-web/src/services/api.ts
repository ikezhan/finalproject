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
        // We use a 3 second timeout for quick feedback
        const response = await axios.get(`${API_BASE_URL}/health`, { timeout: 3000 });
        return response.status === 200;
    } catch (error) {
        console.error('API connectivity check failed:', error);
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