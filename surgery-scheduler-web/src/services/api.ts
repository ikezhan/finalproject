import axios from 'axios';
import { Surgery, Prediction, ScheduleResponse, BatchImportResponse } from '../types';
import { mockPrediction, mockSchedule, mockBatchImport, mockTemplateUrl } from './mockData';

// For GitHub Pages deployment, we'll use mock data instead of a real API
// For local development, it will use localhost:8003
const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const API_BASE_URL = 'http://localhost:8003';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Log whether we're using mock data or real API
console.log(`Environment: ${process.env.NODE_ENV}`);
console.log(`Using ${IS_PRODUCTION ? 'mock data' : `API endpoint: ${API_BASE_URL}`}`);

export const predictSurgery = async (surgery: Surgery): Promise<Prediction> => {
    if (IS_PRODUCTION) {
        // Use mock data in production (GitHub Pages)
        console.log('Using mock prediction data');
        return mockPrediction(surgery);
    }
    
    // Use real API in development
    const response = await api.post<Prediction>('/predict', surgery);
    return response.data;
};

export const createSchedule = async (surgeries: Surgery[], startDate: string): Promise<ScheduleResponse> => {
    if (IS_PRODUCTION) {
        // Use mock data in production (GitHub Pages)
        console.log('Using mock schedule data');
        return mockSchedule(surgeries, startDate);
    }
    
    // Use real API in development
    const response = await api.post<ScheduleResponse>('/schedule', {
        surgeries,
        start_date: startDate,
    });
    return response.data;
};

export const downloadTemplate = (): void => {
    if (IS_PRODUCTION) {
        // Use a publicly accessible template in production
        console.log('Using mock template download');
        window.open(mockTemplateUrl, '_blank');
        return;
    }
    
    // Use real API in development
    window.open(`${API_BASE_URL}/template`, '_blank');
};

export const batchImportSurgeries = async (file: File, startDate: string): Promise<BatchImportResponse> => {
    if (IS_PRODUCTION) {
        // Use mock data in production (GitHub Pages)
        console.log('Using mock batch import data');
        return mockBatchImport(startDate);
    }
    
    // Use real API in development
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