import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.metrics import classification_report, mean_absolute_error, mean_squared_error
from sklearn.preprocessing import StandardScaler
from datetime import datetime
import matplotlib.pyplot as plt

# Load the dataset
df = pd.read_csv('/Users/ikymama/Desktop/UCLA Academics/Data Analytics/AI in operations/Final Project/AI scheduler/AI_Surgery_Scheduling_Dataset__1000_Cases_.csv')

# Store percentile values for risk scoring
age_percentiles = np.percentile(df['Patient Age'], [20, 40, 60, 80])
bmi_percentiles = np.percentile(df['BMI'], [20, 40, 60, 80])

def get_risk_score(value, percentiles):
    """Calculate risk score based on percentile ranges"""
    if value <= percentiles[0]:
        return 1
    elif value <= percentiles[1]:
        return 2
    elif value <= percentiles[2]:
        return 3
    elif value <= percentiles[3]:
        return 4
    else:
        return 5

# Feature Engineering
def preprocess_data(df, is_training=True):
    """
    Preprocess the data for either training or prediction.
    
    Args:
        df: DataFrame to process
        is_training: Boolean indicating if this is training data (True) or prediction data (False)
    """
    # Convert datetime columns
    df['Scheduled Start'] = pd.to_datetime(df['Scheduled Start'])
    if is_training:
        df['Actual Start'] = pd.to_datetime(df['Actual Start'])
        # Calculate delays for training data
        df['Start Delay (min)'] = (df['Actual Start'] - df['Scheduled Start']).dt.total_seconds() / 60
        df['Delay Flag'] = (df['Start Delay (min)'] > 10).astype(int)
    
    # Extract time features
    df['Hour'] = df['Scheduled Start'].dt.hour
    df['Is_Morning'] = (df['Hour'] < 12).astype(int)
    
    # Create complexity score based on multiple factors
    df['Complexity_Score'] = (
        df['Pre-op Prep Time (min)'] +
        df['Anesthesia Time (min)'] +
        df['Positioning Time (min)']
    ) / 3
    
    # Create risk score based on patient factors
    if is_training:
        df['Age_Risk'] = pd.qcut(df['Patient Age'], q=5, labels=[1,2,3,4,5]).astype(int)
        df['BMI_Risk'] = pd.qcut(df['BMI'], q=5, labels=[1,2,3,4,5]).astype(int)
    else:
        # For prediction, use pre-computed percentiles
        df['Age_Risk'] = df['Patient Age'].apply(lambda x: get_risk_score(x, age_percentiles))
        df['BMI_Risk'] = df['BMI'].apply(lambda x: get_risk_score(x, bmi_percentiles))
    
    df['Risk_Score'] = df['Age_Risk'] + df['BMI_Risk']
    
    # Convert categorical variables
    df['Instrument Ready'] = (df['Instrument Ready (Y/N)'] == 'Y').astype(int)
    df['PACU Bed Ready'] = (df['PACU Bed Ready (Y/N)'] == 'Y').astype(int)
    if is_training:
        df['Readmission'] = (df['Readmission (Y/N)'] == 'Y').astype(int)
    
    # Create dummy variables for categorical columns
    categorical_cols = ['Surgery Type', 'Surgeon', 'Day of Week', 'Anesthesiologist', 'Comorbidities', 'Nurse']
    df = pd.get_dummies(df, columns=categorical_cols)
    
    return df

# Preprocess the training data
df_processed = preprocess_data(df, is_training=True)

# Define features and targets
feature_cols = [
    # Patient characteristics
    'Patient Age', 'BMI', 'Age_Risk', 'BMI_Risk', 'Risk_Score',
    
    # Time-related features
    'Hour', 'Is_Morning',
    
    # Preparation times
    'Pre-op Prep Time (min)', 'Transfer to OR Time (min)',
    'Anesthesia Time (min)', 'Positioning Time (min)',
    'Complexity_Score',
    
    # Resource readiness
    'Instrument Ready', 'PACU Bed Ready',
    
    # Keep all the dummy variables for categorical columns
    *[col for col in df_processed.columns if any(x in col for x in [
        'Surgery Type_', 'Surgeon_', 'Day of Week_',
        'Anesthesiologist_', 'Comorbidities_', 'Nurse_'
    ])]
]

X = df_processed[feature_cols]
y_delay = df_processed['Delay Flag']
y_time = df_processed['Total OR Time (min)']

# Split data
X_train, X_test, y_delay_train, y_delay_test = train_test_split(X, y_delay, test_size=0.2, random_state=42)
_, _, y_time_train, y_time_test = train_test_split(X, y_time, test_size=0.2, random_state=42)

