export interface Surgery {
    patient_age: number;
    bmi: number;
    surgery_type: string;
    surgeon: string;
    anesthesiologist: string;
    nurse: string;
    day_of_week: string;
    time_preference: string;
    pre_op_prep_time: number;
    transfer_to_or_time: number;
    anesthesia_time: number;
    positioning_time: number;
    comorbidities: string;
    instrument_ready: string;
    pacu_bed_ready: string;
    scheduled_start: string;
}

export interface ScheduledSurgery {
    surgery_type: string;
    patient_age: number;
    surgeon: string;
    scheduled_date: string;
    scheduled_time: string;
    operating_room: number;
    estimated_duration: number;
    delay_risk: string;
    original_time: string;
}

export interface Prediction {
    delay_probability: number;
    predicted_delay: string;
    predicted_duration: number;
    duration_range: string;
}

export interface ScheduleResponse {
    schedule: ScheduledSurgery[];
}

export interface BatchImportResponse {
    imported_count: number;
    schedule: ScheduledSurgery[];
    errors: string[];
}

export interface SurgeryFormData extends Surgery {
    id?: string;
} 