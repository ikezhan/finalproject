import React, { useState } from 'react';
import {
    Box,
    Button,
    Card,
    CardContent,
    Typography,
    TextField,
    Alert,
    CircularProgress,
    Grid,
    Divider,
    List,
    ListItem,
    ListItemText,
} from '@mui/material';
import { ScheduledSurgery } from '../types';
import { downloadTemplate, batchImportSurgeries } from '../services/api';

interface BatchImportProps {
    onImportComplete: (surgeries: ScheduledSurgery[]) => void;
}

export const BatchImport: React.FC<BatchImportProps> = ({ onImportComplete }) => {
    const [file, setFile] = useState<File | null>(null);
    const [startDate, setStartDate] = useState<string>(
        new Date().toISOString().split('T')[0]
    );
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [importErrors, setImportErrors] = useState<string[]>([]);
    const [debugInfo, setDebugInfo] = useState<string | null>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files.length > 0) {
            const selectedFile = event.target.files[0];
            console.log("Selected file:", selectedFile.name, "Size:", selectedFile.size, "bytes");
            setFile(selectedFile);
            setError(null);
        }
    };

    const handleDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setStartDate(event.target.value);
        console.log("Start date changed to:", event.target.value);
    };

    const handleDownloadTemplate = () => {
        console.log("Downloading template");
        downloadTemplate();
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        
        if (!file) {
            setError('Please select a file to upload');
            return;
        }

        console.log("Submitting batch import with file:", file.name, "and start date:", startDate);
        setLoading(true);
        setError(null);
        setSuccess(null);
        setImportErrors([]);
        setDebugInfo(null);

        try {
            console.log("Calling batchImportSurgeries API");
            const response = await batchImportSurgeries(file, startDate);
            console.log("Batch import response:", response);
            
            // Debug info
            const debugText = `Imported: ${response.imported_count}, Schedule length: ${response.schedule?.length || 0}`;
            setDebugInfo(debugText);
            console.log(debugText);
            
            setSuccess(`Successfully imported ${response.imported_count} surgeries`);
            
            if (response.errors && response.errors.length > 0) {
                console.log("Import errors:", response.errors);
                setImportErrors(response.errors);
            }
            
            if (response.schedule && Array.isArray(response.schedule) && response.schedule.length > 0) {
                console.log("Calling onImportComplete with schedule:", response.schedule);
                console.log("Schedule contains", response.schedule.length, "surgeries");
                
                // Create a deep copy to ensure state update is detected
                const scheduleCopy = JSON.parse(JSON.stringify(response.schedule));
                onImportComplete(scheduleCopy);
            } else {
                console.error("Invalid schedule in response:", response.schedule);
                setError("Failed to generate schedule. Please try again.");
            }
        } catch (err: any) {
            console.error('Error importing surgeries:', err);
            setError(err.response?.data?.detail || 'Failed to import surgeries');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card elevation={0} sx={{ bgcolor: 'background.paper' }}>
            <CardContent>
                <Typography variant="h2" gutterBottom>
                    Batch Import Surgeries
                </Typography>
                
                <Box sx={{ mb: 4 }}>
                    <Typography variant="body1" paragraph>
                        Upload an Excel file with multiple surgeries to schedule them all at once.
                    </Typography>
                    <Button 
                        variant="outlined" 
                        color="primary" 
                        onClick={handleDownloadTemplate}
                        sx={{ mb: 2 }}
                    >
                        Download Template
                    </Button>
                </Box>
                
                <Divider sx={{ mb: 4 }} />
                
                <form onSubmit={handleSubmit}>
                    <Grid container spacing={3}>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                type="file"
                                inputProps={{ accept: '.xlsx, .xls' }}
                                onChange={handleFileChange}
                                helperText={file ? `Selected: ${file.name}` : "Select an Excel file (.xlsx, .xls)"}
                                InputLabelProps={{ shrink: true }}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Start Date"
                                type="date"
                                value={startDate}
                                onChange={handleDateChange}
                                InputLabelProps={{ shrink: true }}
                                helperText="Select the start date for scheduling"
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <Button
                                type="submit"
                                variant="contained"
                                color="primary"
                                disabled={loading || !file}
                                sx={{ mt: 2 }}
                            >
                                {loading ? <CircularProgress size={24} /> : 'Import Surgeries'}
                            </Button>
                        </Grid>
                    </Grid>
                </form>
                
                {error && (
                    <Alert severity="error" sx={{ mt: 3 }}>
                        {error}
                    </Alert>
                )}
                
                {success && (
                    <Alert severity="success" sx={{ mt: 3 }}>
                        {success}
                    </Alert>
                )}
                
                {debugInfo && (
                    <Alert severity="info" sx={{ mt: 3 }}>
                        Debug Info: {debugInfo}
                    </Alert>
                )}
                
                {importErrors.length > 0 && (
                    <Box sx={{ mt: 3 }}>
                        <Typography variant="h6" color="error">
                            Import Warnings ({importErrors.length})
                        </Typography>
                        <List dense>
                            {importErrors.map((err, index) => (
                                <ListItem key={index}>
                                    <ListItemText primary={err} />
                                </ListItem>
                            ))}
                        </List>
                    </Box>
                )}
            </CardContent>
        </Card>
    );
}; 