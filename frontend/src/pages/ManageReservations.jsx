// src/pages/ManageReservations.jsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  Typography, Box, CircularProgress, Card, CardContent, Chip, Button,
  Modal, Fade, Backdrop, Grid, Divider, List, ListItem, ListItemText, Paper, Link,
  FormControlLabel, Switch, TextField, Select, MenuItem, FormControl, InputLabel,
  useTheme, IconButton, Tooltip
} from '@mui/material';
import { DataGrid, gridClasses } from '@mui/x-data-grid';
import { db } from '../firebase';
import { collection, getDocs, doc, updateDoc, query, where, addDoc, Timestamp } from 'firebase/firestore';
import { useSnackbar } from '../context/SnackbarContextDef';
import VisibilityIcon from '@mui/icons-material/Visibility';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';

const modalStyle = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: { xs: '90%', sm: 600 },
  bgcolor: 'background.paper',
  boxShadow: 24,
  p: 0,
  borderRadius: 3,
  maxHeight: '90vh',
  overflowY: 'auto',
  display: 'flex',
  flexDirection: 'column'
};

const returnModalStyle = {
  ...modalStyle,
  p: 4,
};

function ManageReservations() {
  const [reservations, setReservations] = useState([]);
  const [equipments, setEquipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showSnackbar } = useSnackbar();
  const theme = useTheme();
  
  // Detail Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState(null);

  // Return/Incident Modal State
  const [returnModalOpen, setReturnModalOpen] = useState(false);
  const [returnIssue, setReturnIssue] = useState({
    hasIssue: false,
    itemId: '',
    type: 'damaged',
    description: '',
    cost: ''
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const reservationsSnapshot = await getDocs(collection(db, 'reservations'));
      const reservationData = reservationsSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
      setReservations(reservationData);

      const equipmentSnapshot = await getDocs(collection(db, 'equipments'));
      const equipmentData = equipmentSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
      setEquipments(equipmentData);

    } catch (err) { 
      console.error("Failed to load reservation data.", err);
      showSnackbar("Failed to load reservation data.", "error"); 
    } 
    finally { setLoading(false); }
  }, [showSnackbar]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleOpenModal = (reservation) => {
    setSelectedReservation(reservation);
    setModalOpen(true);
  };
  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedReservation(null);
  };

  const handleOpenReturnModal = () => {
    setReturnIssue({ hasIssue: false, itemId: '', type: 'damaged', description: '', cost: '' });
    setReturnModalOpen(true);
  };

  const handleReturnSubmit = async () => {
    if (!selectedReservation) return;

    try {
      // 1. If there's an issue, report it
      if (returnIssue.hasIssue) {
        if (!returnIssue.itemId || !returnIssue.description) {
            showSnackbar("Please select the item and describe the issue.", "warning");
            return;
        }
        
        const affectedItem = selectedReservation.items.find(i => i.id === returnIssue.itemId);

        await addDoc(collection(db, 'incident_reports'), {
            reservationId: selectedReservation.id,
            residentName: selectedReservation.fullName,
            residentId: selectedReservation.userId,
            equipmentId: returnIssue.itemId,
            equipmentName: affectedItem?.name || 'Unknown Item',
            type: returnIssue.type,
            description: returnIssue.description,
            cost: returnIssue.cost || 0,
            status: 'open',
            dateReported: Timestamp.now()
        });
      }

      // 2. Mark reservation as returned
      await updateDoc(doc(db, 'reservations', selectedReservation.id), { 
          status: 'returned',
          returnDate: Timestamp.now(),
          hasIncident: returnIssue.hasIssue 
      });

      showSnackbar(`Reservation marked as returned${returnIssue.hasIssue ? ' with incident report' : ''}.`, 'success');
      fetchData();
      setReturnModalOpen(false);
      handleCloseModal(); 

    } catch (err) {
      console.error("Error processing return:", err);
      showSnackbar("Failed to process return.", "error");
    }
  };

  const handleStatusUpdate = async (reservation, newStatus) => {
    try {
      if (newStatus === 'approved') {
        const approvedReservationsQuery = query(collection(db, 'reservations'), where('status', '==', 'approved'), where('reservationDate', '==', reservation.reservationDate));
        const approvedReservationsSnapshot = await getDocs(approvedReservationsQuery);
        const approvedReservations = approvedReservationsSnapshot.docs.map(d => d.data());

        for (const item of reservation.items) {
          const equipment = equipments.find(e => e.id === item.id);
          const stock = equipment?.totalStock || 0;
          const reservationsForThisItem = approvedReservations.filter(r => Array.isArray(r.items) && r.items.some(i => i.id === item.id) && r.reservationDate.toDate().toDateString() === reservation.reservationDate.toDate().toDateString());
          
          let reservedCount = 0;
          for (const res of reservationsForThisItem) {
            const itemInRes = res.items.find(i => i.id === item.id);
            if (res.timeSlot === 'fullday' || res.timeSlot === reservation.timeSlot) reservedCount += itemInRes.quantity;
            else if (reservation.timeSlot === 'fullday' && (res.timeSlot === 'morning' || res.timeSlot === 'afternoon')) reservedCount += itemInRes.quantity;
          }
          
          if ((reservedCount + item.quantity) > stock) {
            showSnackbar(`Cannot approve. Not enough stock for "${item.name}". Only ${stock - reservedCount} available.`, 'error');
            return;
          }
        }
      }

      await updateDoc(doc(db, 'reservations', reservation.id), { status: newStatus });
      showSnackbar(`Reservation successfully ${newStatus}.`, 'success');
      fetchData();
      handleCloseModal();
    } catch (err) {
      console.error("Failed to update reservation status.", err);
      showSnackbar("Failed to update reservation status.", 'error');
    }
  };
  
  const columns = [
    { field: 'fullName', headerName: 'Resident Name', flex: 1.5, minWidth: 150 },
    { field: 'reason', headerName: 'Reason', flex: 2, minWidth: 200 },
    {
      field: 'items',
      headerName: 'Equipments',
      flex: 1,
      minWidth: 150,
      renderCell: (params) => {
        const itemCount = Array.isArray(params.row.items) ? params.row.items.reduce((sum, item) => sum + item.quantity, 0) : 0;
        return (
            <Chip 
                label={`${itemCount} Item${itemCount !== 1 ? 's' : ''}`} 
                size="small" 
                variant="outlined"
            />
        );
      },
    },
    {
      field: 'reservationDate', headerName: 'Date', flex: 1, minWidth: 120,
      renderCell: (params) => (params.value ? new Date(params.value.seconds * 1000).toLocaleDateString() : 'N/A'),
    },
    {
      field: 'status', headerName: 'Status', flex: 1, minWidth: 120,
      renderCell: (params) => {
        const status = params.value;
        let color = 'default';
        if (status === 'pending') color = 'warning';
        if (status === 'approved') color = 'success';
        if (status === 'delivered') color = 'info';
        if (status === 'rejected' || status === 'cancelled' || status === 'returned') color = 'error';
        return (
            <Chip 
                label={status} 
                color={color} 
                size="small" 
                sx={{ textTransform: 'capitalize', fontWeight: 'bold' }}
            />
        );
      },
    },
    {
        field: 'actions', headerName: 'Actions', sortable: false, flex: 1, minWidth: 100, align: 'right', headerAlign: 'right',
        renderCell: (params) => (
            <Tooltip title="View Details">
                <IconButton onClick={() => handleOpenModal(params.row)} color="primary" size="small">
                    <VisibilityIcon />
                </IconButton>
            </Tooltip>
        ),
    },
  ];

  return (
    <>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>Reservations</Typography>
        <Typography variant="subtitle1" color="text.secondary">Manage and track all equipment borrowing requests.</Typography>
      </Box>

      <Card sx={{ boxShadow: theme.shadows[2], borderRadius: 2 }}>
        <CardContent sx={{ p: 0 }}>
          <Box sx={{ height: 650, width: '100%' }}>
            <DataGrid
                rows={reservations}
                columns={columns}
                loading={loading}
                getRowId={(row) => row.id}
                sx={{
                    border: 'none',
                    '& .MuiDataGrid-columnHeaders': {
                        backgroundColor: theme.palette.grey[50],
                        color: theme.palette.text.primary,
                        fontSize: '0.9rem',
                        fontWeight: 'bold',
                    },
                    [`& .${gridClasses.row}.even`]: {
                        backgroundColor: theme.palette.grey[50],
                    },
                    '& .MuiDataGrid-cell': {
                        borderBottom: `1px solid ${theme.palette.divider}`,
                    }
                }}
            />
          </Box>
        </CardContent>
      </Card>

      {/* Detail Modal */}
      <Modal open={modalOpen} onClose={handleCloseModal} closeAfterTransition BackdropComponent={Backdrop} BackdropProps={{ timeout: 500 }}>
        <Fade in={modalOpen}>
          <Box sx={modalStyle}>
            {/* Header */}
            <Box sx={{ p: 3, bgcolor: 'primary.main', color: 'white' }}>
                 <Typography variant="h6" fontWeight="bold">Reservation Details</Typography>
            </Box>

            {/* Content */}
            <Box sx={{ p: 4, overflowY: 'auto', flexGrow: 1 }}>
                {selectedReservation && (
                <Grid container spacing={3}>
                    {/* Borrower Info Section */}
                    <Grid item xs={12}>
                        <Typography variant="subtitle2" color="primary" gutterBottom sx={{ textTransform: 'uppercase', letterSpacing: 1, fontWeight: 'bold' }}>Borrower Info</Typography>
                        <Paper variant="outlined" sx={{ p: 2 }}>
                            <Grid container spacing={2}>
                                <Grid item xs={6}>
                                    <Typography variant="caption" color="text.secondary">Name</Typography>
                                    <Typography variant="body2" fontWeight="medium">{selectedReservation.fullName}</Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="caption" color="text.secondary">Phone</Typography>
                                    <Typography variant="body2" fontWeight="medium">{selectedReservation.phoneNumber}</Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="caption" color="text.secondary">Address</Typography>
                                    <Typography variant="body2" fontWeight="medium">{selectedReservation.address}</Typography>
                                </Grid>
                            </Grid>
                        </Paper>
                    </Grid>

                    {/* Request Details Section */}
                    <Grid item xs={12}>
                        <Typography variant="subtitle2" color="primary" gutterBottom sx={{ textTransform: 'uppercase', letterSpacing: 1, fontWeight: 'bold', mt: 2 }}>Request Details</Typography>
                        <Paper variant="outlined" sx={{ p: 2 }}>
                            <Grid container spacing={2}>
                                <Grid item xs={6}>
                                    <Typography variant="caption" color="text.secondary">Pick-up Date</Typography>
                                    <Typography variant="body2" fontWeight="medium">{selectedReservation.reservationDate ? new Date(selectedReservation.reservationDate.seconds * 1000).toLocaleDateString() : 'N/A'}</Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="caption" color="text.secondary">Time Slot</Typography>
                                    <Typography variant="body2" fontWeight="medium" sx={{ textTransform: 'capitalize' }}>{selectedReservation.timeSlot}</Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="caption" color="text.secondary">Reason</Typography>
                                    <Typography variant="body2">{selectedReservation.reason}</Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Divider sx={{ my: 1 }} />
                                    <Typography variant="caption" color="text.secondary" gutterBottom>Items Requested</Typography>
                                    <List dense disablePadding>
                                        {Array.isArray(selectedReservation.items) ? selectedReservation.items.map(item => (
                                            <ListItem key={item.id} disableGutters>
                                                <ListItemText primary={item.name} secondary={`Qty: ${item.quantity}`} />
                                            </ListItem>
                                        )) : <Typography variant="caption">N/A</Typography>}
                                    </List>
                                </Grid>
                            </Grid>
                        </Paper>
                    </Grid>

                    {/* Verification Documents */}
                    <Grid item xs={12}>
                         <Typography variant="subtitle2" color="primary" gutterBottom sx={{ textTransform: 'uppercase', letterSpacing: 1, fontWeight: 'bold', mt: 2 }}>Documents</Typography>
                         <Grid container spacing={2}>
                             <Grid item xs={6}>
                                <Typography variant="caption" display="block" gutterBottom>ID Card</Typography>
                                {selectedReservation.idCardUrl ? 
                                    <Box component="img" src={selectedReservation.idCardUrl} sx={{ width: '100%', borderRadius: 1, border: '1px solid #ddd', maxHeight: 150, objectFit: 'cover' }} /> 
                                    : <Typography variant="caption">Not Provided</Typography>
                                }
                             </Grid>
                             <Grid item xs={6}>
                                <Typography variant="caption" display="block" gutterBottom>Selfie</Typography>
                                {selectedReservation.selfieUrl ? 
                                    <Box component="img" src={selectedReservation.selfieUrl} sx={{ width: '100%', borderRadius: 1, border: '1px solid #ddd', maxHeight: 150, objectFit: 'cover' }} /> 
                                    : <Typography variant="caption">Not Provided</Typography>
                                }
                             </Grid>
                         </Grid>
                    </Grid>
                </Grid>
                )}
            </Box>

            {/* Footer Actions */}
            <Box sx={{ p: 3, bgcolor: 'grey.50', display: 'flex', justifyContent: 'flex-end', gap: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                <Button onClick={handleCloseModal} variant="outlined">Close</Button>
                {selectedReservation && selectedReservation.status === 'pending' && (
                    <>
                        <Button onClick={() => handleStatusUpdate(selectedReservation, 'rejected')} variant="contained" color="error">Reject</Button>
                        <Button onClick={() => handleStatusUpdate(selectedReservation, 'approved')} variant="contained" color="success">Approve</Button>
                    </>
                )}
                {selectedReservation && (selectedReservation.status === 'approved' || selectedReservation.status === 'delivered') && (
                    <Button onClick={handleOpenReturnModal} variant="contained" startIcon={<AssignmentTurnedInIcon />}>
                        Mark Returned
                    </Button>
                )}
            </Box>
          </Box>
        </Fade>
      </Modal>

      {/* Return Inspection Modal */}
      <Modal open={returnModalOpen} onClose={() => setReturnModalOpen(false)} closeAfterTransition BackdropComponent={Backdrop} BackdropProps={{ timeout: 500 }}>
        <Fade in={returnModalOpen}>
            <Box sx={returnModalStyle}>
                <Typography variant="h5" fontWeight="bold" gutterBottom>Return Inspection</Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom sx={{ mb: 3 }}>Check the condition of the returned items.</Typography>
                
                <Paper variant="outlined" sx={{ p: 2, mb: 3, bgcolor: returnIssue.hasIssue ? '#fff5f5' : 'transparent', borderColor: returnIssue.hasIssue ? 'error.light' : 'divider' }}>
                    <FormControlLabel 
                        control={<Switch checked={returnIssue.hasIssue} onChange={(e) => setReturnIssue(p => ({...p, hasIssue: e.target.checked}))} color="error" />} 
                        label={<Typography fontWeight="bold" color={returnIssue.hasIssue ? 'error' : 'text.primary'}>Report Damages or Missing Items</Typography>}
                    />

                    {returnIssue.hasIssue && (
                        <Box sx={{ mt: 2 }}>
                            <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                                <InputLabel>Affected Item</InputLabel>
                                <Select 
                                    value={returnIssue.itemId} 
                                    label="Affected Item"
                                    onChange={(e) => setReturnIssue(p => ({...p, itemId: e.target.value}))}
                                >
                                    {selectedReservation?.items?.map(item => (
                                        <MenuItem key={item.id} value={item.id}>{item.name}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                            <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                                <InputLabel>Issue Type</InputLabel>
                                <Select 
                                    value={returnIssue.type} 
                                    label="Issue Type"
                                    onChange={(e) => setReturnIssue(p => ({...p, type: e.target.value}))}
                                >
                                    <MenuItem value="damaged">Damaged</MenuItem>
                                    <MenuItem value="lost">Lost</MenuItem>
                                </Select>
                            </FormControl>
                            <TextField 
                                fullWidth 
                                multiline 
                                rows={3} 
                                label="Description of Damage/Loss" 
                                size="small" 
                                sx={{ mb: 2 }} 
                                value={returnIssue.description}
                                onChange={(e) => setReturnIssue(p => ({...p, description: e.target.value}))}
                            />
                            <TextField 
                                fullWidth 
                                type="number" 
                                label="Estimated Cost (PHP)" 
                                size="small" 
                                value={returnIssue.cost}
                                onChange={(e) => setReturnIssue(p => ({...p, cost: e.target.value}))}
                            />
                        </Box>
                    )}
                </Paper>

                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                    <Button onClick={() => setReturnModalOpen(false)}>Cancel</Button>
                    <Button variant="contained" color="primary" onClick={handleReturnSubmit}>Confirm Return</Button>
                </Box>
            </Box>
        </Fade>
      </Modal>
    </>
  );
}

export default ManageReservations;
