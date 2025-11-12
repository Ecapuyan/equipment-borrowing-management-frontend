import React, { useState, useEffect } from 'react';
import axiosInstance from '../api/axios';
import {
    Box, Typography, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, Paper, Select, MenuItem, FormControl, Alert,
    Button, Dialog, DialogActions, DialogContent, DialogTitle,
    Grid, Card, CardMedia, Chip
} from '@mui/material';

const ManageReservations = () => {
    const [reservations, setReservations] = useState([]);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [open, setOpen] = useState(false);
    const [selectedReservation, setSelectedReservation] = useState(null);
    const [reservationItems, setReservationItems] = useState([]);

    const fetchReservations = () => {
        axiosInstance.get('/reservations')
        .then(res => {
            setReservations(res.data.data);
        })
        .catch(err => {
            setError('Failed to fetch reservations.');
        });
    };

    useEffect(() => {
        fetchReservations();
    }, []);

    const handleStatusChange = (id, status) => {
        setError('');
        setSuccess('');
        axiosInstance.patch(`/reservations/${id}`, { status })
        .then(res => {
            setSuccess('Reservation status updated successfully.');
            fetchReservations();
        })
        .catch(err => {
            setError('Failed to update reservation status.');
        });
    };

    const handleView = (reservation) => {
        setSelectedReservation(reservation);
        axiosInstance.get(`/reservations/${reservation.id}/items`)
            .then(res => {
                setReservationItems(res.data.data);
                setOpen(true);
            })
            .catch(err => {
                setError('Failed to fetch reservation items.');
            });
    };

    const handleClose = () => {
        setOpen(false);
        setSelectedReservation(null);
        setReservationItems([]);
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'pending': return 'warning';
            case 'approved': return 'info';
            case 'picked_up': return 'primary';
            case 'returned': return 'success';
            case 'rejected': return 'error';
            default: return 'default';
        }
    };

    return (
        <Box>
            <Typography component="h2" variant="h5" gutterBottom>
                Manage Reservations
            </Typography>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>ID</TableCell>
                            <TableCell>Borrower Name</TableCell>
                            <TableCell>Phone Number</TableCell>
                            <TableCell>Occasion</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell>Reservation Date</TableCell>
                            <TableCell>Time Slot</TableCell>
                            <TableCell align="right">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {reservations.map(reservation => (
                            <TableRow key={reservation.id}>
                                <TableCell>{reservation.id}</TableCell>
                                <TableCell>
                                    {reservation.first_name} {reservation.last_name}
                                </TableCell>
                                <TableCell>{reservation.phone_number}</TableCell>
                                <TableCell>{reservation.occasion}</TableCell>
                                <TableCell>
                                    <Chip 
                                        label={reservation.status} 
                                        color={getStatusColor(reservation.status)}
                                        size="small"
                                    />
                                </TableCell>
                                <TableCell>{new Date(reservation.reservation_date).toLocaleDateString()}</TableCell>
                                <TableCell>{reservation.time_slot}</TableCell>
                                <TableCell align="right">
                                    <Button size="small" onClick={() => handleView(reservation)}>View Details</Button>
                                    <FormControl size="small" sx={{ ml: 1, minWidth: 120 }}>
                                        <Select
                                            value={reservation.status}
                                            onChange={(e) => handleStatusChange(reservation.id, e.target.value)}
                                        >
                                            <MenuItem value="pending">Pending</MenuItem>
                                            <MenuItem value="approved">Approved</MenuItem>
                                            <MenuItem value="rejected">Rejected</MenuItem>
                                            <MenuItem value="picked_up">Picked Up</MenuItem>
                                            <MenuItem value="returned">Returned</MenuItem>
                                        </Select>
                                    </FormControl>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
            
            {/* Enhanced Dialog for Reservation Details */}
            <Dialog open={open} onClose={handleClose} maxWidth="lg" fullWidth>
                <DialogTitle>Reservation Details - #{selectedReservation?.id}</DialogTitle>
                <DialogContent>
                    {selectedReservation && (
                        <Grid container spacing={3}>
                            {/* Borrower Information */}
                            <Grid item xs={12} md={6}>
                                <Typography variant="h6" gutterBottom>Borrower Information</Typography>
                                <Card sx={{ p: 2, mb: 2 }}>
                                    <Typography><strong>Full Name:</strong> {selectedReservation.first_name} {selectedReservation.last_name}</Typography>
                                    <Typography><strong>Phone Number:</strong> {selectedReservation.phone_number}</Typography>
                                    <Typography><strong>Email:</strong> {selectedReservation.email}</Typography>
                                    <Typography><strong>Full Address:</strong> {selectedReservation.full_address}</Typography>
                                </Card>
                                
                                <Typography variant="h6" gutterBottom>Reservation Details</Typography>
                                <Card sx={{ p: 2 }}>
                                    <Typography><strong>Occasion:</strong> {selectedReservation.occasion}</Typography>
                                    <Typography><strong>Reservation Date:</strong> {new Date(selectedReservation.reservation_date).toLocaleDateString()}</Typography>
                                    <Typography><strong>Time Slot:</strong> {selectedReservation.time_slot}</Typography>
                                    <Typography><strong>Status:</strong> 
                                        <Chip 
                                            label={selectedReservation.status} 
                                            color={getStatusColor(selectedReservation.status)}
                                            size="small"
                                            sx={{ ml: 1 }}
                                        />
                                    </Typography>
                                    {selectedReservation.notes && (
                                        <Typography><strong>Notes:</strong> {selectedReservation.notes}</Typography>
                                    )}
                                </Card>
                            </Grid>

                            {/* Equipment and Images */}
                            <Grid item xs={12} md={6}>
                                <Typography variant="h6" gutterBottom>Equipment to be Borrowed</Typography>
                                <Card sx={{ p: 2, mb: 2 }}>
                                    {reservationItems.map(item => (
                                        <Typography key={item.name} sx={{ mb: 1 }}>
                                            • {item.name} - Quantity: {item.quantity}
                                            {item.description && ` (${item.description})`}
                                        </Typography>
                                    ))}
                                </Card>

                                <Typography variant="h6" gutterBottom>Verification Images</Typography>
                                <Grid container spacing={2}>
                                    <Grid item xs={12} md={6}>
                                        <Card>
                                            <CardMedia
                                                component="img"
                                                height="200"
                                                image={`http://localhost:3000/uploads/${selectedReservation.id_picture}`}
                                                alt="ID Picture"
                                                sx={{ objectFit: 'contain' }}
                                            />
                                            <Typography variant="body2" align="center" sx={{ p: 1 }}>
                                                ID Picture
                                            </Typography>
                                        </Card>
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                        <Card>
                                            <CardMedia
                                                component="img"
                                                height="200"
                                                image={`http://localhost:3000/uploads/${selectedReservation.selfie_picture}`}
                                                alt="Selfie with ID"
                                                sx={{ objectFit: 'contain' }}
                                            />
                                            <Typography variant="body2" align="center" sx={{ p: 1 }}>
                                                Selfie with ID
                                            </Typography>
                                        </Card>
                                    </Grid>
                                </Grid>
                            </Grid>
                        </Grid>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose}>Close</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default ManageReservations;