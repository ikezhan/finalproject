from surgery_scheduler import predict_surgery
from datetime import datetime, timedelta

# Get tomorrow's date
tomorrow = datetime.now() + timedelta(days=1)

# Example surgeries
surgeries = [
    {
        'Patient Age': 65,
        'BMI': 28.5,
        'Surgery Type': 'Hip Replacement',
        'Surgeon': 'Dr. Smith',
        'Anesthesiologist': 'Dr. Brown',
        'Nurse': 'Nurse A',
        'Day of Week': 'Monday',
        'Hour': 9,
        'Pre-op Prep Time (min)': 45,
        'Transfer to OR Time (min)': 10,
        'Anesthesia Time (min)': 25,
        'Positioning Time (min)': 20,
        'Comorbidities': 'Hypertension',
        'Instrument Ready (Y/N)': 'Y',
        'PACU Bed Ready (Y/N)': 'Y',
        'Scheduled Start': tomorrow.replace(hour=9, minute=0).strftime('%Y-%m-%d %H:%M:%S'),
        'Actual Start': tomorrow.replace(hour=9, minute=15).strftime('%Y-%m-%d %H:%M:%S')  # 15 min delay example
    },
    {
        'Patient Age': 45,
        'BMI': 24.0,
        'Surgery Type': 'ACL Repair',
        'Surgeon': 'Dr. Johnson',
        'Anesthesiologist': 'Dr. White',
        'Nurse': 'Nurse B',
        'Day of Week': 'Tuesday',
        'Hour': 14,
        'Pre-op Prep Time (min)': 40,
        'Transfer to OR Time (min)': 12,
        'Anesthesia Time (min)': 20,
        'Positioning Time (min)': 15,
        'Comorbidities': 'None',
        'Instrument Ready (Y/N)': 'Y',
        'PACU Bed Ready (Y/N)': 'Y',
        'Scheduled Start': (tomorrow + timedelta(days=1)).replace(hour=14, minute=0).strftime('%Y-%m-%d %H:%M:%S'),
        'Actual Start': (tomorrow + timedelta(days=1)).replace(hour=14, minute=0).strftime('%Y-%m-%d %H:%M:%S')  # on time
    }
]

# Process each surgery
for i, surgery in enumerate(surgeries, 1):
    print(f"\nPredictions for Surgery #{i}:")
    prediction = predict_surgery(surgery)
    print(f"Patient: Age {surgery['Patient Age']}, {surgery['Surgery Type']}")
    print(f"Scheduled with: {surgery['Surgeon']}, {surgery['Day of Week']} at {surgery['Hour']}:00")
    print(f"Delay Risk: {prediction['Predicted_Delay']} (Probability: {prediction['Delay_Probability']})")
    print(f"Estimated Duration: {prediction['Predicted_Duration']} minutes")
    print(f"Duration Range: {prediction['Duration_Range']} minutes") 