# Scale features
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)

# Train models with better parameters
delay_model = RandomForestClassifier(
    n_estimators=100,
    max_depth=10,
    min_samples_split=5,
    min_samples_leaf=2,
    random_state=42
)

duration_model = RandomForestRegressor(
    n_estimators=100,
    max_depth=15,
    min_samples_split=5,
    min_samples_leaf=2,
    random_state=42
)

# Train models
delay_model.fit(X_train_scaled, y_delay_train)
duration_model.fit(X_train_scaled, y_time_train)

# Evaluate models
print("\nDelay Prediction Model Performance:")
print(classification_report(y_delay_test, delay_model.predict(X_test_scaled)))

print("\nSurgery Duration Model Performance:")
mae = mean_absolute_error(y_time_test, duration_model.predict(X_test_scaled))
rmse = np.sqrt(mean_squared_error(y_time_test, duration_model.predict(X_test_scaled)))
print(f'Mean Absolute Error: {mae:.2f} minutes')
print(f'Root Mean Squared Error: {rmse:.2f} minutes')

# Cross-validation scores
delay_cv_scores = cross_val_score(delay_model, X_train_scaled, y_delay_train, cv=5)
duration_cv_scores = cross_val_score(duration_model, X_train_scaled, y_time_train, cv=5)

print("\nCross-validation Scores:")
print(f"Delay Model: {delay_cv_scores.mean():.3f} (+/- {delay_cv_scores.std() * 2:.3f})")
print(f"Duration Model: {duration_cv_scores.mean():.3f} (+/- {duration_cv_scores.std() * 2:.3f})")

# Feature importance analysis
def plot_feature_importance(model, feature_names, title):
    importances = model.feature_importances_
    indices = np.argsort(importances)[::-1]
    
    plt.figure(figsize=(10, 6))
    plt.title(f"Top 15 Most Important Features for {title}")
    plt.bar(range(15), importances[indices[:15]])
    plt.xticks(range(15), [feature_names[i] for i in indices[:15]], rotation=45, ha='right')
    plt.tight_layout()
    plt.show()

plot_feature_importance(delay_model, feature_cols, "Delay Prediction")
plot_feature_importance(duration_model, feature_cols, "Duration Prediction")

def predict_surgery(surgery_data):
    """
    Predict surgery delay and duration for new cases.
    
    Args:
        surgery_data (dict): Dictionary containing surgery information
        
    Returns:
        dict: Predictions including delay probability and estimated duration
    """
    # Create a DataFrame with the new surgery data
    df_new = pd.DataFrame([surgery_data])
    
    # Set a default duration based on surgery type and complexity if not predicted
    base_duration = (df_new['Pre-op Prep Time (min)'].iloc[0] +
                    df_new['Transfer to OR Time (min)'].iloc[0] +
                    df_new['Anesthesia Time (min)'].iloc[0] +
                    df_new['Positioning Time (min)'].iloc[0])
    
    # Add dummy Actual Start if not provided (for prediction only)
    if 'Actual Start' not in df_new.columns:
        df_new['Actual Start'] = df_new['Scheduled Start']
    
    # Preprocess input data
    df_new_processed = preprocess_data(df_new, is_training=False)
    
    # Ensure all feature columns exist
    for col in feature_cols:
        if col not in df_new_processed.columns:
            df_new_processed[col] = 0
    
    # Select features and scale
    X_new = df_new_processed[feature_cols]
    X_new_scaled = scaler.transform(X_new)
    
    # Make predictions
    delay_prob = delay_model.predict_proba(X_new_scaled)[0][1]
    duration_pred = max(base_duration, duration_model.predict(X_new_scaled)[0])
    
    return {
        'Delay_Probability': round(delay_prob, 2),
        'Predicted_Delay': 'High Risk' if delay_prob > 0.5 else 'Low Risk',
        'Predicted_Duration': round(duration_pred, 1),
        'Duration_Range': f"{round(duration_pred - rmse, 1)} - {round(duration_pred + rmse, 1)}"
    }

# Example usage
example_surgery = {
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
    'Scheduled Start': '2025-03-10 09:00:00'
}

prediction = predict_surgery(example_surgery)
print("\nExample Prediction:")
print(f"Delay Risk: {prediction['Predicted_Delay']} (Probability: {prediction['Delay_Probability']})")
print(f"Estimated Duration: {prediction['Predicted_Duration']} minutes")
print(f"Duration Range: {prediction['Duration_Range']} minutes") 