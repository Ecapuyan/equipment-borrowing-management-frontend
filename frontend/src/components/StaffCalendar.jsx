import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  List,
  ListItem,
  ListItemText,
  Chip,
  Badge,
  Tooltip,
  Button,
  Divider,
  IconButton
} from '@mui/material';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import { PickersDay } from '@mui/x-date-pickers/PickersDay';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import CircleIcon from '@mui/icons-material/Circle';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';

function ServerDay(props) {
  const { highlightedDays = [], day, outsideCurrentMonth, ...other } = props;
  const isSelected = !props.outsideCurrentMonth && highlightedDays.find(d => d.dateStr === day.toDateString());

  return (
    <Badge
      key={props.day.toString()}
      overlap="circular"
      badgeContent={isSelected ? <CircleIcon sx={{ fontSize: '0.75rem', color: isSelected.color }} /> : undefined}
    >
      <PickersDay {...other} outsideCurrentMonth={outsideCurrentMonth} day={day} />
    </Badge>
  );
}

export default function StaffCalendar({ reservations, onMarkDelivered }) {
  const [selectedDate, setSelectedDate] = useState(new Date());

  const highlightedDays = useMemo(() => {
    const days = {};
    reservations.forEach(res => {
        if (!res.reservationDate) return;
        const dateStr = res.reservationDate.toDate().toDateString();
        const status = res.status;
        const isPast = res.reservationDate.toDate() < new Date(new Date().setHours(0,0,0,0));

        if (!days[dateStr]) days[dateStr] = { pending: false, approved: false, overdue: false, delivered: false };

        if (status === 'pending') days[dateStr].pending = true;
        if (status === 'approved') {
            if (isPast) days[dateStr].overdue = true;
            else days[dateStr].approved = true;
        }
        if (status === 'delivered') days[dateStr].delivered = true;
    });

    return Object.keys(days).map(dateStr => {
        const d = days[dateStr];
        let color = 'transparent';
        if (d.overdue) color = '#f44336';
        else if (d.pending) color = '#ff9800';
        else if (d.approved) color = '#4caf50';
        else if (d.delivered) color = '#2196f3';
        return { dateStr, color };
    });
  }, [reservations]);

  const selectedDayReservations = useMemo(() => {
    return reservations.filter(res => 
        res.reservationDate && 
        res.reservationDate.toDate().toDateString() === selectedDate.toDateString()
    );
  }, [reservations, selectedDate]);

  const upcomingApprovedReservations = useMemo(() => {
    const today = new Date();
    today.setHours(0,0,0,0);
    return reservations
        .filter(res => {
            if (res.status !== 'approved') return false;
            if (!res.reservationDate) return false;
            const d = res.reservationDate.toDate();
            return d >= today;
        })
        .sort((a, b) => a.reservationDate.toDate() - b.reservationDate.toDate());
  }, [reservations]);

  return (
    <Grid container spacing={3}>
      {/* Calendar Section - Left Side */}
      <Grid item xs={12} md={5} lg={4}>
        <Paper elevation={3} sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DateCalendar
                    value={selectedDate}
                    onChange={(newValue) => setSelectedDate(newValue)}
                    slots={{ day: ServerDay }}
                    slotProps={{ day: { highlightedDays } }}
                />
            </LocalizationProvider>
            <Box sx={{ mt: 2, display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center', fontSize: '0.8rem' }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}><CircleIcon sx={{ color: '#ff9800', fontSize: 12, mr: 0.5 }} /> Pending</Box>
                <Box sx={{ display: 'flex', alignItems: 'center' }}><CircleIcon sx={{ color: '#4caf50', fontSize: 12, mr: 0.5 }} /> Approved</Box>
                <Box sx={{ display: 'flex', alignItems: 'center' }}><CircleIcon sx={{ color: '#2196f3', fontSize: 12, mr: 0.5 }} /> Delivered</Box>
                <Box sx={{ display: 'flex', alignItems: 'center' }}><CircleIcon sx={{ color: '#f44336', fontSize: 12, mr: 0.5 }} /> Overdue</Box>
            </Box>
        </Paper>
      </Grid>
      
      {/* Right Side Column - Agenda & Upcoming */}
      <Grid item xs={12} md={7} lg={8}>
        <Grid container spacing={3} direction="column">
            
            {/* Agenda Section */}
            <Grid item xs={12}>
                <Paper elevation={3} sx={{ p: 3, minHeight: 300 }}>
                    <Typography variant="h6" gutterBottom>
                        Agenda for {selectedDate.toLocaleDateString()}
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    {selectedDayReservations.length === 0 ? (
                        <Typography variant="body2" color="text.secondary">No reservations scheduled for this day.</Typography>
                    ) : (
                        <List>
                            {selectedDayReservations.map(res => (
                                <ListItem key={res.id} divider alignItems="flex-start">
                                    <ListItemText
                                        primary={
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <Typography variant="subtitle1" component="span" fontWeight="bold">
                                                    {res.fullName}
                                                </Typography>
                                                <Chip 
                                                    label={res.status} 
                                                    size="small" 
                                                    color={
                                                        res.status === 'approved' ? 'success' : 
                                                        res.status === 'pending' ? 'warning' : 
                                                        res.status === 'delivered' ? 'info' : 'default'
                                                    }
                                                    sx={{ textTransform: 'capitalize' }}
                                                />
                                            </Box>
                                        }
                                        secondary={
                                            <>
                                                <Typography variant="body2" component="span" display="block">
                                                    Time: <span style={{ textTransform: 'capitalize' }}>{res.timeSlot}</span>
                                                </Typography>
                                                <Typography variant="body2" component="span" display="block">
                                                    Items: {Array.isArray(res.items) ? res.items.map(i => i.name).join(', ') : 'N/A'}
                                                </Typography>
                                            </>
                                        }
                                    />
                                </ListItem>
                            ))}
                        </List>
                    )}
                </Paper>
            </Grid>

            {/* Upcoming Requests Section */}
            <Grid item xs={12}>
                <Paper elevation={3} sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                        <LocalShippingIcon color="primary" />
                        <Typography variant="h6">Upcoming Requests</Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary" paragraph>
                         Approved reservations scheduled for today and the future.
                    </Typography>
                    
                    {upcomingApprovedReservations.length === 0 ? (
                        <Box sx={{ p: 2, textAlign: 'center', bgcolor: 'grey.50', borderRadius: 1 }}>
                            <Typography color="text.secondary">No upcoming requests.</Typography>
                        </Box>
                    ) : (
                        <Grid container spacing={2}>
                            {upcomingApprovedReservations.map((res) => (
                                <Grid item xs={12} sm={6} key={res.id}>
                                    <Paper variant="outlined" sx={{ p: 2, height: '100%', borderColor: res.reservationDate.toDate().toDateString() === new Date().toDateString() ? 'primary.main' : 'divider' }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                            <Chip 
                                                label={res.reservationDate.toDate().toLocaleDateString()} 
                                                size="small" 
                                                color={res.reservationDate.toDate().toDateString() === new Date().toDateString() ? "primary" : "default"} 
                                                variant={res.reservationDate.toDate().toDateString() === new Date().toDateString() ? "filled" : "outlined"}
                                            />
                                            <Typography variant="caption" sx={{ textTransform: 'capitalize', fontWeight: 'bold' }}>
                                                {res.timeSlot}
                                            </Typography>
                                        </Box>
                                        
                                        <Typography variant="subtitle2" fontWeight="bold" gutterBottom>{res.fullName}</Typography>
                                        <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                                            {Array.isArray(res.items) ? res.items.map(i => `${i.name} (${i.quantity})`).join(', ') : 'N/A'}
                                        </Typography>

                                        <Button 
                                            variant="contained" 
                                            color="primary" 
                                            size="small" 
                                            startIcon={<CheckCircleIcon />}
                                            onClick={() => onMarkDelivered && onMarkDelivered(res.id)}
                                            fullWidth
                                            sx={{ mt: 1 }}
                                        >
                                            Delivered
                                        </Button>
                                    </Paper>
                                </Grid>
                            ))}
                        </Grid>
                    )}
                </Paper>
            </Grid>

        </Grid>
      </Grid>
    </Grid>
  );
}