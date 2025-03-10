import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from surgery_scheduler import predict_surgery

class SurgeryScheduleOptimizer:
    def __init__(self):
        # Operating hours
        self.start_hour = 8  # 8 AM
        self.end_hour = 17   # 5 PM
        self.operating_rooms = 3  # Number of available ORs
        
        # Buffer times (in minutes)
        self.cleanup_time = 30
        self.emergency_buffer = 60  # Emergency buffer at end of day
        
    def _get_available_slots(self, start_date, num_days=5):
        """Generate available time slots for the week."""
        slots = []
        current_date = start_date
        
        for day in range(num_days):  # Monday to Friday
            if current_date.weekday() < 5:  # Weekdays only
                for hour in range(self.start_hour, self.end_hour):
                    for minute in [0, 30]:  # 30-minute slots
                        for or_num in range(1, self.operating_rooms + 1):
                            slot_time = current_date.replace(hour=hour, minute=minute)
                            slots.append({
                                'datetime': slot_time,
                                'OR': or_num,
                                'available': True
                            })
            current_date += timedelta(days=1)
        return pd.DataFrame(slots)

    def _calculate_surgery_score(self, surgery, slot_datetime):
        """Calculate priority score for a surgery."""
        score = 0
        
        # Priority based on patient age
        if surgery['Patient Age'] > 70:
            score += 20
        elif surgery['Patient Age'] > 60:
            score += 15
            
        # Priority based on surgery complexity
        complexity = (surgery['Pre-op Prep Time (min)'] + 
                     surgery['Anesthesia Time (min)'] + 
                     surgery['Positioning Time (min)']) / 3
        if complexity > 60:
            score += 15
            
        # Preferred time of day (morning slots for complex surgeries)
        if complexity > 45 and slot_datetime.hour < 11:
            score += 10
            
        # Preference for original scheduled time
        scheduled_start = pd.to_datetime(surgery['Scheduled Start'])
        time_diff = abs((slot_datetime - scheduled_start).total_seconds() / 3600)  # hours
        if time_diff < 1:  # Within 1 hour of preferred time
            score += 50
        elif time_diff < 2:  # Within 2 hours
            score += 30
        elif time_diff < 4:  # Within 4 hours
            score += 10
            
        # Preference for same day
        if slot_datetime.date() == scheduled_start.date():
            score += 40
            
        # Early morning bonus for elderly patients
        if surgery['Patient Age'] > 65 and slot_datetime.hour < 10:
            score += 15
            
        # Penalty for predicted delays
        prediction = predict_surgery(surgery)
        if prediction['Predicted_Delay'] == 'High Risk':
            score -= 20
            
        return score

    def create_weekly_schedule(self, surgeries_list, start_date):
        """
        Create an optimized weekly schedule for surgeries.
        
        Args:
            surgeries_list: List of dictionaries containing surgery information
            start_date: datetime object for the start of the week
        
        Returns:
            DataFrame with the optimized schedule
        """
        # Initialize available slots
        available_slots = self._get_available_slots(start_date)
        scheduled_surgeries = []
        
        # Sort surgeries by complexity and age
        surgeries_df = pd.DataFrame(surgeries_list)
        surgeries_df['complexity'] = (surgeries_df['Pre-op Prep Time (min)'] + 
                                    surgeries_df['Anesthesia Time (min)'] + 
                                    surgeries_df['Positioning Time (min)']) / 3
        surgeries_df = surgeries_df.sort_values(['complexity', 'Patient Age'], 
                                              ascending=[False, False])
        
        # Schedule each surgery
        for _, surgery in surgeries_df.iterrows():
            surgery_dict = surgery.to_dict()
            best_slot = None
            best_score = -float('inf')
            
            # Use the actual duration from training data if available
            if 'Total OR Time (min)' in surgery_dict:
                total_time_needed = surgery_dict['Total OR Time (min)'] + self.cleanup_time
            else:
                prediction = predict_surgery(surgery_dict)
                total_time_needed = prediction['Predicted_Duration'] + self.cleanup_time
            
            slots_needed = int(np.ceil(total_time_needed / 30))  # 30-minute slots
            
            # Try to schedule on preferred day first
            preferred_start = pd.to_datetime(surgery_dict['Scheduled Start'])
            preferred_day_slots = available_slots[
                available_slots['datetime'].dt.date == preferred_start.date()
            ]
            
            # First try slots on preferred day
            best_slot, best_score = self._find_best_slot(
                surgery_dict, preferred_day_slots, slots_needed
            )
            
            # If no slot found on preferred day, try other days
            if best_slot is None:
                best_slot, best_score = self._find_best_slot(
                    surgery_dict, available_slots, slots_needed
                )
            
            # Schedule the surgery if a slot was found
            if best_slot is not None:
                slot_idx = available_slots[
                    (available_slots['datetime'] == best_slot['datetime']) & 
                    (available_slots['OR'] == best_slot['OR'])
                ].index[0]
                
                # Mark slots as unavailable
                available_slots.loc[slot_idx:slot_idx + slots_needed - 1, 
                                 'available'] = False
                
                # Get delay prediction
                prediction = predict_surgery(surgery_dict)
                
                # Add to scheduled surgeries
                scheduled_surgeries.append({
                    'Surgery Type': surgery['Surgery Type'],
                    'Patient Age': surgery['Patient Age'],
                    'Surgeon': surgery['Surgeon'],
                    'Scheduled Date': best_slot['datetime'].date(),
                    'Scheduled Time': best_slot['datetime'].strftime('%H:%M'),
                    'Operating Room': best_slot['OR'],
                    'Estimated Duration': total_time_needed - self.cleanup_time,
                    'Delay Risk': prediction['Predicted_Delay'],
                    'Original Time': pd.to_datetime(surgery['Scheduled Start']).strftime('%Y-%m-%d %H:%M')
                })
        
        # Create final schedule
        if not scheduled_surgeries:
            return pd.DataFrame()
            
        schedule_df = pd.DataFrame(scheduled_surgeries)
        schedule_df = schedule_df.sort_values(['Scheduled Date', 'Scheduled Time', 'Operating Room'])
        return schedule_df

    def _find_best_slot(self, surgery, available_slots, slots_needed):
        """Find the best slot for a surgery in the given available slots."""
        best_slot = None
        best_score = -float('inf')
        
        # Group slots by OR
        for or_num in available_slots['OR'].unique():
            or_slots = available_slots[available_slots['OR'] == or_num]
            
            # Look for consecutive available slots
            for i in range(len(or_slots)):
                if i + slots_needed > len(or_slots):
                    break
                    
                consecutive_slots = or_slots.iloc[i:i + slots_needed]
                
                # Check if all slots are available and consecutive in time
                if (all(consecutive_slots['available']) and
                    len(consecutive_slots['datetime'].unique()) == slots_needed):
                    
                    slot = consecutive_slots.iloc[0]
                    score = self._calculate_surgery_score(surgery, slot['datetime'])
                    
                    if score > best_score:
                        best_score = score
                        best_slot = slot
        
        return best_slot, best_score

    def print_schedule(self, schedule_df):
        """Print the schedule in a readable format."""
        if schedule_df.empty:
            print("\nNo surgeries could be scheduled.")
            return
            
        current_date = None
        
        print("\nWeekly Surgery Schedule")
        print("=" * 100)
        
        for _, surgery in schedule_df.iterrows():
            if current_date != surgery['Scheduled Date']:
                current_date = surgery['Scheduled Date']
                print(f"\n{current_date.strftime('%A, %B %d, %Y')}")
                print("-" * 100)
            
            print(f"OR {surgery['Operating Room']} | {surgery['Scheduled Time']} | "
                  f"{surgery['Surgery Type']} | "
                  f"Duration: {surgery['Estimated Duration']:.0f} min | "
                  f"Surgeon: {surgery['Surgeon']} | "
                  f"Patient Age: {surgery['Patient Age']} | "
                  f"Delay Risk: {surgery['Delay Risk']} | "
                  f"Original Time: {surgery['Original Time']}")

# Example usage
if __name__ == "__main__":
    # Example list of surgeries to be scheduled
    example_surgeries = [
        {
            'Patient Age': 65,
            'BMI': 28.5,
            'Surgery Type': 'Hip Replacement',
            'Surgeon': 'Dr. Smith',
            'Anesthesiologist': 'Dr. Brown',
            'Nurse': 'Nurse A',
            'Day of Week': 'Monday',
            'Pre-op Prep Time (min)': 45,
            'Transfer to OR Time (min)': 10,
            'Anesthesia Time (min)': 25,
            'Positioning Time (min)': 20,
            'Comorbidities': 'Hypertension',
            'Instrument Ready (Y/N)': 'Y',
            'PACU Bed Ready (Y/N)': 'Y'
        },
        # Add more surgeries here...
    ]
    
    # Create scheduler instance
    scheduler = SurgeryScheduleOptimizer()
    
    # Get next Monday as start date
    today = datetime.now()
    days_until_monday = (7 - today.weekday()) % 7
    next_monday = today + timedelta(days=days_until_monday)
    
    # Create schedule
    schedule = scheduler.create_weekly_schedule(example_surgeries, next_monday)
    
    # Print schedule
    scheduler.print_schedule(schedule) 