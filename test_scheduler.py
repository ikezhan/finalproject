from datetime import datetime, timedelta
from schedule_optimizer import SurgeryScheduleOptimizer

def create_surgery_list(start_date):
    """Create a list of surgeries with proper scheduling information."""
    return [
        {
            'Patient Age': 75,
            'BMI': 30.5,
            'Surgery Type': 'Hip Replacement',
            'Surgeon': 'Dr. Smith',
            'Anesthesiologist': 'Dr. Brown',
            'Nurse': 'Nurse A',
            'Day of Week': 'Monday',
            'Pre-op Prep Time (min)': 45,
            'Transfer to OR Time (min)': 15,
            'Anesthesia Time (min)': 30,
            'Positioning Time (min)': 20,
            'Comorbidities': 'Hypertension',
            'Instrument Ready (Y/N)': 'Y',
            'PACU Bed Ready (Y/N)': 'Y',
            'Scheduled Start': start_date.strftime('%Y-%m-%d 09:00:00'),
            'Actual Start': start_date.strftime('%Y-%m-%d 09:15:00'),  # 15 min delay
            'Total OR Time (min)': 180
        },
        {
            'Patient Age': 45,
            'BMI': 24.5,
            'Surgery Type': 'ACL Repair',
            'Surgeon': 'Dr. Johnson',
            'Anesthesiologist': 'Dr. Davis',
            'Nurse': 'Nurse B',
            'Day of Week': 'Monday',
            'Pre-op Prep Time (min)': 30,
            'Transfer to OR Time (min)': 10,
            'Anesthesia Time (min)': 25,
            'Positioning Time (min)': 15,
            'Comorbidities': 'None',
            'Instrument Ready (Y/N)': 'Y',
            'PACU Bed Ready (Y/N)': 'Y',
            'Scheduled Start': start_date.strftime('%Y-%m-%d 11:00:00'),
            'Actual Start': start_date.strftime('%Y-%m-%d 11:00:00'),  # On time
            'Total OR Time (min)': 120
        },
        {
            'Patient Age': 68,
            'BMI': 27.8,
            'Surgery Type': 'Knee Replacement',
            'Surgeon': 'Dr. Smith',
            'Anesthesiologist': 'Dr. Brown',
            'Nurse': 'Nurse C',
            'Day of Week': 'Tuesday',
            'Pre-op Prep Time (min)': 40,
            'Transfer to OR Time (min)': 15,
            'Anesthesia Time (min)': 30,
            'Positioning Time (min)': 20,
            'Comorbidities': 'Diabetes',
            'Instrument Ready (Y/N)': 'Y',
            'PACU Bed Ready (Y/N)': 'Y',
            'Scheduled Start': (start_date + timedelta(days=1)).strftime('%Y-%m-%d 09:00:00'),
            'Actual Start': (start_date + timedelta(days=1)).strftime('%Y-%m-%d 09:05:00'),  # 5 min delay
            'Total OR Time (min)': 150
        },
        {
            'Patient Age': 35,
            'BMI': 22.1,
            'Surgery Type': 'Arthroscopy',
            'Surgeon': 'Dr. Johnson',
            'Anesthesiologist': 'Dr. Davis',
            'Nurse': 'Nurse D',
            'Day of Week': 'Wednesday',
            'Pre-op Prep Time (min)': 25,
            'Transfer to OR Time (min)': 10,
            'Anesthesia Time (min)': 20,
            'Positioning Time (min)': 10,
            'Comorbidities': 'None',
            'Instrument Ready (Y/N)': 'Y',
            'PACU Bed Ready (Y/N)': 'Y',
            'Scheduled Start': (start_date + timedelta(days=2)).strftime('%Y-%m-%d 10:00:00'),
            'Actual Start': (start_date + timedelta(days=2)).strftime('%Y-%m-%d 10:00:00'),  # On time
            'Total OR Time (min)': 90
        },
        {
            'Patient Age': 82,
            'BMI': 26.4,
            'Surgery Type': 'Cataract Surgery',
            'Surgeon': 'Dr. Wilson',
            'Anesthesiologist': 'Dr. Brown',
            'Nurse': 'Nurse E',
            'Day of Week': 'Thursday',
            'Pre-op Prep Time (min)': 20,
            'Transfer to OR Time (min)': 10,
            'Anesthesia Time (min)': 15,
            'Positioning Time (min)': 10,
            'Comorbidities': 'Hypertension,Heart Disease',
            'Instrument Ready (Y/N)': 'Y',
            'PACU Bed Ready (Y/N)': 'Y',
            'Scheduled Start': (start_date + timedelta(days=3)).strftime('%Y-%m-%d 08:00:00'),
            'Actual Start': (start_date + timedelta(days=3)).strftime('%Y-%m-%d 08:10:00'),  # 10 min delay
            'Total OR Time (min)': 60
        }
    ]

def main():
    # Create scheduler instance
    scheduler = SurgeryScheduleOptimizer()
    
    # Get next Monday as start date
    today = datetime.now()
    days_until_monday = (7 - today.weekday()) % 7
    next_monday = today + timedelta(days=days_until_monday)
    
    print(f"Scheduling surgeries starting from {next_monday.strftime('%A, %B %d, %Y')}")
    print("=" * 100)
    
    # Create schedule
    example_surgeries = create_surgery_list(next_monday)
    schedule = scheduler.create_weekly_schedule(example_surgeries, next_monday)
    
    # Print schedule
    scheduler.print_schedule(schedule)

if __name__ == "__main__":
    main() 