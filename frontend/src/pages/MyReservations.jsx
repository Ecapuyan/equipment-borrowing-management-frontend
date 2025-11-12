import React, { useState, useEffect } from 'react';
import axiosInstance from '../api/axios';
import {
    Container, Box, Typography, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, Paper, Chip, Alert,
    Button, Dialog, DialogActions, DialogContent, DialogTitle
} from '@mui/material';

const MyReservations = () => {
    const [reservations, setReservations] = useState([]);
    const [error, setError] = useState('');
    const [open, setOpen] = useState(false);
    const [selectedReservation, setSelectedReservation] = useState(null);
    const [reservationItems, setReservationItems] = useState([]);

    useEffect(() => {
        axiosInstance.get('/reservations')
        .then(res => {
            setReservations(res.data.data);
        })
        .catch(err => {
            setError('Failed to fetch reservations.');
        });
    }, []);

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

    const getStatusChip = (status) => {
        let color = 'default';
        switch (status) {
            case 'pending':
                color = 'warning';
                break;
            case 'approved':
                color = 'info';
                break;
            case 'picked_up':
                color = 'primary';
                break;
            case 'returned':
                color = 'success';
                break;
            case 'rejected':
                color = 'error';
                break;
            default:
                color = 'default';
        }
        return <Chip label={status} color={color} />;
    };

    return (
        <Container component="main" maxWidth="md">
            <Box sx={{ marginTop: 8 }}>
                <Typography component="h1" variant="h4" gutterBottom>
                    My Reservations
                </Typography>
                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>ID</TableCell>
                                <TableCell>Occasion</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell>Reservation Date</TableCell>
                                <TableCell align="right">Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {reservations.map(reservation => (
                                <TableRow key={reservation.id}>
                                    <TableCell>{reservation.id}</TableCell>
                                    <TableCell>{reservation.occasion}</TableCell>
                                    <TableCell>{getStatusChip(reservation.status)}</TableCell>
                                    <TableCell>{new Date(reservation.reservation_date).toLocaleDateString()}</TableCell>
                                    <TableCell align="right">
                                        <Button size="small" onClick={() => handleView(reservation)}>View</Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
                <Dialog open={open} onClose={handleClose}>
                    <DialogTitle>Reservation Details</DialogTitle>
                    <DialogContent>
                        {selectedReservation && (
                            <Box>
                                <Typography><strong>ID:</strong> {selectedReservation.id}</Typography>
                                <Typography><strong>Occasion:</strong> {selectedReservation.occasion}</Typography>
                                <Typography><strong>Status:</strong> {selectedReservation.status}</Typography>
                                <Typography><strong>Reservation Date:</strong> {new Date(selectedReservation.reservation_date).toLocaleDateString()}</Typography>
                                <Typography sx={{ mt: 2 }}><strong>Items:</strong></Typography>
                                {reservationItems.map(item => (
                                    <Typography key={item.name}>{item.name} ({item.quantity})</Typography>
                                ))}
                            </Box>
                        )}
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleClose}>Close</Button>
                    </DialogActions>
                </Dialog>
            </Box>
        </Container>
    );
};

export default MyReservations;
