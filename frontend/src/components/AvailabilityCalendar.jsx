import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip
} from '@mui/material';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';

const AvailabilityCalendar = ({ allEquipment, allReservations }) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [availabilityList, setAvailabilityList] = useState([]);

  useEffect(() => {
    if (!selectedDate || !allEquipment) return;

    const dateStr = selectedDate.toDateString();

    const stats = allEquipment.map(item => {
      const totalStock = parseInt(item.totalStock || 0, 10);
      
      // Filter reservations for this specific date and item
      const dailyReservations = allReservations.filter(r => 
        r.reservationDate && 
        r.reservationDate.toDate().toDateString() === dateStr &&
        r.items && 
        r.items.some(i => i.id === item.id) &&
        (r.status === 'approved' || r.status === 'pending') // Count pending too to be safe
      );

      let morningReserved = 0;
      let afternoonReserved = 0;

      dailyReservations.forEach(res => {
        const itemInRes = res.items.find(i => i.id === item.id);
        const qty = parseInt(itemInRes.quantity || 0, 10);

        if (res.timeSlot === 'morning') {
            morningReserved += qty;
        } else if (res.timeSlot === 'afternoon') {
            afternoonReserved += qty;
        } else if (res.timeSlot === 'fullday') {
            morningReserved += qty;
            afternoonReserved += qty;
        }
      });

      return {
        ...item,
        availableMorning: Math.max(0, totalStock - morningReserved),
        availableAfternoon: Math.max(0, totalStock - afternoonReserved)
      };
    });

    setAvailabilityList(stats);
  }, [selectedDate, allEquipment, allReservations]);

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={5}>
        <Paper elevation={3} sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Typography variant="h6" gutterBottom>Select Date</Typography>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DateCalendar 
                    value={selectedDate} 
                    onChange={(newValue) => setSelectedDate(newValue)}
                    disablePast
                    views={['day']}
                />
            </LocalizationProvider>
        </Paper>
      </Grid>
      <Grid item xs={12} md={7}>
        <Paper elevation={3} sx={{ p: 2, height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h6" gutterBottom>
                Availability for {selectedDate.toLocaleDateString()}
            </Typography>
            <TableContainer sx={{ flexGrow: 1, overflowY: 'auto' }}>
                <Table size="small" stickyHeader>
                    <TableHead>
                        <TableRow>
                            <TableCell>Equipment</TableCell>
                            <TableCell align="center">Morning (7am-2pm)</TableCell>
                            <TableCell align="center">Afternoon (3pm-9pm)</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {availabilityList.map((item) => (
                            <TableRow key={item.id} hover>
                                <TableCell component="th" scope="row" sx={{ fontWeight: 'bold' }}>
                                    {item.name}
                                </TableCell>
                                <TableCell align="center">
                                    <Chip 
                                        label={item.availableMorning} 
                                        color={item.availableMorning > 0 ? "success" : "error"} 
                                        size="small" 
                                        variant={item.availableMorning > 0 ? "filled" : "outlined"}
                                    />
                                </TableCell>
                                <TableCell align="center">
                                    <Chip 
                                        label={item.availableAfternoon} 
                                        color={item.availableAfternoon > 0 ? "success" : "error"} 
                                        size="small" 
                                        variant={item.availableAfternoon > 0 ? "filled" : "outlined"}
                                    />
                                </TableCell>
                            </TableRow>
                        ))}
                        {availabilityList.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={3} align="center">No equipment found.</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
        </Paper>
      </Grid>
    </Grid>
  );
};

export default AvailabilityCalendar;
