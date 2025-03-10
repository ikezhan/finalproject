import React, { useEffect, useState, useRef } from 'react';
import { Card, CardContent, Typography, Box, Button, CircularProgress, Chip, FormControl, InputLabel, Select, MenuItem, SelectChangeEvent } from '@mui/material';
import { ScheduledSurgery, Surgery } from '../types';
import { createSchedule } from '../services/api';

interface ScheduleCalendarProps {
    surgeries: ScheduledSurgery[];
}

export const ScheduleCalendar: React.FC<ScheduleCalendarProps> = ({ surgeries: propSurgeries }) => {
    const [surgeries, setSurgeries] = useState<ScheduledSurgery[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [currentDate, setCurrentDate] = useState<Date>(new Date());
    const [filterOR, setFilterOR] = useState<number | 'all'>('all');
    
    // Calendar configuration
    const hourHeight = 60; // Height of one hour in pixels
    const startHour = 7;   // Start at 7 AM
    const endHour = 19;    // End at 7 PM
    
    // Refs for DOM elements
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    
    console.log("ScheduleCalendar received surgeries from props:", propSurgeries);
    console.log("Number of surgeries in props:", propSurgeries?.length || 0);
    
    // Update surgeries when props change
    useEffect(() => {
        console.log("Props changed, updating surgeries state");
        if (propSurgeries && Array.isArray(propSurgeries)) {
            console.log(`Setting surgeries state with ${propSurgeries.length} surgeries from props`);
            setSurgeries(propSurgeries);
            
            // Set initial date to the first surgery's date if available
            if (propSurgeries.length > 0 && propSurgeries[0].scheduled_date) {
                console.log(`Setting initial date to ${propSurgeries[0].scheduled_date}`);
                setCurrentDate(new Date(propSurgeries[0].scheduled_date));
            }
        }
    }, [propSurgeries]);
    
    // Scroll to current time on initial render
    useEffect(() => {
        const scrollToCurrentTime = () => {
            const now = new Date();
            const currentHour = now.getHours();
            
            if (currentHour >= startHour && currentHour <= endHour && scrollContainerRef.current) {
                const scrollPosition = (currentHour - startHour) * hourHeight;
                scrollContainerRef.current.scrollTop = scrollPosition;
            }
        };
        
        // Scroll after a short delay to ensure the component is fully rendered
        const timeoutId = setTimeout(scrollToCurrentTime, 500);
        
        return () => clearTimeout(timeoutId);
    }, [currentDate]);
    
    // If no surgeries are provided, create a test surgery and fetch the schedule
    useEffect(() => {
        if (surgeries && surgeries.length > 0) {
            console.log("Surgeries already available, skipping test surgery fetch");
            return;
        }
        
        if (propSurgeries && propSurgeries.length > 0) {
            console.log("Props surgeries available, skipping test surgery fetch");
            return;
        }
        
        console.log("No surgeries available, fetching test schedule");
        const fetchTestSchedule = async () => {
            setLoading(true);
            setError(null);
            
            try {
                // Create a test surgery
                const testSurgery: Surgery = {
                    patient_age: 45,
                    bmi: 24.5,
                    surgery_type: 'Hip Replacement',
                    surgeon: 'Dr. Smith',
                    anesthesiologist: 'Dr. Brown',
                    nurse: 'Nurse A',
                    day_of_week: 'Monday',
                    time_preference: 'Morning',
                    pre_op_prep_time: 30,
                    transfer_to_or_time: 15,
                    anesthesia_time: 20,
                    positioning_time: 10,
                    comorbidities: 'Hypertension',
                    instrument_ready: 'Y',
                    pacu_bed_ready: 'Y',
                    scheduled_start: '09:00'
                };
                
                // Fetch schedule
                const response = await createSchedule([testSurgery], new Date().toISOString().split('T')[0]);
                console.log("Test schedule response:", response);
                
                if (response && response.schedule && Array.isArray(response.schedule)) {
                    console.log(`Setting surgeries state with ${response.schedule.length} surgeries from test`);
                    setSurgeries(response.schedule);
                    
                    // Set initial date if available
                    if (response.schedule.length > 0 && response.schedule[0].scheduled_date) {
                        setCurrentDate(new Date(response.schedule[0].scheduled_date));
                    }
                }
            } catch (err) {
                console.error("Error fetching test schedule:", err);
                setError("Failed to fetch test schedule. Please try again.");
            } finally {
                setLoading(false);
            }
        };
        
        fetchTestSchedule();
    }, [surgeries.length, propSurgeries]);
    
    // Format hour (12-hour format with AM/PM)
    const formatHour = (hour: number) => {
        const period = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour % 12 || 12;
        return `${displayHour} ${period}`;
    };
    
    // Format time (HH:MM format)
    const formatTime = (date: Date) => {
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        return `${hours}:${minutes}`;
    };
    
    // Update date display
    const formatDate = (date: Date) => {
        const options: Intl.DateTimeFormatOptions = { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        };
        return date.toLocaleDateString(undefined, options);
    };
    
    // Navigate to previous day
    const goToPreviousDay = () => {
        const newDate = new Date(currentDate);
        newDate.setDate(newDate.getDate() - 1);
        setCurrentDate(newDate);
    };
    
    // Navigate to next day
    const goToNextDay = () => {
        const newDate = new Date(currentDate);
        newDate.setDate(newDate.getDate() + 1);
        setCurrentDate(newDate);
    };
    
    // Navigate to today
    const goToToday = () => {
        setCurrentDate(new Date());
    };
    
    // Handle OR filter change
    const handleORFilterChange = (event: SelectChangeEvent<number | 'all'>) => {
        setFilterOR(event.target.value as number | 'all');
    };
    
    // Debug function
    const debugCalendar = () => {
        console.log("Debug button clicked");
        console.log("Current surgeries:", surgeries);
        console.log("Current date:", currentDate);
        
        // Show alert with debug info
        alert(`Debug Info:
- ${surgeries.length} surgeries loaded
- Current date: ${formatDate(currentDate)}
- Today's surgeries: ${getTodaySurgeries().length}
- OR Filter: ${filterOR}
        `);
    };
    
    // Get surgeries for the current day
    const getTodaySurgeries = () => {
        const currentDateStr = currentDate.toISOString().split('T')[0];
        return surgeries.filter(surgery => {
            const surgeryDate = surgery.scheduled_date;
            
            // Filter by date
            if (surgeryDate !== currentDateStr) {
                return false;
            }
            
            // Filter by OR if needed
            if (filterOR !== 'all') {
                const operatingRoom = surgery.operating_room ? 
                    (typeof surgery.operating_room === 'number' ? 
                        surgery.operating_room : 
                        parseInt(String(surgery.operating_room), 10)) : 1;
                
                if (operatingRoom !== filterOR) {
                    return false;
                }
            }
            
            return true;
        });
    };
    
    // Get unique ORs from all surgeries
    const getUniqueORs = () => {
        const ors = new Set<number>();
        surgeries.forEach(surgery => {
            const operatingRoom = surgery.operating_room ? 
                (typeof surgery.operating_room === 'number' ? 
                    surgery.operating_room : 
                    parseInt(String(surgery.operating_room), 10)) : 1;
            
            if (!isNaN(operatingRoom)) {
                ors.add(operatingRoom);
            }
        });
        return Array.from(ors).sort();
    };
    
    // Render time column
    const renderTimeColumn = () => {
        const timeSlots = [];
        for (let hour = startHour; hour <= endHour; hour++) {
            timeSlots.push(
                <div 
                    key={`time-${hour}`} 
                    className="time-slot" 
                    style={{
                        position: 'absolute',
                        top: `${(hour - startHour) * hourHeight}px`,
                        left: 0,
                        width: '100%',
                        height: `${hourHeight}px`,
                        borderBottom: '1px solid #eee',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        color: '#666'
                    }}
                >
                    {formatHour(hour)}
                </div>
            );
        }
        return timeSlots;
    };
    
    // Render events
    const renderEvents = () => {
        // Filter events for current day
        const todaySurgeries = getTodaySurgeries();
        
        // Sort surgeries by start time
        todaySurgeries.sort((a, b) => {
            const aTime = a.scheduled_time || '00:00';
            const bTime = b.scheduled_time || '00:00';
            return aTime.localeCompare(bTime);
        });
        
        // Group surgeries by hour to handle overlaps
        const surgeriesByHour: { [hour: string]: ScheduledSurgery[] } = {};
        todaySurgeries.forEach(surgery => {
            const timeStr = surgery.scheduled_time || '00:00';
            const hour = timeStr.split(':')[0];
            if (!surgeriesByHour[hour]) {
                surgeriesByHour[hour] = [];
            }
            surgeriesByHour[hour].push(surgery);
        });
        
        // Render each surgery
        return todaySurgeries.map((surgery, index) => {
            // Parse time
            const timeStr = surgery.scheduled_time || '09:00';
            const [hourStr, minuteStr] = timeStr.split(':');
            const hour = parseInt(hourStr, 10);
            const minute = parseInt(minuteStr, 10);
            
            // Calculate duration
            const duration = surgery.estimated_duration || 60;
            const durationHours = duration / 60;
            
            // Calculate position and size
            const top = (hour - startHour) * hourHeight + (minute / 60) * hourHeight;
            const height = durationHours * hourHeight;
            
            // Calculate width and left position (for overlapping events)
            const surgeriesInSameHour = surgeriesByHour[hourStr] || [];
            const surgeryIndex = surgeriesInSameHour.indexOf(surgery);
            const width = 100 / (surgeriesInSameHour.length || 1);
            const left = surgeryIndex * width;
            
            // Determine color based on delay risk
            const isHighRisk = surgery.delay_risk === 'High' || surgery.delay_risk === 'High Risk';
            const backgroundColor = isHighRisk ? '#FF3B30' : '#34C759';
            
            // Ensure operating room is a valid number
            const operatingRoom = surgery.operating_room ? 
                (typeof surgery.operating_room === 'number' ? 
                    surgery.operating_room : 
                    parseInt(String(surgery.operating_room), 10)) : 1;
            
            // Ensure operating room is between 1-3
            const validOR = isNaN(operatingRoom) ? 1 : Math.min(Math.max(operatingRoom, 1), 3);
            
            return (
                <div
                    key={`surgery-${index}`}
                    style={{
                        position: 'absolute',
                        top: `${top}px`,
                        height: `${height}px`,
                        left: `${left}%`,
                        width: `${width}%`,
                        backgroundColor: backgroundColor,
                        borderRadius: '4px',
                        padding: '5px',
                        fontSize: '12px',
                        color: 'white',
                        overflow: 'hidden',
                        boxSizing: 'border-box',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                        transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                        cursor: 'pointer',
                        zIndex: 1
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'scale(1.02)';
                        e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.3)';
                        e.currentTarget.style.zIndex = '2';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'scale(1)';
                        e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
                        e.currentTarget.style.zIndex = '1';
                    }}
                >
                    <div style={{ fontWeight: 'bold', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {`OR${validOR}: ${surgery.surgery_type}`}
                    </div>
                    <div style={{ fontSize: '10px', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {`Dr. ${surgery.surgeon}`}
                    </div>
                    <div style={{ fontSize: '10px', marginTop: '2px' }}>
                        {`${timeStr} - ${duration} min`}
                    </div>
                    <div style={{ fontSize: '10px', marginTop: '2px' }}>
                        {`Age: ${surgery.patient_age}, Risk: ${surgery.delay_risk || 'Unknown'}`}
                    </div>
                </div>
            );
        });
    };
    
    // Show loading state
    if (loading) {
        return (
            <Card elevation={0} sx={{ bgcolor: 'background.paper', height: '80vh', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', borderRadius: '8px', overflow: 'hidden' }}>
                <CircularProgress />
            </Card>
        );
    }
    
    // Show error state
    if (error) {
        return (
            <Card elevation={0} sx={{ bgcolor: 'background.paper', height: '80vh', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', borderRadius: '8px', overflow: 'hidden' }}>
                <CardContent>
                    <Typography variant="h2" gutterBottom>
                        Error Loading Schedule
                    </Typography>
                    <Typography variant="body1" color="error" paragraph>
                        {error}
                    </Typography>
                    <Button 
                        variant="contained" 
                        color="primary" 
                        onClick={() => window.location.reload()}
                    >
                        Refresh Page
                    </Button>
                </CardContent>
            </Card>
        );
    }
    
    // Check if surgeries is undefined or empty
    if (!surgeries || surgeries.length === 0) {
        return (
            <Card elevation={0} sx={{ bgcolor: 'background.paper', height: '80vh', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', borderRadius: '8px', overflow: 'hidden' }}>
                <CardContent>
                    <Typography variant="h2" gutterBottom>
                        Surgery Schedule
                    </Typography>
                    <Typography variant="body1" color="textSecondary" paragraph>
                        No surgeries scheduled. Add surgeries or import from Excel to see the schedule.
                    </Typography>
                    <Box sx={{ mt: 2 }}>
                        <Typography variant="body2" color="textSecondary" paragraph>
                            If you've just imported surgeries and don't see them here, try refreshing the page.
                        </Typography>
                        <Button 
                            variant="outlined" 
                            color="primary" 
                            onClick={() => window.location.reload()}
                        >
                            Refresh Page
                        </Button>
                    </Box>
                </CardContent>
            </Card>
        );
    }
    
    // Find the date range of surgeries
    let minDate = '';
    let maxDate = '';
    
    if (surgeries.length > 0) {
        // Find min and max dates
        const dates = surgeries
            .map(s => s.scheduled_date)
            .filter(d => d) // Remove undefined/null
            .sort();
        
        if (dates.length > 0) {
            minDate = dates[0];
            maxDate = dates[dates.length - 1];
            console.log(`Surgery date range: ${minDate} to ${maxDate}`);
        }
    }
    
    // Get today's surgeries count
    const todaySurgeriesCount = getTodaySurgeries().length;
    
    // Get unique ORs for filter
    const uniqueORs = getUniqueORs();
    
    // Calculate total height of the calendar content
    const calendarContentHeight = (endHour - startHour + 1) * hourHeight;
    
    return (
        <Card elevation={0} sx={{ bgcolor: 'background.paper', height: '80vh', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', borderRadius: '8px', overflow: 'hidden' }}>
            <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#333', mb: 2 }}>Surgery Schedule</Typography>
                <Typography variant="body2" color="textSecondary" paragraph>
                    Showing {surgeries.length} scheduled surgeries
                    {minDate && maxDate ? ` from ${minDate} to ${maxDate}` : ''}
                </Typography>
                
                {/* Filters and Controls */}
                <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography variant="body2" color="textSecondary" sx={{ mr: 2 }}>
                            {todaySurgeriesCount > 0 
                                ? `Showing ${todaySurgeriesCount} surgeries for ${formatDate(currentDate)}` 
                                : `No surgeries scheduled for ${formatDate(currentDate)}`}
                        </Typography>
                        
                        <FormControl size="small" sx={{ minWidth: 120, ml: 2 }}>
                            <InputLabel id="or-filter-label">Operating Room</InputLabel>
                            <Select
                                labelId="or-filter-label"
                                value={filterOR}
                                label="Operating Room"
                                onChange={handleORFilterChange}
                            >
                                <MenuItem value="all">All ORs</MenuItem>
                                {uniqueORs.map(or => (
                                    <MenuItem key={or} value={or}>OR {or}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Box>
                    
                    <Box>
                        {minDate && (
                            <Button 
                                variant="outlined" 
                                color="secondary" 
                                size="small"
                                onClick={() => setCurrentDate(new Date(minDate))}
                                sx={{ ml: 1 }}
                            >
                                Go to First Surgery
                            </Button>
                        )}
                    </Box>
                </Box>
                
                {/* Custom Calendar */}
                <Box sx={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    border: '1px solid #ddd', 
                    borderRadius: '4px', 
                    overflow: 'hidden',
                    height: 'calc(80vh - 250px)', // Reduced height to make room for buttons
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}>
                    {/* Calendar Header */}
                    <Box sx={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center', 
                        bgcolor: '#f8f9fa', 
                        p: 1, 
                        borderBottom: '1px solid #ddd' 
                    }}>
                        <Button 
                            onClick={goToPreviousDay}
                            variant="outlined"
                            size="small"
                            sx={{ minWidth: '40px', p: '4px 8px' }}
                        >
                            &lt;
                        </Button>
                        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                            {formatDate(currentDate)}
                        </Typography>
                        <Button 
                            onClick={goToNextDay}
                            variant="outlined"
                            size="small"
                            sx={{ minWidth: '40px', p: '4px 8px' }}
                        >
                            &gt;
                        </Button>
                    </Box>
                    
                    {/* Calendar Body */}
                    <Box 
                        ref={scrollContainerRef}
                        sx={{ 
                            display: 'flex', 
                            flex: 1, 
                            overflow: 'auto',
                            '&::-webkit-scrollbar': {
                                width: '8px',
                            },
                            '&::-webkit-scrollbar-track': {
                                backgroundColor: '#f1f1f1',
                            },
                            '&::-webkit-scrollbar-thumb': {
                                backgroundColor: '#c1c1c1',
                                borderRadius: '4px',
                            },
                        }}
                    >
                        {/* Time Column */}
                        <Box 
                            sx={{ 
                                width: '80px', 
                                borderRight: '1px solid #ddd',
                                bgcolor: '#f8f9fa',
                                position: 'relative',
                                flexShrink: 0,
                                height: `${calendarContentHeight}px`,
                                boxShadow: 'inset 0 0 10px rgba(0,0,0,0.1)'
                            }}
                        >
                            {renderTimeColumn()}
                        </Box>
                        
                        {/* Events Container */}
                        <Box 
                            sx={{ 
                                flex: 1, 
                                position: 'relative',
                                bgcolor: '#ffffff',
                                height: `${calendarContentHeight}px`,
                            }}
                        >
                            {/* Hour grid lines */}
                            {Array.from({ length: endHour - startHour + 1 }).map((_, index) => (
                                <div
                                    key={`grid-${index}`}
                                    style={{
                                        position: 'absolute',
                                        top: `${index * hourHeight}px`,
                                        left: 0,
                                        right: 0,
                                        height: '1px',
                                        backgroundColor: '#eee',
                                        zIndex: 0
                                    }}
                                />
                            ))}
                            
                            {/* Current time indicator */}
                            {(() => {
                                const now = new Date();
                                const today = now.toISOString().split('T')[0];
                                const currentDateStr = currentDate.toISOString().split('T')[0];
                                
                                if (today === currentDateStr) {
                                    const hour = now.getHours();
                                    const minute = now.getMinutes();
                                    
                                    if (hour >= startHour && hour <= endHour) {
                                        const top = (hour - startHour) * hourHeight + (minute / 60) * hourHeight;
                                        
                                        return (
                                            <div
                                                style={{
                                                    position: 'absolute',
                                                    top: `${top}px`,
                                                    left: 0,
                                                    right: 0,
                                                    height: '2px',
                                                    backgroundColor: '#ff0000',
                                                    zIndex: 3
                                                }}
                                            />
                                        );
                                    }
                                }
                                
                                return null;
                            })()}
                            
                            {renderEvents()}
                        </Box>
                    </Box>
                </Box>
                
                {/* Navigation Controls */}
                <Box sx={{ mt: 3, mb: 2, display: 'flex', justifyContent: 'center' }}>
                    <Button 
                        variant="contained" 
                        color="primary"
                        onClick={goToPreviousDay}
                        sx={{ mx: 1, minWidth: '140px' }}
                    >
                        Previous Day
                    </Button>
                    <Button 
                        variant="contained" 
                        color="secondary"
                        onClick={goToToday}
                        sx={{ mx: 1, minWidth: '100px' }}
                    >
                        Today
                    </Button>
                    <Button 
                        variant="contained"
                        color="primary" 
                        onClick={goToNextDay}
                        sx={{ mx: 1, minWidth: '140px' }}
                    >
                        Next Day
                    </Button>
                </Box>
            </CardContent>
        </Card>
    );
}; 