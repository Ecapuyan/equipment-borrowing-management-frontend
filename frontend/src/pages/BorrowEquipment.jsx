import React, { useState, useEffect } from 'react';
import axiosInstance from '../api/axios';
import {
    Container, Box, Typography, Button, TextField, Table, TableBody,
    TableCell, TableContainer, TableHead, TableRow, Paper, Alert,
    Grid, Radio, RadioGroup, FormControlLabel, FormControl, FormLabel
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format } from 'date-fns';

const BorrowEquipment = () => {
    const [user, setUser] = useState(null);
    const [equipmentAvailability, setEquipmentAvailability] = useState([]);
    const [cart, setCart] = useState([]);
    const [occasion, setOccasion] = useState('');
    const [notes, setNotes] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [fullAddress, setFullAddress] = useState('');
    const [reservationDate, setReservationDate] = useState(null);
    const [timeSlot, setTimeSlot] = useState('');
    const [slotAvailability, setSlotAvailability] = useState(null);
    const [idPicture, setIdPicture] = useState(null);
    const [selfiePicture, setSelfiePicture] = useState(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            try {
                setUser(JSON.parse(storedUser));
            } catch (e) {
                console.error("Failed to parse user from localStorage", e);
            }
        }
    }, []);

    useEffect(() => {
        if (reservationDate) {
            const formattedDate = format(reservationDate, 'yyyy-MM-dd');
            axiosInstance.get(`/api/availability/slots?date=${formattedDate}`)
            .then(res => {
                setSlotAvailability(res.data);
                setTimeSlot('');
                setEquipmentAvailability([]);
                setCart([]);
            })
            .catch(err => {
                setError('Failed to fetch slot availability.');
            });
        }
    }, [reservationDate]);

    useEffect(() => {
        if (reservationDate && timeSlot) {
            const formattedDate = format(reservationDate, 'yyyy-MM-dd');
            axiosInstance.get(`/api/availability/equipment?date=${formattedDate}&slot=${timeSlot}`)
            .then(res => {
                setEquipmentAvailability(res.data);
                setCart([]);
            })
            .catch(err => {
                setError('Failed to fetch equipment availability.');
            });
        }
    }, [reservationDate, timeSlot]);

    const handleQuantityChange = (equipmentId, quantity) => {
        const quantityNum = parseInt(quantity, 10) || 0;
        if (quantityNum === 0) {
            setCart(cart.filter(item => item.id !== equipmentId));
        } else {
            const equipment = equipmentAvailability.find(item => item.equipment_id === equipmentId);
            if (equipment) {
                const existingItemIndex = cart.findIndex(item => item.id === equipmentId);
                if (existingItemIndex >= 0) {
                    const updatedCart = [...cart];
                    updatedCart[existingItemIndex] = { ...updatedCart[existingItemIndex], quantity: quantityNum };
                    setCart(updatedCart);
                } else {
                    setCart([...cart, { id: equipmentId, name: equipment.name, quantity: quantityNum }]);
                }
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (cart.length === 0) return setError('Your cart is empty. Please add some equipment.');
        if (!occasion) return setError('Please enter an occasion for the reservation.');
        if (!phoneNumber) return setError('Please enter your phone number.');
        if (!fullAddress) return setError('Please enter your full address.');
        if (!reservationDate) return setError('Please select a reservation date.');
        if (!timeSlot) return setError('Please select a time slot.');
        if (!idPicture || !selfiePicture) return setError('Please upload both ID and selfie pictures.');

        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('occasion', occasion);
            formData.append('notes', notes || '');
            formData.append('phone_number', phoneNumber);
            formData.append('full_address', fullAddress);
            formData.append('reservation_date', format(reservationDate, 'yyyy-MM-dd'));
            formData.append('time_slot', timeSlot);
            formData.append('id_picture', idPicture);
            formData.append('selfie_picture', selfiePicture);
            formData.append('items', JSON.stringify(cart));

            await axiosInstance.post('/reservations', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            setSuccess('Reservation submitted successfully!');
            setCart([]);
            setOccasion('');
            setNotes('');
            setPhoneNumber('');
            setFullAddress('');
            setReservationDate(null);
            setTimeSlot('');
            setSlotAvailability(null);
            setEquipmentAvailability([]);
            setIdPicture(null);
            setSelfiePicture(null);
            document.querySelectorAll('input[type="file"]').forEach(input => input.value = '');
        } catch (err) {
            const errorMessage = err.response?.data?.message || 'Failed to submit reservation. Please try again.';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const getCartQuantity = (equipmentId) => {
        const item = cart.find(item => item.id === equipmentId);
        return item ? item.quantity : 0;
    };

    return (
        <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Container component="main" maxWidth="lg">
                <Box sx={{ marginBottom: 4 }}>
                    <Typography component="h1" variant="h4" gutterBottom>
                        Borrow Equipment
                    </Typography>
                    
                    {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
                    {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}

                    <Grid container spacing={3}>
                        <Grid item xs={12} md={6}>
                            <Typography component="h2" variant="h5" gutterBottom>
                                Reservation Details
                            </Typography>
                            <Paper sx={{ p: 3 }}>
                                <Box component="form" noValidate>
                                    <TextField
                                        label="Full Name"
                                        value={(user && `${user.firstName} ${user.lastName}`) || ''}
                                        fullWidth
                                        margin="normal"
                                        disabled
                                        InputLabelProps={{ shrink: true }}
                                    />
                                    <TextField
                                        label="Phone Number"
                                        value={phoneNumber}
                                        onChange={e => setPhoneNumber(e.target.value)}
                                        fullWidth
                                        required
                                        margin="normal"
                                    />
                                    <TextField
                                        label="Full Address"
                                        value={fullAddress}
                                        onChange={e => setFullAddress(e.target.value)}
                                        fullWidth
                                        required
                                        multiline
                                        rows={3}
                                        margin="normal"
                                        placeholder="Enter your complete address including street, barangay, city, and province"
                                    />
                                    <TextField
                                        label="Occasion"
                                        value={occasion}
                                        onChange={e => setOccasion(e.target.value)}
                                        fullWidth
                                        required
                                        margin="normal"
                                    />
                                    <TextField
                                        label="Notes (Optional)"
                                        value={notes}
                                        onChange={e => setNotes(e.target.value)}
                                        fullWidth
                                        multiline
                                        rows={3}
                                        margin="normal"
                                    />
                                    <DatePicker
                                        label="Reservation Date"
                                        value={reservationDate}
                                        onChange={(newValue) => setReservationDate(newValue)}
                                        minDate={new Date(new Date().setDate(new Date().getDate() + 1))}
                                        renderInput={(params) => <TextField {...params} fullWidth required margin="normal" />}
                                    />
                                    {slotAvailability && (
                                        <FormControl component="fieldset" margin="normal" fullWidth required>
                                            <FormLabel component="legend">Time Slot</FormLabel>
                                            <RadioGroup value={timeSlot} onChange={(e) => setTimeSlot(e.target.value)} row>
                                                <FormControlLabel value="morning" control={<Radio />} label="Morning" disabled={!slotAvailability.morning} />
                                                <FormControlLabel value="afternoon" control={<Radio />} label="Afternoon" disabled={!slotAvailability.afternoon} />
                                                <FormControlLabel value="fullday" control={<Radio />} label="Full Day" disabled={!slotAvailability.fullday} />
                                            </RadioGroup>
                                        </FormControl>
                                    )}
                                    <Box sx={{ mt: 2 }}>
                                        <Button variant="contained" component="label" fullWidth>
                                            Upload ID Picture *
                                            <input type="file" hidden accept="image/*" onChange={e => setIdPicture(e.target.files[0])} />
                                        </Button>
                                        {idPicture && <Typography variant="body2" sx={{ mt: 1 }}>Selected: {idPicture.name}</Typography>}
                                    </Box>
                                    <Box sx={{ mt: 2 }}>
                                        <Button variant="contained" component="label" fullWidth>
                                            Upload Selfie with ID *
                                            <input type="file" hidden accept="image/*" onChange={e => setSelfiePicture(e.target.files[0])} />
                                        </Button>
                                        {selfiePicture && <Typography variant="body2" sx={{ mt: 1 }}>Selected: {selfiePicture.name}</Typography>}
                                    </Box>
                                </Box>
                            </Paper>
                            <Button
                                type="submit"
                                fullWidth
                                variant="contained"
                                color="primary"
                                sx={{ mt: 3, mb: 2 }}
                                onClick={handleSubmit}
                                disabled={loading}
                                size="large"
                            >
                                {loading ? 'Submitting...' : 'Submit Reservation'}
                            </Button>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Typography component="h2" variant="h5" gutterBottom>
                                Available Equipment
                            </Typography>
                            {equipmentAvailability.length === 0 ? (
                                <Paper sx={{ p: 3, textAlign: 'center' }}>
                                    <Typography color="textSecondary">
                                        {reservationDate && timeSlot 
                                            ? 'No equipment available for the selected date and time slot.' 
                                            : 'Please select a date and time slot to see available equipment.'}
                                    </Typography>
                                </Paper>
                            ) : (
                                <TableContainer component={Paper}>
                                    <Table>
                                        <TableHead>
                                            <TableRow>
                                                <TableCell>Equipment</TableCell>
                                                <TableCell align="right">Available</TableCell>
                                                <TableCell align="right">Quantity</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {equipmentAvailability.map(item => (
                                                <TableRow key={item.equipment_id}>
                                                    <TableCell>
                                                        <Typography variant="subtitle2">{item.name}</Typography>
                                                        <Typography variant="body2" color="textSecondary">{item.description}</Typography>
                                                    </TableCell>
                                                    <TableCell align="right">{item.available_quantity}</TableCell>
                                                    <TableCell align="right">
                                                        <TextField
                                                            type="number"
                                                            size="small"
                                                            InputProps={{ inputProps: { max: item.available_quantity, min: 0 } }}
                                                            sx={{ width: '80px' }}
                                                            value={getCartQuantity(item.equipment_id)}
                                                            onChange={(e) => handleQuantityChange(item.equipment_id, parseInt(e.target.value, 10))}
                                                        />
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            )}
                        </Grid>
                    </Grid>
                </Box>
            </Container>
        </LocalizationProvider>
    );
};

export default BorrowEquipment;