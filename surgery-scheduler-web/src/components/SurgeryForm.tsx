import React from 'react';
import { useFormik } from 'formik';
import * as yup from 'yup';
import {
    Box,
    TextField,
    Button,
    Grid,
    MenuItem,
    Typography,
    Card,
    CardContent,
    FormControl,
    InputLabel,
    Select,
    FormHelperText,
} from '@mui/material';
import { Surgery } from '../types';

const validationSchema = yup.object({
    patient_age: yup.number().required('Age is required').min(0, 'Age must be positive'),
    bmi: yup.number().required('BMI is required').min(10, 'BMI must be at least 10'),
    surgery_type: yup.string().required('Surgery type is required'),
    surgeon: yup.string().required('Surgeon is required'),
    anesthesiologist: yup.string().required('Anesthesiologist is required'),
    nurse: yup.string().required('Nurse is required'),
    day_of_week: yup.string().required('Preferred day is required'),
    time_preference: yup.string().required('Time preference is required'),
    comorbidities: yup.string().required('Comorbidities information is required'),
    instrument_ready: yup.string().required('Instrument readiness is required'),
    pacu_bed_ready: yup.string().required('PACU bed readiness is required'),
    // Make time fields optional since they'll be predicted
    pre_op_prep_time: yup.number().optional(),
    transfer_to_or_time: yup.number().optional(),
    anesthesia_time: yup.number().optional(),
    positioning_time: yup.number().optional(),
    scheduled_start: yup.string().optional(),
});

interface SurgeryFormProps {
    onSubmit: (values: Surgery) => void;
    initialValues?: Surgery;
}

const defaultInitialValues: Surgery = {
    patient_age: 0,
    bmi: 0,
    surgery_type: '',
    surgeon: '',
    anesthesiologist: '',
    nurse: '',
    day_of_week: '',
    time_preference: 'Morning',
    pre_op_prep_time: 0,
    transfer_to_or_time: 0,
    anesthesia_time: 0,
    positioning_time: 0,
    comorbidities: '',
    instrument_ready: 'Y',
    pacu_bed_ready: 'Y',
    scheduled_start: '',
};

const surgeryTypes = [
    'Hip Replacement',
    'Knee Replacement',
    'ACL Repair',
    'Arthroscopy',
    'Cataract Surgery',
];

const surgeons = ['Dr. Smith', 'Dr. Johnson', 'Dr. Wilson'];
const anesthesiologists = ['Dr. Brown', 'Dr. Davis'];
const nurses = ['Nurse A', 'Nurse B', 'Nurse C', 'Nurse D', 'Nurse E'];
const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const timePreferences = ['Morning', 'Afternoon', 'No Preference'];
const comorbidityOptions = [
    'None',
    'Hypertension',
    'Diabetes',
    'Obesity',
    'Heart Disease',
    'COPD',
    'Asthma',
    'Kidney Disease',
    'Liver Disease',
    'Immunocompromised',
    'Multiple'
];

