import { Surgery, Prediction, ScheduleResponse, BatchImportResponse, ScheduledSurgery } from '../types';
import { addDays, format } from 'date-fns';

// Sample surgery types for variety
const surgeryTypes = [
  'Hip Replacement',
  'Knee Replacement',
  'Appendectomy',
  'Cataract Surgery',
  'Coronary Bypass',
  'Spinal Fusion',
  'Tonsillectomy',
  'Gallbladder Removal'
];

// Sample surgeons
const surgeons = [
  'Dr. Smith',
  'Dr. Johnson',
  'Dr. Wilson',
  'Dr. Martinez',
  'Dr. Chen'
];

// Sample anesthesiologists
const anesthesiologists = [
  'Dr. Brown',
  'Dr. Davis',
  'Dr. Taylor'
];

// Sample nurses
const nurses = [
  'Nurse A',
  'Nurse B',
  'Nurse C',
  'Nurse D'
];

// Sample comorbidities
const comorbidities = [
  'None',
  'Hypertension',
  'Diabetes',
  'Obesity',
  'Heart Disease'
];

// Sample operating rooms
const operatingRooms = [
  'OR 1',
  'OR 2',
  'OR 3',
  'OR 4'
];

// Function to generate a sample surgery
const generateSurgery = (): Surgery => {
  return {
    patient_age: Math.floor(Math.random() * 70) + 18, // 18-88 years
    bmi: parseFloat((Math.random() * 20 + 18).toFixed(1)), // 18-38 BMI
    surgery_type: surgeryTypes[Math.floor(Math.random() * surgeryTypes.length)],
    surgeon: surgeons[Math.floor(Math.random() * surgeons.length)],
    anesthesiologist: anesthesiologists[Math.floor(Math.random() * anesthesiologists.length)],
    nurse: nurses[Math.floor(Math.random() * nurses.length)],
    day_of_week: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'][Math.floor(Math.random() * 5)],
    time_preference: ['Morning', 'Afternoon', 'No Preference'][Math.floor(Math.random() * 3)],
    pre_op_prep_time: Math.floor(Math.random() * 20) + 20, // 20-40 minutes
    transfer_to_or_time: Math.floor(Math.random() * 10) + 10, // 10-20 minutes
    anesthesia_time: Math.floor(Math.random() * 15) + 15, // 15-30 minutes
    positioning_time: Math.floor(Math.random() * 10) + 5, // 5-15 minutes
    comorbidities: comorbidities[Math.floor(Math.random() * comorbidities.length)],
    instrument_ready: Math.random() > 0.2 ? 'Y' : 'N', // 80% chance of being ready
    pacu_bed_ready: Math.random() > 0.1 ? 'Y' : 'N', // 90% chance of being ready
    scheduled_start: Math.random() > 0.5 ? '09:00' : '13:00' // 50% chance of each
  };
};

// Generate a mock prediction response
export const mockPrediction = (surgery: Surgery): Prediction => {
  const baseDuration = 
    surgery.pre_op_prep_time + 
    surgery.transfer_to_or_time + 
    surgery.anesthesia_time + 
    surgery.positioning_time;
  
  // Add duration based on surgery type (arbitrary values for simulation)
  const surgeryTypeFactors: Record<string, number> = {
    'Hip Replacement': 90,
    'Knee Replacement': 75,
    'Appendectomy': 45,
    'Cataract Surgery': 30,
    'Coronary Bypass': 180,
    'Spinal Fusion': 120,
    'Tonsillectomy': 40,
    'Gallbladder Removal': 60
  };
  
  // Calculate estimated duration
  const typeDuration = surgeryTypeFactors[surgery.surgery_type] || 60;
  const ageAdjustment = surgery.patient_age > 70 ? 15 : 0;
  const comorbidityAdjustment = surgery.comorbidities !== 'None' ? 10 : 0;
  
  const estimatedDuration = baseDuration + typeDuration + ageAdjustment + comorbidityAdjustment;
  
  // Calculate delay risk based on various factors
  const delayRiskFactors = [
    surgery.patient_age > 70,
    surgery.bmi > 30,
    surgery.comorbidities !== 'None',
    surgery.instrument_ready === 'N',
    surgery.pacu_bed_ready === 'N'
  ];
  
  const delayRiskCount = delayRiskFactors.filter(Boolean).length;
  const delayProbability = delayRiskCount * 0.15; // 0-75% probability
  const predictedDelay = delayProbability > 0.3 ? 'High Risk' : 'Low Risk';
  
  return {
    predicted_duration: estimatedDuration,
    delay_probability: delayProbability,
    predicted_delay: predictedDelay,
    duration_range: `${Math.round(estimatedDuration * 0.9)} - ${Math.round(estimatedDuration * 1.1)}`
  };
};

// Generate a mock schedule response
export const mockSchedule = (surgeries: Surgery[], startDate: string): ScheduleResponse => {
  const scheduledSurgeries: ScheduledSurgery[] = surgeries.map((surgery, index) => {
    const startDateObj = new Date(startDate);
    // Distribute surgeries across days (up to 5 days from start date)
    const surgeryDate = addDays(startDateObj, Math.min(Math.floor(index / 8), 4));
    
    // Determine time slot based on preference or availability
    let timeSlot = '';
    if (surgery.time_preference === 'Morning') {
      timeSlot = `0${7 + (index % 4)}:00`; // 07:00, 08:00, 09:00, 10:00
    } else if (surgery.time_preference === 'Afternoon') {
      timeSlot = `${13 + (index % 4)}:00`; // 13:00, 14:00, 15:00, 16:00
    } else {
      timeSlot = index % 2 === 0 ? `0${8 + (index % 3)}:00` : `${13 + (index % 3)}:00`;
    }
    
    // Prediction logic
    const prediction = mockPrediction(surgery);
    
    // Create a ScheduledSurgery object with all required properties
    return {
      surgery_type: surgery.surgery_type,
      patient_age: surgery.patient_age,
      surgeon: surgery.surgeon,
      scheduled_date: format(surgeryDate, 'yyyy-MM-dd'),
      scheduled_time: timeSlot,
      original_time: surgery.scheduled_start,
      operating_room: (index % 4) + 1, // Convert to number: OR 1-4
      estimated_duration: prediction.predicted_duration,
      delay_risk: prediction.predicted_delay
    };
  });
  
  return {
    schedule: scheduledSurgeries
  };
};

// Generate a mock batch import response
export const mockBatchImport = (startDate: string): BatchImportResponse => {
  // Generate 40 sample surgeries
  const mockSurgeries = Array(40).fill(null).map(() => generateSurgery());
  const scheduleResponse = mockSchedule(mockSurgeries, startDate);
  
  return {
    imported_count: mockSurgeries.length,
    schedule: scheduleResponse.schedule,
    errors: [] // No errors in our mock data
  };
};

// Mock template download (will be handled with a different approach)
export const mockTemplateUrl = 'https://docs.google.com/spreadsheets/d/1MV9bX69nxdD6A-NepE8xCQe_wMJu0Xp8Q6Y0tmJKSXI/edit?usp=sharing'; 