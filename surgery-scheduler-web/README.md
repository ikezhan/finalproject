# Surgery Scheduler Web Interface

A modern, Apple-style web interface for the AI-powered Surgery Scheduling System.

## Features

- 🏥 Intelligent surgery scheduling with ML-powered predictions
- 📅 Custom interactive calendar view with resource management
- 🎨 Apple-inspired design system
- 📱 Responsive layout for all devices
- 🔄 Real-time schedule updates
- 🚦 Visual delay risk indicators

## Tech Stack

- Frontend:
  - React with TypeScript
  - Material-UI with custom Apple-style theme
  - Custom calendar implementation for schedule visualization
  - Formik for form handling
  - Axios for API communication

- Backend:
  - FastAPI
  - scikit-learn for ML models
  - pandas for data processing
  - Python 3.11+

## Getting Started

### Prerequisites

- Node.js 16+
- Python 3.11+
- pip

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   ```

2. Install frontend dependencies:
   ```bash
   cd surgery-scheduler-web
   npm install
   ```

3. Install backend dependencies:
   ```bash
   cd ../surgery-scheduler-api
   pip install -r requirements.txt
   ```

### Running the Application

1. Start the backend server:
   ```bash
   cd surgery-scheduler-api
   uvicorn app.main:app --reload --port 8003
   ```

2. Start the frontend development server:
   ```bash
   cd surgery-scheduler-web
   npm start
   ```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

1. Click "Add Surgery" to schedule a new surgery
2. Fill in the required information:
   - Patient details
   - Surgery type
   - Staff assignments
   - Time requirements
3. Submit the form to get AI-powered scheduling recommendations
4. View the optimized schedule in the calendar view
5. Alternatively, use "Batch Import" to upload multiple surgeries at once

## Features in Detail

### Custom Calendar Implementation

The system uses a custom-built calendar component that:
- Displays surgeries in a day view format
- Shows a current time indicator for today
- Supports filtering by operating room
- Handles overlapping surgeries
- Provides interactive surgery cards with hover effects
- Allows easy navigation between days

### Scheduling Algorithm

The system uses machine learning to:
- Predict surgery durations
- Assess delay risks
- Optimize resource allocation
- Balance workload across ORs

### Risk Assessment

Surgeries are color-coded based on delay risk:
- 🟢 Green: Low risk of delay
- 🔴 Red: High risk of delay

### Resource Management

- Tracks OR availability
- Manages staff assignments
- Handles equipment scheduling
- Maintains PACU bed availability

### Batch Import

- Import multiple surgeries from Excel files
- Automatically schedule all surgeries
- View the complete schedule in the calendar

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details
