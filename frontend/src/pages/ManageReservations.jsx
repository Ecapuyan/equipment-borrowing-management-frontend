// src/pages/ManageReservations.jsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  Typography, Box, CircularProgress, Card, CardContent, Chip, Button,
  Modal, Fade, Backdrop, Grid, Divider, List, ListItem, ListItemText, Paper, Link,
  FormControlLabel, Switch, TextField, Select, MenuItem, FormControl, InputLabel
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { db } from '../firebase';
import { collection, getDocs, doc, updateDoc, query, where, addDoc, Timestamp } from 'firebase/firestore';
import { useSnackbar } from '../context/SnackbarContextDef';

const modalStyle = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: { xs: '90%', sm: 500 }, // Narrower for single column
  bgcolor: 'background.paper',
  boxShadow: 24,
  p: 4,
  borderRadius: 2,
  maxHeight: '90vh',
  overflowY: 'auto'
};

const returnModalStyle = {
  ...modalStyle,
  width: { xs: '90%', sm: 600 },
};

function ManageReservations() {
  const [reservations, setReservations] = useState([]);
  const [equipments, setEquipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showSnackbar } = useSnackbar();
  
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
      handleCloseModal(); // Close the main details modal too

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
    { field: 'fullName', headerName: 'Resident Name', flex: 1.5 },
    { field: 'reason', headerName: 'Reason', flex: 2 },
    {
      field: 'items',
      headerName: 'Equipments',
      flex: 1,
      renderCell: (params) => {
        const itemCount = Array.isArray(params.row.items) ? params.row.items.reduce((sum, item) => sum + item.quantity, 0) : 0;
        return `${itemCount} Equipment${itemCount !== 1 ? 's' : ''}`;
      },
    },
    {
      field: 'reservationDate', headerName: 'Date', flex: 1,
      renderCell: (params) => (params.value ? new Date(params.value.seconds * 1000).toLocaleDateString() : 'N/A'),
    },
    {
      field: 'status', headerName: 'Status', flex: 1,
      renderCell: (params) => {
        const status = params.value;
        let color = 'default';
        if (status === 'pending') color = 'warning';
        if (status === 'approved') color = 'success';
        if (status === 'rejected' || status === 'cancelled' || status === 'returned') color = 'error';
        return <Chip label={status} color={color} variant="outlined" size="small" sx={{textTransform: 'capitalize'}}/>;
      },
    },
    {
        field: 'actions', headerName: 'Actions', sortable: false, flex: 1,
        renderCell: (params) => (<Button onClick={() => handleOpenModal(params.row)} size="small">View Details</Button>),
    },
  ];

  return (
    <>
      <Card>
        <CardContent>
          <Typography variant="h5" gutterBottom>Manage All Reservations</Typography>
          <Box sx={{ height: 650, width: '100%', '& .capitalize': { textTransform: 'capitalize' } }}>
            <DataGrid rows={reservations} columns={columns} loading={loading} getRowId={(row) => row.id} />
          </Box>
        </CardContent>
      </Card>

      {/* Detail Modal */}
      <Modal open={modalOpen} onClose={handleCloseModal} closeAfterTransition BackdropComponent={Backdrop} BackdropProps={{ timeout: 500 }}>
        <Fade in={modalOpen}>
          <Box sx={modalStyle}>
            <Typography variant="h5" component="h2" gutterBottom sx={{ textAlign: 'center' }}>Reservation Details</Typography>
            {selectedReservation && (
              <Box>
                <Divider sx={{ my: 2 }}><Chip label="Borrower Information" /></Divider>
                <Typography><strong>Name:</strong> {selectedReservation.fullName}</Typography>
                <Typography sx={{mt:1}}><strong>Phone:</strong> {selectedReservation.phoneNumber}</Typography>
                <Typography sx={{mt:1}}><strong>Address:</strong> {selectedReservation.address}</Typography>
                <Typography sx={{mt:1}}><strong>Request Date:</strong> {selectedReservation.requestDate ? new Date(selectedReservation.requestDate.seconds * 1000).toLocaleDateString() : 'N/A'}</Typography>
                
                <Divider sx={{ my: 2 }}><Chip label="Request Details" /></Divider>
                <Typography><strong>Pick-up Date:</strong> {selectedReservation.reservationDate ? new Date(selectedReservation.reservationDate.seconds * 1000).toLocaleDateString() : 'N/A'}</Typography>
                <Typography sx={{mt:1}}><strong>Time Slot:</strong> <Chip component="span" label={selectedReservation.timeSlot} size="small" sx={{textTransform: 'capitalize'}}/></Typography>
                <Typography sx={{mt:1}}><strong>Reason:</strong> {selectedReservation.reason}</Typography>
                <Typography sx={{mt:1}}><strong>Items Requested:</strong></Typography>
                <Paper variant="outlined" sx={{ p: 1, mt: 0.5 }}><List dense>{Array.isArray(selectedReservation.items) ? selectedReservation.items.map(item => (<ListItem key={item.id}><ListItemText primary={item.name} secondary={`Quantity: ${item.quantity}`}/></ListItem>)) : <ListItem><ListItemText primary="N/A" /></ListItem>}</List></Paper>

                <Divider sx={{ my: 2 }}><Chip label="Verification Documents" /></Divider>
                <Typography variant="subtitle1" gutterBottom>ID Card</Typography>
                {selectedReservation.idCardUrl ? <Box component="img" src={selectedReservation.idCardUrl} sx={{width: '100%', maxWidth: 300, height: 'auto', borderRadius: 1, border: '1px solid #ddd'}}/> : <Typography>Not Provided</Typography>}
                <Typography variant="subtitle1" gutterBottom sx={{mt:2}}>Selfie with ID</Typography>
                {selectedReservation.selfieUrl ? <Box component="img" src={selectedReservation.selfieUrl} sx={{width: '100%', maxWidth: 300, height: 'auto', borderRadius: 1, border: '1px solid #ddd'}}/> : <Typography>Not Provided</Typography>}

                <Divider sx={{ my: 2 }}><Chip label="Actions" /></Divider>
                <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 1 }}>
                  {selectedReservation.status === 'pending' && (
                    <>
                      <Button onClick={() => handleStatusUpdate(selectedReservation, 'approved')} variant="contained" color="success">Approve Request</Button>
                      <Button onClick={() => handleStatusUpdate(selectedReservation, 'rejected')} variant="contained" color="error">Reject Request</Button>
                    </>
                  )}
                  {selectedReservation.status === 'approved' && (<Button onClick={handleOpenReturnModal} variant="contained">Mark as Returned</Button>)}
                </Box>
              </Box>
            )}
          </Box>
        </Fade>
      </Modal>

      {/* Return Inspection Modal */}
      <Modal open={returnModalOpen} onClose={() => setReturnModalOpen(false)} closeAfterTransition BackdropComponent={Backdrop} BackdropProps={{ timeout: 500 }}>
        <Fade in={returnModalOpen}>
            <Box sx={returnModalStyle}>
                <Typography variant="h5" gutterBottom>Return Inspection</Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>Check the condition of the returned items.</Typography>
                
                <FormControlLabel 
                    control={<Switch checked={returnIssue.hasIssue} onChange={(e) => setReturnIssue(p => ({...p, hasIssue: e.target.checked}))} />} 
                    label="Report Damages or Missing Items" 
                />

                {returnIssue.hasIssue && (
                    <Box sx={{ mt: 2, p: 2, bgcolor: '#fff0f0', borderRadius: 1 }}>
                        <Typography variant="subtitle2" color="error" gutterBottom>Incident Details</Typography>
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

                <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
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
