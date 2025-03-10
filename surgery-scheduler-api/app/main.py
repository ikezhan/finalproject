from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timedelta
import sys
import os
import pandas as pd
import io

# Add the parent directory to sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import our scheduling system
from .surgery_scheduler import predict_surgery, display_model_performance

app = FastAPI(title="Surgery Scheduler API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Data models
class Surgery(BaseModel):
    patient_age: int
    bmi: float
    surgery_type: str
    surgeon: str
    anesthesiologist: str
    nurse: str
    day_of_week: str
    time_preference: str
    pre_op_prep_time: int
    transfer_to_or_time: int
    anesthesia_time: int
    positioning_time: int
    comorbidities: str
    instrument_ready: str
    pacu_bed_ready: str
    scheduled_start: str

class ScheduleRequest(BaseModel):
    surgeries: List[Surgery]
    start_date: str

class PredictionResponse(BaseModel):
    delay_probability: float
    predicted_delay: str
    predicted_duration: float
    duration_range: str

class ScheduledSurgery(BaseModel):
    surgery_type: str
    patient_age: int
    surgeon: str
    scheduled_date: str
    scheduled_time: str
    operating_room: int
    estimated_duration: float
    delay_risk: str
    original_time: str

class ScheduleResponse(BaseModel):
    schedule: List[ScheduledSurgery]

class BatchImportResponse(BaseModel):
    imported_count: int
    schedule: List[ScheduledSurgery]
    errors: List[str]

@app.get("/")
async def root():
    return {"message": "Surgery Scheduler API is running"}

@app.post("/predict", response_model=PredictionResponse)
async def predict(surgery: Surgery):
    try:
        # Convert the Pydantic model to dict and format it for our predictor
        surgery_dict = {
            'Patient Age': surgery.patient_age,
            'BMI': surgery.bmi,
            'Surgery Type': surgery.surgery_type,
            'Surgeon': surgery.surgeon,
            'Anesthesiologist': surgery.anesthesiologist,
            'Nurse': surgery.nurse,
            'Day of Week': surgery.day_of_week,
            'Pre-op Prep Time (min)': surgery.pre_op_prep_time,
            'Transfer to OR Time (min)': surgery.transfer_to_or_time,
            'Anesthesia Time (min)': surgery.anesthesia_time,
            'Positioning Time (min)': surgery.positioning_time,
            'Comorbidities': surgery.comorbidities,
            'Instrument Ready (Y/N)': surgery.instrument_ready,
            'PACU Bed Ready (Y/N)': surgery.pacu_bed_ready,
            'Scheduled Start': surgery.scheduled_start,
            'Time Preference': surgery.time_preference
        }
        
        prediction = predict_surgery(surgery_dict)
        
        return {
            'delay_probability': prediction['Delay_Probability'],
            'predicted_delay': prediction['Predicted_Delay'],
            'predicted_duration': prediction['Predicted_Duration'],
            'duration_range': prediction['Duration_Range']
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/batch-import", response_model=BatchImportResponse)
async def batch_import(file: UploadFile = File(...), start_date: str = None):
    try:
        # Validate start date
        if not start_date:
            start_date = datetime.now().strftime("%Y-%m-%d")
        else:
            # Validate date format
            try:
                datetime.strptime(start_date, "%Y-%m-%d")
            except ValueError:
                raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")
        
        # Read Excel file
        contents = await file.read()
        
        try:
            # Try multiple approaches to read the Excel file
            df = None
            error_messages = []
            
            # Approach 1: No header rows
            try:
                df_attempt = pd.read_excel(io.BytesIO(contents))
                print(f"Excel file read successfully. Shape: {df_attempt.shape}, Columns: {df_attempt.columns.tolist()}")
                
                # Check if required columns exist
                required_columns = [
                    'Patient Age', 'BMI', 'Surgery Type', 'Surgeon', 
                    'Anesthesiologist', 'Nurse', 'Day of Week', 'Time Preference',
                    'Comorbidities', 'Instrument Ready (Y/N)', 'PACU Bed Ready (Y/N)'
                ]
                missing = [col for col in required_columns if col not in df_attempt.columns]
                if not missing:
                    df = df_attempt
                else:
                    error_messages.append(f"Missing columns in standard format: {', '.join(missing)}")
            except Exception as e:
                error_messages.append(f"Failed to read as standard Excel: {str(e)}")
            
            # Approach 2: Skip 3 rows (for our template format)
            if df is None:
                try:
                    df_attempt = pd.read_excel(io.BytesIO(contents), skiprows=3)
                    print(f"Excel file read with skiprows=3. Shape: {df_attempt.shape}, Columns: {df_attempt.columns.tolist()}")
                    
                    required_columns = [
                        'Patient Age', 'BMI', 'Surgery Type', 'Surgeon', 
                        'Anesthesiologist', 'Nurse', 'Day of Week', 'Time Preference',
                        'Comorbidities', 'Instrument Ready (Y/N)', 'PACU Bed Ready (Y/N)'
                    ]
                    missing = [col for col in required_columns if col not in df_attempt.columns]
                    if not missing:
                        df = df_attempt
                    else:
                        error_messages.append(f"Missing columns with 3 header rows: {', '.join(missing)}")
                except Exception as e:
                    error_messages.append(f"Failed to read with 3 header rows: {str(e)}")
            
            # If we still don't have a valid dataframe
            if df is None:
                raise HTTPException(
                    status_code=400, 
                    detail=f"Could not read Excel file with required columns. Errors: {'; '.join(error_messages)}"
                )
            
            # Check if the dataframe is empty
            if df.empty:
                raise HTTPException(status_code=400, detail="The uploaded file contains no data")
            
            print(f"Successfully read Excel file with {len(df)} rows")
                
        except Exception as e:
            if isinstance(e, HTTPException):
                raise e
            raise HTTPException(status_code=400, detail=f"Invalid Excel file: {str(e)}")
        
        # Convert DataFrame to list of Surgery objects
        surgeries = []
        errors = []
        
        for i, row in df.iterrows():
            try:
                # Skip rows with NaN values in key fields
                if pd.isna(row['Patient Age']) or pd.isna(row['Surgery Type']):
                    errors.append(f"Row {i+2}: Skipped due to missing required values")
                    continue
                
                # Handle potential NaN values in other fields
                surgery_dict = {
                    'patient_age': int(row['Patient Age']),
                    'bmi': float(row['BMI'] if not pd.isna(row['BMI']) else 25.0),
                    'surgery_type': str(row['Surgery Type']),
                    'surgeon': str(row['Surgeon'] if not pd.isna(row['Surgeon']) else 'Unknown'),
                    'anesthesiologist': str(row['Anesthesiologist'] if not pd.isna(row['Anesthesiologist']) else 'Unknown'),
                    'nurse': str(row['Nurse'] if not pd.isna(row['Nurse']) else 'Unknown'),
                    'day_of_week': str(row['Day of Week'] if not pd.isna(row['Day of Week']) else 'Monday'),
                    'time_preference': str(row['Time Preference'] if not pd.isna(row['Time Preference']) else 'Morning'),
                    'comorbidities': str(row['Comorbidities'] if not pd.isna(row['Comorbidities']) else 'None'),
                    'instrument_ready': str(row['Instrument Ready (Y/N)'] if not pd.isna(row['Instrument Ready (Y/N)']) else 'Y'),
                    'pacu_bed_ready': str(row['PACU Bed Ready (Y/N)'] if not pd.isna(row['PACU Bed Ready (Y/N)']) else 'Y'),
                    # Default values for fields that will be predicted
                    'pre_op_prep_time': 30,
                    'transfer_to_or_time': 15,
                    'anesthesia_time': 20,
                    'positioning_time': 10,
                    'scheduled_start': '09:00' if str(row['Time Preference'] if not pd.isna(row['Time Preference']) else 'Morning') == 'Morning' else '13:00'
                }
                
                # Create Surgery object
                surgery = Surgery(**surgery_dict)
                surgeries.append(surgery)
            except Exception as e:
                errors.append(f"Error in row {i+2}: {str(e)}")
        
        if not surgeries:
            raise HTTPException(status_code=400, detail="No valid surgeries found in the file")
        
        print(f"Created {len(surgeries)} Surgery objects from Excel file")
        
        # Create schedule request
        request = ScheduleRequest(surgeries=surgeries, start_date=start_date)
        
        # Use the existing schedule endpoint logic
        schedule_response = await create_schedule(request)
        
        # Debug the response
        print("Schedule response type:", type(schedule_response))
        print("Schedule keys:", schedule_response.keys() if hasattr(schedule_response, 'keys') else "No keys method")
        
        # Make sure we have a valid schedule
        if 'schedule' not in schedule_response:
            print("ERROR: 'schedule' key not found in response")
            # Create a simple schedule as fallback
            schedule = []
            for i, surgery in enumerate(surgeries):
                schedule.append({
                    'surgery_type': surgery.surgery_type,
                    'patient_age': surgery.patient_age,
                    'surgeon': surgery.surgeon,
                    'scheduled_date': start_date,
                    'scheduled_time': '09:00' if i % 2 == 0 else '13:00',
                    'operating_room': (i % 2) + 1,
                    'estimated_duration': 60,
                    'delay_risk': 'Low',
                    'original_time': '09:00' if i % 2 == 0 else '13:00'
                })
        else:
            schedule = schedule_response['schedule']
        
        # Create the result
        result = {
            "imported_count": len(surgeries),
            "schedule": schedule,
            "errors": errors
        }
        
        # Debug the result
        print(f"Batch import result: {len(result['schedule'])} surgeries in schedule, {len(result['errors'])} errors")
        
        return result
        
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/schedule", response_model=ScheduleResponse)
async def create_schedule(request: ScheduleRequest):
    try:
        # Convert the Pydantic models to list of dicts
        surgeries_list = []
        for surgery in request.surgeries:
            surgery_dict = {
                'Patient Age': surgery.patient_age,
                'BMI': surgery.bmi,
                'Surgery Type': surgery.surgery_type,
                'Surgeon': surgery.surgeon,
                'Anesthesiologist': surgery.anesthesiologist,
                'Nurse': surgery.nurse,
                'Day of Week': surgery.day_of_week,
                'Pre-op Prep Time (min)': surgery.pre_op_prep_time,
                'Transfer to OR Time (min)': surgery.transfer_to_or_time,
                'Anesthesia Time (min)': surgery.anesthesia_time,
                'Positioning Time (min)': surgery.positioning_time,
                'Comorbidities': surgery.comorbidities,
                'Instrument Ready (Y/N)': surgery.instrument_ready,
                'PACU Bed Ready (Y/N)': surgery.pacu_bed_ready,
                'Scheduled Start': surgery.scheduled_start,
                'Time Preference': surgery.time_preference
            }
            surgeries_list.append(surgery_dict)
        
        # Print the number of surgeries for debugging
        print(f"Processing {len(surgeries_list)} surgeries")
        
        # Create a simple schedule without the optimizer
        schedule = []
        start_date = datetime.strptime(request.start_date, "%Y-%m-%d")
        
        # Map days of week to date offsets from start_date
        day_map = {
            'Monday': 0,
            'Tuesday': 1,
            'Wednesday': 2,
            'Thursday': 3,
            'Friday': 4
        }
        
        # Map time preferences to starting hours
        time_map = {
            'Morning': 9,  # 9 AM
            'Afternoon': 13,  # 1 PM
            'No Preference': 11  # 11 AM
        }
        
        # Group surgeries by day
        day_surgeries = {}
        for surgery in surgeries_list:
            day = surgery['Day of Week']
            if day not in day_surgeries:
                day_surgeries[day] = []
            day_surgeries[day].append(surgery)
        
        # Print the grouped surgeries for debugging
        for day, surgeries in day_surgeries.items():
            print(f"Day {day}: {len(surgeries)} surgeries")
        
        # Schedule surgeries by day and time preference
        for day, surgeries in day_surgeries.items():
            # Calculate the date for this day
            day_offset = day_map.get(day, 0)
            current_date = start_date + timedelta(days=day_offset)
            
            # Sort surgeries by time preference
            morning_surgeries = [s for s in surgeries if s.get('Time Preference') == 'Morning']
            afternoon_surgeries = [s for s in surgeries if s.get('Time Preference') == 'Afternoon']
            no_pref_surgeries = [s for s in surgeries if s.get('Time Preference') == 'No Preference' or not s.get('Time Preference')]
            
            print(f"Day {day}: {len(morning_surgeries)} morning, {len(afternoon_surgeries)} afternoon, {len(no_pref_surgeries)} no preference")
            
            # Schedule morning surgeries
            current_time_or1 = datetime.strptime("09:00", "%H:%M")
            current_time_or2 = datetime.strptime("09:00", "%H:%M")
            
            # Helper function to schedule a surgery
            def schedule_surgery(surgery, or_num, current_time):
                try:
                    prediction = predict_surgery(surgery)
                    duration = prediction['Predicted_Duration']
                    delay_risk = "High" if prediction['Delay_Probability'] > 0.5 else "Low"
                    
                    time_str = current_time.strftime("%H:%M")
                    
                    # Format the date as YYYY-MM-DD
                    date_str = current_date.strftime("%Y-%m-%d")
                    
                    schedule.append({
                        'surgery_type': surgery['Surgery Type'],
                        'patient_age': surgery['Patient Age'],
                        'surgeon': surgery['Surgeon'],
                        'scheduled_date': date_str,
                        'scheduled_time': time_str,
                        'operating_room': or_num,
                        'estimated_duration': float(duration),
                        'delay_risk': delay_risk,
                        'original_time': time_str
                    })
                    
                    # Return the new current time after this surgery
                    return current_time + timedelta(minutes=duration + 30)  # 30 min buffer
                except Exception as e:
                    print(f"Error scheduling surgery: {str(e)}")
                    # Return the current time plus 1 hour as a fallback
                    return current_time + timedelta(hours=1)
            
            # Schedule morning surgeries
            for i, surgery in enumerate(morning_surgeries):
                if i % 2 == 0:
                    current_time_or1 = schedule_surgery(surgery, 1, current_time_or1)
                else:
                    current_time_or2 = schedule_surgery(surgery, 2, current_time_or2)
            
            # Schedule afternoon surgeries starting at 1 PM
            current_time_or1 = max(current_time_or1, datetime.strptime("13:00", "%H:%M"))
            current_time_or2 = max(current_time_or2, datetime.strptime("13:00", "%H:%M"))
            
            for i, surgery in enumerate(afternoon_surgeries):
                if i % 2 == 0:
                    current_time_or1 = schedule_surgery(surgery, 1, current_time_or1)
                else:
                    current_time_or2 = schedule_surgery(surgery, 2, current_time_or2)
            
            # Schedule no preference surgeries in remaining slots
            for i, surgery in enumerate(no_pref_surgeries):
                # Choose the OR with the earlier available time
                if current_time_or1 <= current_time_or2:
                    current_time_or1 = schedule_surgery(surgery, 1, current_time_or1)
                else:
                    current_time_or2 = schedule_surgery(surgery, 2, current_time_or2)
        
        # Debug the schedule
        print(f"Generated schedule with {len(schedule)} surgeries")
        
        return {'schedule': schedule}
    except Exception as e:
        print("Error in create_schedule:", str(e))
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/template")
async def get_template():
    """Generate and return an Excel template for batch importing surgeries"""
    # Create a sample DataFrame with the required columns
    df = pd.DataFrame({
        'Patient Age': [45, 65],
        'BMI': [24.5, 30.2],
        'Surgery Type': ['Hip Replacement', 'Knee Replacement'],
        'Surgeon': ['Dr. Smith', 'Dr. Johnson'],
        'Anesthesiologist': ['Dr. Brown', 'Dr. Davis'],
        'Nurse': ['Nurse A', 'Nurse B'],
        'Day of Week': ['Monday', 'Tuesday'],
        'Time Preference': ['Morning', 'Afternoon'],
        'Comorbidities': ['Hypertension', 'Diabetes'],
        'Instrument Ready (Y/N)': ['Y', 'Y'],
        'PACU Bed Ready (Y/N)': ['Y', 'Y']
    })
    
    # Create a BytesIO buffer
    output = io.BytesIO()
    
    # Write the DataFrame to the buffer - NO HEADER ROWS
    df.to_excel(output, index=False)
    
    # Seek to the beginning of the buffer
    output.seek(0)
    
    # Return the Excel file
    from fastapi.responses import StreamingResponse
    return StreamingResponse(
        output, 
        media_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        headers={'Content-Disposition': 'attachment; filename=surgery_import_template.xlsx'}
    )

@app.get("/model-performance")
async def get_model_performance():
    """Display model performance metrics when explicitly requested"""
    try:
        # Capture the output of the display_model_performance function
        import io
        import sys
        from contextlib import redirect_stdout
        
        f = io.StringIO()
        with redirect_stdout(f):
            display_model_performance()
        
        performance_data = f.getvalue()
        
        return {
            "message": "Model performance metrics",
            "performance_data": performance_data
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 