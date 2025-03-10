import axios from 'axios';
import { Surgery, Prediction, ScheduleResponse, BatchImportResponse } from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8003';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

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