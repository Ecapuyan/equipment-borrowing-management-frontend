import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axiosInstance from '../api/axios';
import {
    Container, Box, Typography, Button, TextField, Table, TableBody,
    TableCell, TableContainer, TableHead, TableRow, Paper, IconButton, Alert
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

const SuperadminDashboard = () => {
    const [staff, setStaff] = useState([]);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [email, setEmail] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [editing, setEditing] = useState(false);
    const [currentStaffId, setCurrentStaffId] = useState(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const fetchStaff = () => {
        axiosInstance.get('/staff')
        .then(res => {
            setStaff(res.data.data);
        })
        .catch(err => {
            setError('Failed to fetch staff.');
            console.error('Fetch staff error:', err);
        });
    };

    useEffect(() => {
        fetchStaff();
    }, []);

    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        const staffData = {
            username,
            email,
            first_name: firstName,
            last_name: lastName,
            ...(editing ? {} : { password })
        };

        const request = editing
            ? axiosInstance.patch(`/staff/${currentStaffId}`, staffData)
            : axiosInstance.post('/staff', staffData);

        request.then(res => {
            setSuccess(`Staff ${editing ? 'updated' : 'created'} successfully.`);
            fetchStaff();
            resetForm();
        })
        .catch(err => {
            setError(err.response?.data?.message || `Failed to ${editing ? 'update' : 'create'} staff.`);
        });
    };

    const handleEdit = (staffMember) => {
        setEditing(true);
        setCurrentStaffId(staffMember.id);
        setUsername(staffMember.username);
        setEmail(staffMember.email);
        setFirstName(staffMember.first_name);
        setLastName(staffMember.last_name);
        setPassword('');
    };

    const handleDelete = (id) => {
        axiosInstance.delete(`/staff/${id}`)
        .then(res => {
            setSuccess('Staff deleted successfully.');
            fetchStaff();
        })
        .catch(err => {
            setError('Failed to delete staff.');
        });
    };
    
    const resetForm = () => {
        setEditing(false);
        setCurrentStaffId(null);
        setUsername('');
        setPassword('');
        setEmail('');
        setFirstName('');
        setLastName('');
    };

    return (
        <Container component="main" maxWidth="lg">
            <Box sx={{ marginTop: 8 }}>
                <Typography component="h1" variant="h4" gutterBottom>
                    Superadmin Dashboard
                </Typography>
                <Button
                    component={Link}
                    to="/reports"
                    variant="contained"
                    sx={{ mb: 2 }}
                >
                    View Reports
                </Button>
                <Typography component="h2" variant="h5" gutterBottom>
                    Manage Staff
                </Typography>
                <Paper sx={{ p: 2, mb: 3 }}>
                    <Box component="form" onSubmit={handleSubmit} noValidate sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                        <TextField label="Username" value={username} onChange={e => setUsername(e.target.value)} required fullWidth />
                        {!editing && <TextField label="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} required fullWidth />}
                        <TextField label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} required fullWidth />
                        <TextField label="First Name" value={firstName} onChange={e => setFirstName(e.target.value)} required fullWidth />
                        <TextField label="Last Name" value={lastName} onChange={e => setLastName(e.target.value)} required fullWidth />
                        <Button type="submit" variant="contained" sx={{ mt: 1 }}>{editing ? 'Update Staff' : 'Create Staff'}</Button>
                        {editing && <Button variant="outlined" onClick={resetForm} sx={{ mt: 1, ml: 1 }}>Cancel</Button>}
                    </Box>
                    {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
                    {success && <Alert severity="success" sx={{ mt: 2 }}>{success}</Alert>}
                </Paper>
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Username</TableCell>
                                <TableCell>Email</TableCell>
                                <TableCell>First Name</TableCell>
                                <TableCell>Last Name</TableCell>
                                <TableCell align="right">Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {staff.map(staffMember => (
                                <TableRow key={staffMember.id}>
                                    <TableCell>{staffMember.username}</TableCell>
                                    <TableCell>{staffMember.email}</TableCell>
                                    <TableCell>{staffMember.first_name}</TableCell>
                                    <TableCell>{staffMember.last_name}</TableCell>
                                    <TableCell align="right">
                                        <IconButton onClick={() => handleEdit(staffMember)}><EditIcon /></IconButton>
                                        <IconButton onClick={() => handleDelete(staffMember.id)}><DeleteIcon /></IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Box>
        </Container>
    );
};

export default SuperadminDashboard;