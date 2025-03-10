import React, { useState, useEffect } from 'react';
import {
    Box,
    Container,
    Grid,
    AppBar,
    Toolbar,
    Typography,
    IconButton,
    Drawer,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    ListItemButton,
    CssBaseline,
    Button,
    Snackbar,
    Alert,
    useTheme,
    Link,
} from '@mui/material';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import MenuIcon from '@mui/icons-material/Menu';
import { SurgeryForm } from './components/SurgeryForm';
import { ScheduleCalendar } from './components/ScheduleCalendar';
import { BatchImport } from './components/BatchImport';
import { Surgery, ScheduledSurgery } from './types';
import { createSchedule, checkApiConnectivity } from './services/api';

const App: React.FC = () => {
    const theme = useTheme();
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [activeView, setActiveView] = useState<'schedule' | 'add' | 'import'>('schedule');
    const [schedule, setSchedule] = useState<ScheduledSurgery[]>([]);
    const [surgeries, setSurgeries] = useState<Surgery[]>([]);
    const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);
    const [apiConnected, setApiConnected] = useState<boolean | null>(null);

    // Check API connectivity on component mount
    useEffect(() => {
        const checkConnection = async () => {
            try {
                console.log('App: Initiating API connectivity check');
                const isConnected = await checkApiConnectivity();
                console.log('App: API connectivity check result:', isConnected);
                setApiConnected(isConnected);
            } catch (error) {
                console.error('App: Error checking API connectivity:', error);
                
                // Force apiConnected to true when in local environment
                if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
                    console.log('App: Running in local environment, forcing apiConnected to true');
                    setApiConnected(true);
                } else {
                    setApiConnected(false);
                }
            }
        };
        
        checkConnection();
    }, []);

    // Log schedule changes
    useEffect(() => {
        console.log("Current schedule state:", schedule);
        console.log("Number of surgeries in schedule:", schedule?.length || 0);
    }, [schedule]);

    const handleSurgerySubmit = async (surgery: Surgery) => {
        const newSurgeries = [...surgeries, surgery];
        setSurgeries(newSurgeries);
        console.log("Added new surgery, total surgeries:", newSurgeries.length);

        try {
            const startDate = new Date().toISOString().split('T')[0];
            console.log("Creating schedule with start date:", startDate);
            const response = await createSchedule(newSurgeries, startDate);
            console.log("Schedule response:", response);
            
            if (response && response.schedule) {
                console.log("Setting schedule with", response.schedule.length, "surgeries");
                // Create a deep copy to ensure state update is detected
                const scheduleCopy = JSON.parse(JSON.stringify(response.schedule));
                setSchedule(scheduleCopy);
                setActiveView('schedule');
                setNotification({
                    message: 'Surgery scheduled successfully!',
                    type: 'success'
                });
            } else {
                console.error("Invalid response from createSchedule:", response);
                setNotification({
                    message: 'Failed to create schedule. Please try again.',
                    type: 'error'
                });
            }
        } catch (error) {
            console.error('Error creating schedule:', error);
            setNotification({
                message: 'Error creating schedule. Please try again.',
                type: 'error'
            });
        }
    };

    const handleBatchImportComplete = (importedSchedule: ScheduledSurgery[]) => {
        console.log("Received schedule from batch import:", importedSchedule);
        console.log("Number of surgeries in imported schedule:", importedSchedule?.length || 0);
        
        // Make sure we have a valid schedule
        if (importedSchedule && Array.isArray(importedSchedule) && importedSchedule.length > 0) {
            // Create a deep copy to ensure state update is detected
            const scheduleCopy = JSON.parse(JSON.stringify(importedSchedule));
            
            console.log("Setting schedule state to empty array first");
            // Force a state update by setting to empty array first
            setSchedule([]);
            
            // Then set the actual schedule after a short delay
            console.log("Setting schedule state after delay with", scheduleCopy.length, "surgeries");
            setTimeout(() => {
                setSchedule(scheduleCopy);
                setActiveView('schedule');
                
                setNotification({
                    message: `Successfully imported ${importedSchedule.length} surgeries into the schedule.`,
                    type: 'success'
                });
                
                // Log the schedule to verify it's set correctly
                console.log("Schedule state after update:", scheduleCopy);
            }, 100);
        } else {
            console.error("Invalid schedule data received:", importedSchedule);
            setNotification({
                message: 'Failed to import schedule. Please check the console for details.',
                type: 'error'
            });
        }
    };

    const toggleDrawer = () => {
        setDrawerOpen(!drawerOpen);
    };

    const handleNavigation = (view: 'schedule' | 'add' | 'import') => {
        console.log("Navigating to view:", view);
        setActiveView(view);
        setDrawerOpen(false);
    };

    const handleCloseNotification = () => {
        setNotification(null);
    };

    // Debug function to force refresh the schedule
    const forceRefreshSchedule = () => {
        if (schedule && schedule.length > 0) {
            console.log("Forcing schedule refresh");
            const scheduleCopy = JSON.parse(JSON.stringify(schedule));
            setSchedule([]);
            setTimeout(() => setSchedule(scheduleCopy), 100);
        }
    };

    return (
        <>
            <CssBaseline />
            
            {/* API Connectivity Notice - Only shown when API is unavailable */}
            {apiConnected === false && (
                <div className="gh-pages-notice" style={{
                    position: 'fixed',
                    top: '10px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: '#FF5722',
                    color: 'white',
                    padding: '10px 20px',
                    borderRadius: '50px',
                    fontSize: '14px',
                    zIndex: 2000,
                    textAlign: 'center',
                    maxWidth: '90%',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
                    animation: 'fadeIn 0.5s ease-in-out'
                }}>
                    <strong>🚨 API SERVER UNAVAILABLE</strong>: This GitHub Pages site cannot connect to the required API server.
                    <br />For the interactive class demo, <Link href="./static-demo.html" style={{ color: 'white', textDecoration: 'underline', fontWeight: 'bold' }}>CLICK HERE</Link> to use the standalone demo with mock data.
                </div>
            )}
            
            <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f5f7fa' }}>
                <AppBar 
                    position="fixed" 
                    sx={{
                        backgroundColor: theme.palette.mode === 'dark' ? theme.palette.background.paper : theme.palette.primary.main,
                        boxShadow: 3,
                        zIndex: (theme) => theme.zIndex.drawer + 1,
                    }}
                >
                    <Toolbar>
                        <IconButton
                            color="inherit"
                            onClick={toggleDrawer}
                            edge="start"
                            sx={{ mr: 2 }}
                        >
                            <MenuIcon />
                        </IconButton>
                        <Typography 
                            variant="h6" 
                            component="div" 
                            sx={{ 
                                flexGrow: 1, 
                                color: '#ffffff',
                                fontWeight: 'bold',
                                letterSpacing: '0.5px',
                            }}
                        >
                            Surgery Scheduler
                        </Typography>
                        {activeView === 'schedule' && schedule && schedule.length > 0 && (
                            <Button 
                                color="inherit" 
                                onClick={forceRefreshSchedule}
                                sx={{ 
                                    ml: 2,
                                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                    '&:hover': {
                                        backgroundColor: 'rgba(255, 255, 255, 0.2)',
                                    }
                                }}
                            >
                                Refresh View
                            </Button>
                        )}
                    </Toolbar>
                </AppBar>

                <Drawer 
                    anchor="left" 
                    open={drawerOpen} 
                    onClose={toggleDrawer}
                    sx={{
                        width: 280,
                        flexShrink: 0,
                        '& .MuiDrawer-paper': {
                            width: 280,
                            boxSizing: 'border-box',
                            backgroundColor: '#1a2035',
                            boxShadow: '4px 0 10px rgba(0, 0, 0, 0.1)',
                        },
                    }}
                >
                    <Toolbar /> {/* Spacer to push content below AppBar */}
                    <Box sx={{ 
                        overflow: 'auto',
                        display: 'flex',
                        flexDirection: 'column',
                        height: '100%',
                        p: 2,
                    }}>
                        <Typography 
                            variant="h6" 
                            sx={{ 
                                color: '#ffffff', 
                                mb: 3, 
                                pl: 2,
                                fontWeight: 'bold',
                            }}
                        >
                            Menu
                        </Typography>
                        <List sx={{ width: '100%' }}>
                            <ListItem disablePadding>
                                <ListItemButton 
                                    onClick={() => handleNavigation('schedule')}
                                    selected={activeView === 'schedule'}
                                    sx={{
                                        borderRadius: 2,
                                        mb: 1,
                                        backgroundColor: activeView === 'schedule' ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                                        '&:hover': {
                                            backgroundColor: 'rgba(255, 255, 255, 0.15)',
                                        },
                                    }}
                                >
                                    <ListItemIcon sx={{ color: '#ffffff' }}>
                                        <CalendarMonthIcon />
                                    </ListItemIcon>
                                    <ListItemText 
                                        primary="Schedule" 
                                        sx={{ 
                                            '& .MuiListItemText-primary': { 
                                                color: '#ffffff',
                                                fontWeight: activeView === 'schedule' ? 'bold' : 'normal',
                                            } 
                                        }}
                                    />
                                </ListItemButton>
                            </ListItem>
                            <ListItem disablePadding>
                                <ListItemButton 
                                    onClick={() => handleNavigation('add')}
                                    selected={activeView === 'add'}
                                    sx={{
                                        borderRadius: 2,
                                        mb: 1,
                                        backgroundColor: activeView === 'add' ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                                        '&:hover': {
                                            backgroundColor: 'rgba(255, 255, 255, 0.15)',
                                        },
                                    }}
                                >
                                    <ListItemIcon sx={{ color: '#ffffff' }}>
                                        <AddCircleOutlineIcon />
                                    </ListItemIcon>
                                    <ListItemText 
                                        primary="Add Surgery" 
                                        sx={{ 
                                            '& .MuiListItemText-primary': { 
                                                color: '#ffffff',
                                                fontWeight: activeView === 'add' ? 'bold' : 'normal',
                                            } 
                                        }}
                                    />
                                </ListItemButton>
                            </ListItem>
                            <ListItem disablePadding>
                                <ListItemButton 
                                    onClick={() => handleNavigation('import')}
                                    selected={activeView === 'import'}
                                    sx={{
                                        borderRadius: 2,
                                        mb: 1,
                                        backgroundColor: activeView === 'import' ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                                        '&:hover': {
                                            backgroundColor: 'rgba(255, 255, 255, 0.15)',
                                        },
                                    }}
                                >
                                    <ListItemIcon sx={{ color: '#ffffff' }}>
                                        <FileUploadIcon />
                                    </ListItemIcon>
                                    <ListItemText 
                                        primary="Batch Import" 
                                        sx={{ 
                                            '& .MuiListItemText-primary': { 
                                                color: '#ffffff',
                                                fontWeight: activeView === 'import' ? 'bold' : 'normal',
                                            } 
                                        }}
                                    />
                                </ListItemButton>
                            </ListItem>
                        </List>
                        <Box sx={{ flexGrow: 1 }} />
                        <Typography 
                            variant="body2" 
                            sx={{ 
                                color: 'rgba(255, 255, 255, 0.5)', 
                                textAlign: 'center',
                                mt: 2,
                                mb: 2,
                            }}
                        >
                            Surgery Scheduler v1.0
                        </Typography>
                    </Box>
                </Drawer>

                <Box
                    component="main"
                    sx={{
                        flexGrow: 1,
                        p: 3,
                        mt: 8,
                        bgcolor: '#f5f7fa',
                    }}
                >
                    <Container maxWidth="lg">
                        <Grid container spacing={3}>
                            <Grid item xs={12}>
                                {activeView === 'add' && (
                                    <SurgeryForm onSubmit={handleSurgerySubmit} />
                                )}
                                {activeView === 'import' && (
                                    <BatchImport onImportComplete={handleBatchImportComplete} />
                                )}
                                {activeView === 'schedule' && (
                                    <>
                                        <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                                            {schedule && schedule.length > 0 
                                                ? `Showing ${schedule.length} surgeries in the schedule` 
                                                : 'No surgeries in the schedule'}
                                        </Typography>
                                        <ScheduleCalendar surgeries={schedule} />
                                    </>
                                )}
                            </Grid>
                        </Grid>
                    </Container>
                </Box>
                
                <Snackbar 
                    open={notification !== null} 
                    autoHideDuration={6000} 
                    onClose={handleCloseNotification}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                >
                    {notification && (
                        <Alert 
                            onClose={handleCloseNotification} 
                            severity={notification.type} 
                            sx={{ 
                                width: '100%',
                                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
                                borderRadius: 2,
                            }}
                        >
                            {notification.message}
                        </Alert>
                    ) || <div />}
                </Snackbar>
            </Box>
        </>
    );
};

export default App;
