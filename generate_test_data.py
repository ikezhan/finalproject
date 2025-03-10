import pandas as pd
import numpy as np
import random
from datetime import datetime, timedelta

# Create sample data for 40 surgeries
num_surgeries = 40

# Define possible values for categorical fields
surgery_types = ['Hip Replacement', 'Knee Replacement', 'ACL Repair', 'Arthroscopy', 'Cataract Surgery', 
                'Appendectomy', 'Gallbladder Removal', 'Hernia Repair', 'Spinal Fusion', 'Cardiac Bypass']
surgeons = ['Dr. Smith', 'Dr. Johnson', 'Dr. Wilson', 'Dr. Lee', 'Dr. Garcia']
anesthesiologists = ['Dr. Brown', 'Dr. Davis', 'Dr. Martinez', 'Dr. Taylor']
nurses = ['Nurse A', 'Nurse B', 'Nurse C', 'Nurse D', 'Nurse E', 'Nurse F']
days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
time_preferences = ['Morning', 'Afternoon', 'No Preference']
comorbidities = ['None', 'Hypertension', 'Diabetes', 'Obesity', 'Heart Disease', 'COPD', 'Asthma', 'Multiple']
yes_no = ['Y', 'N']

# Generate random data
data = {
    'Patient Age': [random.randint(18, 85) for _ in range(num_surgeries)],
    'BMI': [round(random.uniform(18.5, 40.0), 1) for _ in range(num_surgeries)],
    'Surgery Type': [random.choice(surgery_types) for _ in range(num_surgeries)],
    'Surgeon': [random.choice(surgeons) for _ in range(num_surgeries)],
    'Anesthesiologist': [random.choice(anesthesiologists) for _ in range(num_surgeries)],
    'Nurse': [random.choice(nurses) for _ in range(num_surgeries)],
    'Day of Week': [random.choice(days) for _ in range(num_surgeries)],
    'Time Preference': [random.choice(time_preferences) for _ in range(num_surgeries)],
    'Comorbidities': [random.choice(comorbidities) for _ in range(num_surgeries)],
    'Instrument Ready (Y/N)': [random.choice(yes_no) for _ in range(num_surgeries)],
    'PACU Bed Ready (Y/N)': [random.choice(yes_no) for _ in range(num_surgeries)]
}

# Create DataFrame
df = pd.DataFrame(data)

# Save to Excel
df.to_excel('test_40_surgeries.xlsx', index=False)
print('Created test file with 40 surgeries: test_40_surgeries.xlsx') 