export const SurgeryForm: React.FC<SurgeryFormProps> = ({ onSubmit, initialValues = defaultInitialValues }) => {
    const formik = useFormik({
        initialValues,
        validationSchema,
        onSubmit: (values) => {
            // Set default values for the time fields that will be predicted
            const enhancedValues = {
                ...values,
                pre_op_prep_time: values.pre_op_prep_time || 30,
                transfer_to_or_time: values.transfer_to_or_time || 15,
                anesthesia_time: values.anesthesia_time || 20,
                positioning_time: values.positioning_time || 10,
                scheduled_start: values.time_preference === 'Morning' ? '09:00' : 
                                 values.time_preference === 'Afternoon' ? '13:00' : '10:00',
            };
            onSubmit(enhancedValues);
        },
    });

    return (
        <Card elevation={0} sx={{ bgcolor: 'background.paper' }}>
            <CardContent>
                <Typography variant="h2" gutterBottom>
                    Schedule Surgery
                </Typography>
                <form onSubmit={formik.handleSubmit}>
                    <Grid container spacing={3}>
                        <Grid item xs={12}>
                            <Typography variant="h6" gutterBottom>
                                Patient Information
                            </Typography>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                id="patient_age"
                                name="patient_age"
                                label="Patient Age"
                                type="number"
                                value={formik.values.patient_age}
                                onChange={formik.handleChange}
                                error={formik.touched.patient_age && Boolean(formik.errors.patient_age)}
                                helperText={formik.touched.patient_age && formik.errors.patient_age}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                id="bmi"
                                name="bmi"
                                label="BMI"
                                type="number"
                                value={formik.values.bmi}
                                onChange={formik.handleChange}
                                error={formik.touched.bmi && Boolean(formik.errors.bmi)}
                                helperText={formik.touched.bmi && formik.errors.bmi}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                id="comorbidities"
                                name="comorbidities"
                                label="Comorbidities"
                                select
                                value={formik.values.comorbidities}
                                onChange={formik.handleChange}
                                error={formik.touched.comorbidities && Boolean(formik.errors.comorbidities)}
                                helperText={formik.touched.comorbidities && formik.errors.comorbidities}
                            >
                                {comorbidityOptions.map((option) => (
                                    <MenuItem key={option} value={option}>
                                        {option}
                                    </MenuItem>
                                ))}
                            </TextField>
                        </Grid>
                        <Grid item xs={12}>
                            <Typography variant="h6" gutterBottom>
                                Surgery Details
                            </Typography>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                id="surgery_type"
                                name="surgery_type"
                                label="Surgery Type"
                                select
                                value={formik.values.surgery_type}
                                onChange={formik.handleChange}
                                error={formik.touched.surgery_type && Boolean(formik.errors.surgery_type)}
                                helperText={formik.touched.surgery_type && formik.errors.surgery_type}
                            >
                                {surgeryTypes.map((option) => (
                                    <MenuItem key={option} value={option}>
                                        {option}
                                    </MenuItem>
                                ))}
                            </TextField>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                id="surgeon"
                                name="surgeon"
                                label="Surgeon"
                                select
                                value={formik.values.surgeon}
                                onChange={formik.handleChange}
                                error={formik.touched.surgeon && Boolean(formik.errors.surgeon)}
                                helperText={formik.touched.surgeon && formik.errors.surgeon}
                            >
                                {surgeons.map((option) => (
                                    <MenuItem key={option} value={option}>
                                        {option}
                                    </MenuItem>
                                ))}
                            </TextField>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                id="anesthesiologist"
                                name="anesthesiologist"
                                label="Anesthesiologist"
                                select
                                value={formik.values.anesthesiologist}
                                onChange={formik.handleChange}
                                error={formik.touched.anesthesiologist && Boolean(formik.errors.anesthesiologist)}
                                helperText={formik.touched.anesthesiologist && formik.errors.anesthesiologist}
                            >
                                {anesthesiologists.map((option) => (
                                    <MenuItem key={option} value={option}>
                                        {option}
                                    </MenuItem>
                                ))}
                            </TextField>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                id="nurse"
                                name="nurse"
                                label="Nurse"
                                select
                                value={formik.values.nurse}
                                onChange={formik.handleChange}
                                error={formik.touched.nurse && Boolean(formik.errors.nurse)}
                                helperText={formik.touched.nurse && formik.errors.nurse}
                            >
                                {nurses.map((option) => (
                                    <MenuItem key={option} value={option}>
                                        {option}
                                    </MenuItem>
                                ))}
                            </TextField>
                        </Grid>
                        <Grid item xs={12}>
                            <Typography variant="h6" gutterBottom>
                                Scheduling Preferences
                            </Typography>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                id="day_of_week"
                                name="day_of_week"
                                label="Preferred Day"
                                select
                                value={formik.values.day_of_week}
                                onChange={formik.handleChange}
                                error={formik.touched.day_of_week && Boolean(formik.errors.day_of_week)}
                                helperText={formik.touched.day_of_week && formik.errors.day_of_week}
                            >
                                {daysOfWeek.map((option) => (
                                    <MenuItem key={option} value={option}>
                                        {option}
                                    </MenuItem>
                                ))}
                            </TextField>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                id="time_preference"
                                name="time_preference"
                                label="Time Preference"
                                select
                                value={formik.values.time_preference}
                                onChange={formik.handleChange}
                                error={formik.touched.time_preference && Boolean(formik.errors.time_preference)}
                                helperText={formik.touched.time_preference && formik.errors.time_preference}
                            >
                                {timePreferences.map((option) => (
                                    <MenuItem key={option} value={option}>
                                        {option}
                                    </MenuItem>
                                ))}
                            </TextField>
                        </Grid>
                        <Grid item xs={12}>
                            <Typography variant="h6" gutterBottom>
                                Resource Readiness
                            </Typography>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                id="instrument_ready"
                                name="instrument_ready"
                                label="Instruments Ready"
                                select
                                value={formik.values.instrument_ready}
                                onChange={formik.handleChange}
                                error={formik.touched.instrument_ready && Boolean(formik.errors.instrument_ready)}
                                helperText={formik.touched.instrument_ready && formik.errors.instrument_ready}
                            >
                                <MenuItem value="Y">Yes</MenuItem>
                                <MenuItem value="N">No</MenuItem>
                            </TextField>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                id="pacu_bed_ready"
                                name="pacu_bed_ready"
                                label="PACU Bed Ready"
                                select
                                value={formik.values.pacu_bed_ready}
                                onChange={formik.handleChange}
                                error={formik.touched.pacu_bed_ready && Boolean(formik.errors.pacu_bed_ready)}
                                helperText={formik.touched.pacu_bed_ready && formik.errors.pacu_bed_ready}
                            >
                                <MenuItem value="Y">Yes</MenuItem>
                                <MenuItem value="N">No</MenuItem>
                            </TextField>
                        </Grid>
                        <Grid item xs={12}>
                            <Button
                                type="submit"
                                variant="contained"
                                color="primary"
                                size="large"
                                sx={{ mt: 2 }}
                            >
                                Schedule Surgery
                            </Button>
                        </Grid>
                    </Grid>
                </form>
            </CardContent>
        </Card>
    );
}; 