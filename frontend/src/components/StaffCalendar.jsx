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
  Tooltip
} from '@mui/material';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import { PickersDay } from '@mui/x-date-pickers/PickersDay';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import CircleIcon from '@mui/icons-material/Circle';

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

export default function StaffCalendar({ reservations }) {
  const [selectedDate, setSelectedDate] = useState(new Date());

  const highlightedDays = useMemo(() => {
    const days = {}; // dateStr -> { hasPending: bool, hasApproved: bool, hasOverdue: bool }

    reservations.forEach(res => {
        if (!res.reservationDate) return;
        const dateStr = res.reservationDate.toDate().toDateString();
        const status = res.status;
        const isPast = res.reservationDate.toDate() < new Date(new Date().setHours(0,0,0,0));

        if (!days[dateStr]) days[dateStr] = { pending: false, approved: false, overdue: false };

        if (status === 'pending') days[dateStr].pending = true;
        if (status === 'approved') {
            if (isPast) days[dateStr].overdue = true;
            else days[dateStr].approved = true;
        }
    });

    return Object.keys(days).map(dateStr => {
        const d = days[dateStr];
        let color = 'transparent';
        if (d.overdue) color = '#f44336'; // Red
        else if (d.pending) color = '#ff9800'; // Orange
        else if (d.approved) color = '#4caf50'; // Green

        return { dateStr, color };
    });
  }, [reservations]);

  const selectedDayReservations = useMemo(() => {
    return reservations.filter(res => 
        res.reservationDate && 
        res.reservationDate.toDate().toDateString() === selectedDate.toDateString()
    );
  }, [reservations, selectedDate]);

  return (
    <Grid container spacing={2}>
      <Grid item xs={12} md={5}>
        <Paper elevation={3} sx={{ p: 1, display: 'flex', justifyContent: 'center' }}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DateCalendar
                    value={selectedDate}
                    onChange={(newValue) => setSelectedDate(newValue)}
                    slots={{ day: ServerDay }}
                    slotProps={{
                        day: {
                            highlightedDays,
                        },
                    }}
                />
            </LocalizationProvider>
        </Paper>
        <Box sx={{ mt: 2, display: 'flex', gap: 2, justifyContent: 'center', fontSize: '0.8rem' }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}><CircleIcon sx={{ color: '#ff9800', fontSize: 12, mr: 0.5 }} /> Pending</Box>
            <Box sx={{ display: 'flex', alignItems: 'center' }}><CircleIcon sx={{ color: '#4caf50', fontSize: 12, mr: 0.5 }} /> Approved</Box>
            <Box sx={{ display: 'flex', alignItems: 'center' }}><CircleIcon sx={{ color: '#f44336', fontSize: 12, mr: 0.5 }} /> Overdue/Past</Box>
        </Box>
      </Grid>
      
      <Grid item xs={12} md={7}>
        <Paper elevation={3} sx={{ p: 2, height: '100%', minHeight: 400 }}>
            <Typography variant="h6" gutterBottom>
                Agenda for {selectedDate.toLocaleDateString()}
            </Typography>
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
                                                res.status === 'pending' ? 'warning' : 'default'
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
    </Grid>
  );
}
