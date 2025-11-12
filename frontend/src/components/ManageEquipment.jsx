import React, { useState, useEffect } from 'react';
import axiosInstance from '../api/axios';
import {
    Box, Typography, Button, TextField, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, Paper, IconButton, Alert,
    Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

const ManageEquipment = () => {
    const [equipment, setEquipment] = useState([]);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [quantity, setQuantity] = useState(0);
    const [availableQuantity, setAvailableQuantity] = useState(0);
    const [editing, setEditing] = useState(false);
    const [currentEquipmentId, setCurrentEquipmentId] = useState(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [open, setOpen] = useState(false);
    const [equipmentToDelete, setEquipmentToDelete] = useState(null);

    const fetchEquipment = () => {
        axiosInstance.get('/equipment')
        .then(res => {
            setEquipment(res.data.data);
        })
        .catch(err => {
            setError('Failed to fetch equipment.');
            console.error('Fetch equipment error:', err);
        });
    };

    useEffect(() => {
        fetchEquipment();
    }, []);

    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        const equipmentData = {
            name,
            description,
            quantity,
            available_quantity: availableQuantity
        };

        const request = editing
            ? axiosInstance.patch(`/equipment/${currentEquipmentId}`, equipmentData)
            : axiosInstance.post('/equipment', equipmentData);

        request.then(res => {
            setSuccess(`Equipment ${editing ? 'updated' : 'created'} successfully.`);
            fetchEquipment();
            resetForm();
        })
        .catch(err => {
            setError(err.response?.data?.message || `Failed to ${editing ? 'update' : 'create'} equipment.`);
        });
    };

    const handleEdit = (item) => {
        setEditing(true);
        setCurrentEquipmentId(item.id);
        setName(item.name);
        setDescription(item.description);
        setQuantity(item.quantity);
        setAvailableQuantity(item.available_quantity);
    };

    const handleClickOpen = (id) => {
        setEquipmentToDelete(id);
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
        setEquipmentToDelete(null);
    };

    const handleDelete = () => {
        axiosInstance.delete(`/equipment/${equipmentToDelete}`)
        .then(res => {
            setSuccess('Equipment deleted successfully.');
            fetchEquipment();
            handleClose();
        })
        .catch(err => {
            setError('Failed to delete equipment.');
            handleClose();
        });
    };

    const resetForm = () => {
        setEditing(false);
        setCurrentEquipmentId(null);
        setName('');
        setDescription('');
        setQuantity(0);
        setAvailableQuantity(0);
    };

    return (
        <Box>
            <Typography component="h2" variant="h5" gutterBottom>
                Manage Equipment
            </Typography>
            <Paper sx={{ p: 2, mb: 3 }}>
                <Box component="form" onSubmit={handleSubmit} noValidate sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                    <TextField label="Name" value={name} onChange={e => setName(e.target.value)} required />
                    <TextField label="Description" value={description} onChange={e => setDescription(e.target.value)} required />
                    <TextField label="Quantity" type="number" value={quantity} onChange={e => setQuantity(e.target.value)} required />
                    <TextField label="Available Quantity" type="number" value={availableQuantity} onChange={e => setAvailableQuantity(e.target.value)} required />
                    <Button type="submit" variant="contained" sx={{ mt: 1 }}>{editing ? 'Update Equipment' : 'Create Equipment'}</Button>
                    {editing && <Button variant="outlined" onClick={resetForm} sx={{ mt: 1, ml: 1 }}>Cancel</Button>}
                </Box>
                {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
                {success && <Alert severity="success" sx={{ mt: 2 }}>{success}</Alert>}
            </Paper>
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Name</TableCell>
                            <TableCell>Description</TableCell>
                            <TableCell>Quantity</TableCell>
                            <TableCell>Available Quantity</TableCell>
                            <TableCell align="right">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {equipment.map(item => (
                            <TableRow key={item.id}>
                                <TableCell>{item.name}</TableCell>
                                <TableCell>{item.description}</TableCell>
                                <TableCell>{item.quantity}</TableCell>
                                <TableCell>{item.available_quantity}</TableCell>
                                <TableCell align="right">
                                    <IconButton onClick={() => handleEdit(item)}><EditIcon /></IconButton>
                                    <IconButton onClick={() => handleClickOpen(item.id)}><DeleteIcon /></IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
            <Dialog
                open={open}
                onClose={handleClose}
            >
                <DialogTitle>{"Confirm Delete"}</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Are you sure you want to delete this equipment? This action cannot be undone.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose}>Cancel</Button>
                    <Button onClick={handleDelete} color="error">Delete</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default ManageEquipment;