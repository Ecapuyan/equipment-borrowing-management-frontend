// src/pages/MyReservations.jsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  Typography, Box, CircularProgress, Button, Card, CardContent, Chip, Grid,
  Modal, Fade, Backdrop, List, ListItem, ListItemText, Paper
} from '@mui/material';
import { db } from '../firebase';
import { collection, query, where, getDocs, doc, deleteDoc } from 'firebase/firestore';
import { useAuth } from '../context/AuthContextDef';
import { useSnackbar } from '../context/SnackbarContextDef';

const modalStyle = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: { xs: '90%', sm: '80%', md: 600 },
  bgcolor: 'background.paper',
  boxShadow: 24,
  p: 4,
  borderRadius: 2,
};

function MyReservations() {
  const { currentUser } = useAuth();
  const { showSnackbar } = useSnackbar();
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const fetchReservations = useCallback(async () => {
    if (!currentUser) { setLoading(false); return; }
    setLoading(true);
    try {
      const q = query(collection(db, 'reservations'), where('userId', '==', currentUser.uid));
      const querySnapshot = await getDocs(q);
      const fetchedReservations = querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
      setReservations(fetchedReservations);
    } catch (err) {
      console.error("Error fetching reservations:", err);
      showSnackbar("Failed to load your reservations.", 'error');
    } finally { setLoading(false); }
  }, [currentUser, showSnackbar]);

  useEffect(() => {
    fetchReservations();
  }, [fetchReservations]);

  const handleCancelReservation = async (reservationId) => {
    if (!window.confirm("Are you sure you want to cancel this reservation?")) return;
    try {
      await deleteDoc(doc(db, 'reservations', reservationId));
      showSnackbar('Reservation cancelled successfully!', 'success');
      fetchReservations(); // Refresh the list
    } catch (err) {
      console.error("Error cancelling reservation:", err);
      showSnackbar("Failed to cancel reservation.", 'error');
    }
  };

  const handleOpenModal = (reservation) => {
    setSelectedReservation(reservation);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedReservation(null);
  };

  const renderStatusChip = (status) => {
    let color = 'default';
    if (status === 'pending') color = 'warning';
    if (status === 'approved') color = 'success';
    if (status === 'rejected') color = 'error';
    if (status === 'completed' || status === 'delivered') color = 'info';
    if (status === 'cancelled' || status === 'returned') color = 'default';
    return <Chip label={status} color={color} variant="outlined" sx={{ textTransform: 'capitalize' }} />;
  };
  
  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>;
  if (!currentUser) return <Typography variant="h5" color="error" align="center" sx={{ mt: 4 }}>Please log in to view your reservations.</Typography>;

  return (
    <>
      <Typography variant="h4" component="h1" gutterBottom>My Reservations</Typography>
      {reservations.length === 0 ? (
        <Paper elevation={1} sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h6">No reservations found.</Typography>
          <Typography>You have not made any equipment requests yet.</Typography>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {reservations.map(res => (
            <Grid item xs={12} md={6} lg={4} key={res.id}>
              <Card elevation={2}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Typography variant="h6" component="div" gutterBottom>
                      Request on {res.requestDate?.toDate().toLocaleDateString()}
                    </Typography>
                    {renderStatusChip(res.status)}
                  </Box>
                  <Typography color="text.secondary" sx={{ mb: 1.5 }}>
                    For pick-up on: <strong>{res.reservationDate?.toDate().toLocaleDateString()}</strong>
                  </Typography>
                  <List dense>
                    {res.items?.slice(0, 3).map(item => (
                      <ListItemText key={item.id} primary={`${item.name} (x${item.quantity})`} />
                    ))}
                    {res.items?.length > 3 && <ListItemText primary="..." />}
                  </List>
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                    <Button size="small" onClick={() => handleOpenModal(res)}>View Details</Button>
                    {res.status === 'pending' && res.reservationDate && (res.reservationDate.toDate().getTime() - Date.now()) / (1000 * 60 * 60 * 24) > 7 && (
                      <Button size="small" color="error" onClick={() => handleCancelReservation(res.id)}>Cancel</Button>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <Modal open={modalOpen} onClose={handleCloseModal} closeAfterTransition BackdropComponent={Backdrop} BackdropProps={{ timeout: 500 }}>
        <Fade in={modalOpen}>
          <Box sx={modalStyle}>
            {selectedReservation && (
              <>
                <Typography variant="h5" component="h2">Reservation Details</Typography>
                {renderStatusChip(selectedReservation.status)}
                <List sx={{ mt: 2 }}>
                  <ListItem><ListItemText primary="Requestor" secondary={selectedReservation.fullName} /></ListItem>
                  <ListItem><ListItemText primary="Pick-up Date" secondary={selectedReservation.reservationDate?.toDate().toLocaleString()} /></ListItem>
                  <ListItem><ListItemText primary="Time Slot" secondary={selectedReservation.timeSlot} /></ListItem>
                  <ListItem><ListItemText primary="Reason" secondary={selectedReservation.reason} /></ListItem>
                  <ListItem>
                    <ListItemText 
                      primary="Items" 
                      secondary={
                        <ul style={{ paddingLeft: 20, margin: 0 }}>
                          {selectedReservation.items?.map(i => <li key={i.id}>{`${i.name} (x${i.quantity})`}</li>)}
                        </ul>
                      } 
                    />
                  </ListItem>
                  {selectedReservation.adminNotes && <ListItem><ListItemText primary="Admin Notes" secondary={selectedReservation.adminNotes}/></ListItem>}
                </List>
                <Button onClick={handleCloseModal} sx={{ mt: 2 }}>Close</Button>
              </>
            )}
          </Box>
        </Fade>
      </Modal>
    </>
  );
}

export default MyReservations;
