// src/pages/ManageReservations.jsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  Typography, Box, CircularProgress, Card, CardContent, Chip, Button,
  Modal, Fade, Backdrop, Grid, Divider, List, ListItem, ListItemText, Paper, Link
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { db } from '../firebase';
import { collection, getDocs, doc, updateDoc, query, where } from 'firebase/firestore';
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

function ManageReservations() {
  const [reservations, setReservations] = useState([]);
  const [equipments, setEquipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showSnackbar } = useSnackbar();
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState(null);

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
                  {selectedReservation.status === 'approved' && (<Button onClick={() => handleStatusUpdate(selectedReservation, 'returned')} variant="contained">Mark as Returned</Button>)}
                </Box>
              </Box>
            )}
          </Box>
        </Fade>
      </Modal>
    </>
  );
}

export default ManageReservations;
