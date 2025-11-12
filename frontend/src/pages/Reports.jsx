import React, { useState, useEffect } from 'react';
import axiosInstance from '../api/axios';
import {
    Container, Box, Typography, Grid, Paper, Table, TableBody,
    TableCell, TableContainer, TableHead, TableRow, Alert
} from '@mui/material';

const Reports = () => {
    const [summary, setSummary] = useState({});
    const [completed, setCompleted] = useState([]);
    const [rejected, setRejected] = useState([]);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchReports = async () => {
            try {
                const summaryRes = await axiosInstance.get('/reports/summary');
                setSummary(summaryRes.data.data);

                const completedRes = await axiosInstance.get('/reports/completed');
                setCompleted(completedRes.data.data);

                const rejectedRes = await axiosInstance.get('/reports/rejected');
                setRejected(rejectedRes.data.data);
            } catch (err) {
                setError('Failed to fetch reports.');
                console.error('Fetch reports error:', err);
            }
        };

        fetchReports();
    }, []);

    const SummaryCard = ({ title, value }) => (
        <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h6">{title}</Typography>
            <Typography variant="h4">{value}</Typography>
        </Paper>
    );

    return (
        <Container component="main" maxWidth="lg">
            <Box sx={{ marginTop: 8 }}>
                <Typography component="h1" variant="h4" gutterBottom>
                    Reports
                </Typography>
                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                <Typography component="h2" variant="h5" gutterBottom sx={{ mt: 4 }}>
                    Reservations Summary
                </Typography>
                <Grid container spacing={3}>
                    <Grid item xs={12} sm={6} md={3}>
                        <SummaryCard title="Total Pending" value={summary.total_pending || 0} />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <SummaryCard title="Total Approved" value={summary.total_approved || 0} />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <SummaryCard title="Total Picked Up" value={summary.total_borrowed || 0} />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <SummaryCard title="Total Completed" value={summary.total_completed || 0} />
                    </Grid>
                </Grid>

                <Typography component="h2" variant="h5" gutterBottom sx={{ mt: 4 }}>
                    Completed Reservations
                </Typography>
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>ID</TableCell>
                                <TableCell>User ID</TableCell>
                                <TableCell>Occasion</TableCell>
                                <TableCell>Reservation Date</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {completed.map(reservation => (
                                <TableRow key={reservation.id}>
                                    <TableCell>{reservation.id}</TableCell>
                                    <TableCell>{reservation.user_id}</TableCell>
                                    <TableCell>{reservation.occasion}</TableCell>
                                    <TableCell>{new Date(reservation.reservation_date).toLocaleDateString()}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>

                <Typography component="h2" variant="h5" gutterBottom sx={{ mt: 4 }}>
                    Rejected Reservations
                </Typography>
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>ID</TableCell>
                                <TableCell>User ID</TableCell>
                                <TableCell>Occasion</TableCell>
                                <TableCell>Reservation Date</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {rejected.map(reservation => (
                                <TableRow key={reservation.id}>
                                    <TableCell>{reservation.id}</TableCell>
                                    <TableCell>{reservation.user_id}</TableCell>
                                    <TableCell>{reservation.occasion}</TableCell>
                                    <TableCell>{new Date(reservation.reservation_date).toLocaleDateString()}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Box>
        </Container>
    );
};

export default Reports;