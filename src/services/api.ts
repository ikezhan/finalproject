import axios from 'axios';
import { Surgery, Prediction, ScheduleResponse, BatchImportResponse } from '../types';

// For GitHub Pages deployment, you'll need to configure this to point to a hosted backend API
// For local development, it will use localhost:8003
const API_BASE_URL = process.env.NODE_ENV === 'production' 
    ? 'https://your-deployed-backend-api-url.com' // Replace with your actual deployed backend URL
    : 'http://localhost:8003';

// Detect if we're running on GitHub Pages
const isGitHubPages = window.location.hostname.includes('github.io');

// Log which API endpoint or mock data we're using
if (isGitHubPages) {
    console.log('Using mock data for GitHub Pages deployment');
} else {
    console.log(`Using API endpoint: ${API_BASE_URL}`);
}

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Mock surgery schedule data for GitHub Pages
const MOCK_SCHEDULE_DATA: ScheduleResponse = {
    schedule: [
        {
            surgery_type: "Hip Replacement",
            patient_age: 65,
            surgeon: "Dr. Smith",
            scheduled_date: "2025-03-10",
            scheduled_time: "09:00",
            operating_room: "OR-1",
            estimated_duration: 120,
            delay_risk: "Low Risk"
        },
        {
            surgery_type: "Knee Replacement",
            patient_age: 72,
            surgeon: "Dr. Johnson",
            scheduled_date: "2025-03-10",
            scheduled_time: "11:30",
            operating_room: "OR-2",
            estimated_duration: 90,
            delay_risk: "Low Risk"
        },
        {
            surgery_type: "Appendectomy",
            patient_age: 45,
            surgeon: "Dr. Wilson",
            scheduled_date: "2025-03-10",
            scheduled_time: "13:15",
            operating_room: "OR-3",
            estimated_duration: 60,
            delay_risk: "High Risk"
        },
        {
            surgery_type: "Cataract Surgery",
            patient_age: 78,
            surgeon: "Dr. Brown",
            scheduled_date: "2025-03-10",
            scheduled_time: "14:30",
            operating_room: "OR-1",
            estimated_duration: 45,
            delay_risk: "Low Risk"
        }
    ]
};

// Mock prediction data for GitHub Pages
const MOCK_PREDICTION_DATA: Prediction = {
    delay_probability: 0.25,
    delay_risk: "Low Risk",
    predicted_duration: 120,
    duration_range: "105 - 135"
};

export const predictSurgery = async (surgery: Surgery): Promise<Prediction> => {
    if (isGitHubPages) {
        // Return mock data for GitHub Pages
        return Promise.resolve(MOCK_PREDICTION_DATA);
    }

    const response = await api.post<Prediction>('/predict', surgery);
    return response.data;
};

export const createSchedule = async (surgeries: Surgery[], startDate: string): Promise<ScheduleResponse> => {
    if (isGitHubPages) {
        // Return mock data for GitHub Pages
        return Promise.resolve(MOCK_SCHEDULE_DATA);
    }

    const response = await api.post<ScheduleResponse>('/schedule', {
        surgeries,
        start_date: startDate,
    });
    return response.data;
};

export const downloadTemplate = (): void => {
    if (isGitHubPages) {
        alert('Template download is not available in the GitHub Pages demo. Please run the application locally to use this feature.');
        return;
    }
    
    window.open(`${API_BASE_URL}/template`, '_blank');
};

export const batchImportSurgeries = async (file: File, startDate: string): Promise<BatchImportResponse> => {
    if (isGitHubPages) {
        // Return mock data for GitHub Pages
        return Promise.resolve({
            imported_count: 40,
            schedule: MOCK_SCHEDULE_DATA.schedule
        });
    }
    
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