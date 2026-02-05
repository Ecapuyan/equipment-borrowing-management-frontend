// src/pages/MyReservations.jsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  Typography, Box, CircularProgress, Button, Card, CardContent, Chip, Grid,
  Modal, Fade, Backdrop, List, ListItem, ListItemText, Paper, CardActions, Divider
} from '@mui/material';
import EventIcon from '@mui/icons-material/Event';
import ListAltIcon from '@mui/icons-material/ListAlt';
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
  maxHeight: '90vh', // Limit height to 90% of viewport height
  overflowY: 'auto', // Enable vertical scrolling
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
            <Grid item sx={{ xs: 12, md: 6, lg: 4 }} key={res.id}>
              <Card elevation={2} sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                <CardContent sx={{ flexGrow: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="subtitle2" color="text.secondary">
                            {res.requestDate?.toDate().toLocaleDateString()}
                        </Typography>
                        {renderStatusChip(res.status)}
                    </Box>
                    <Typography variant="h6" component="div" gutterBottom>
                        {res.items?.length} Items for {res.reservationDate?.toDate().toLocaleDateString()}
                    </Typography>
                    <Divider sx={{ my: 2 }} />
                    <Box sx={{ display: 'flex', alignItems: 'center', color: 'text.secondary', mb: 1 }}>
                        <EventIcon fontSize="small" sx={{ mr: 1 }} />
                        <Typography variant="body2" sx={{textTransform: 'capitalize'}}>
                            Pick-up at <strong>{res.timeSlot}</strong> slot
                        </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', color: 'text.secondary' }}>
                        <ListAltIcon fontSize="small" sx={{ mr: 1 }} />
                        <Typography variant="body2" noWrap>
                            {res.items?.map(i => i.name).join(', ')}
                        </Typography>
                    </Box>
                </CardContent>
                <CardActions sx={{ justifyContent: 'flex-end', p: 2, bgcolor: 'grey.50' }}>
                    <Button size="small" variant="outlined" onClick={() => handleOpenModal(res)}>View Details</Button>
                    {res.status === 'pending' && (
                        <Button size="small" variant="contained" color="error" onClick={() => handleCancelReservation(res.id)}>Cancel</Button>
                    )}
                </CardActions>
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
                <Typography variant="h5" component="h2" gutterBottom>Reservation Details</Typography>
                <Grid container spacing={2}>
                    <Grid item sx={{ xs: 12 }}>
                        <Paper variant="outlined" sx={{ p: 2 }}>
                            <Typography variant="h6" sx={{ mb: 1 }}>Request Summary</Typography>
                            <Divider sx={{ mb: 2 }} />
                            <Grid container spacing={1}>
                                <Grid item sx={{ xs: 12, sm: 6 }}><ListItemText primaryTypographyProps={{fontWeight: 'bold', color: 'text.secondary'}} primary="Status" secondary={renderStatusChip(selectedReservation.status)} /></Grid>
                                <Grid item sx={{ xs: 12, sm: 6 }}><ListItemText primaryTypographyProps={{fontWeight: 'bold', color: 'text.secondary'}} primary="Request Date" secondary={selectedReservation.requestDate?.toDate().toLocaleDateString()} /></Grid>
                                <Grid item sx={{ xs: 12, sm: 6 }}><ListItemText primaryTypographyProps={{fontWeight: 'bold', color: 'text.secondary'}} primary="Pick-up Date" secondary={selectedReservation.reservationDate?.toDate().toLocaleDateString()} /></Grid>
                                <Grid item sx={{ xs: 12, sm: 6 }}><ListItemText primaryTypographyProps={{fontWeight: 'bold', color: 'text.secondary'}} primary="Time Slot" secondary={selectedReservation.timeSlot} /></Grid>
                            </Grid>
                        </Paper>
                    </Grid>
                    <Grid item sx={{ xs: 12, md: 6 }}>
                        <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
                            <Typography variant="h6" sx={{ mb: 1 }}>Borrower Information</Typography>
                            <Divider sx={{ mb: 2 }} />
                            <ListItemText primaryTypographyProps={{fontWeight: 'bold', color: 'text.secondary'}} primary="Full Name" secondary={selectedReservation.fullName || 'N/A'} />
                            <ListItemText primaryTypographyProps={{fontWeight: 'bold', color: 'text.secondary'}} sx={{mt: 1}} primary="Address" secondary={selectedReservation.address || 'N/A'} />
                            <ListItemText primaryTypographyProps={{fontWeight: 'bold', color: 'text.secondary'}} sx={{mt: 1}} primary="Phone Number" secondary={selectedReservation.phoneNumber || 'N/A'} />
                        </Paper>
                    </Grid>
                    <Grid item sx={{ xs: 12, md: 6 }}>
                        <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
                            <Typography variant="h6" sx={{ mb: 1 }}>Requested Items</Typography>
                            <Divider sx={{ mb: 2 }} />
                            <List dense>
                                {selectedReservation.items?.map(i => <ListItem key={i.id}><ListItemText primary={i.name} secondary={`Quantity: ${i.quantity}`} /></ListItem>)}
                            </List>
                        </Paper>
                    </Grid>
                    <Grid item sx={{ xs: 12 }}>
                        <Paper variant="outlined" sx={{ p: 2 }}>
                            <Typography variant="h6" sx={{ mb: 1 }}>Reason for Borrowing</Typography>
                            <Divider sx={{ mb: 2 }} />
                            <Typography variant="body2">{selectedReservation.reason || 'No reason provided.'}</Typography>
                        </Paper>
                    </Grid>
                    <Grid item sx={{ xs: 12 }}>
                        <Paper variant="outlined" sx={{ p: 2 }}>
                            <Typography variant="h6" sx={{ mb: 1 }}>Verification Documents</Typography>
                            <Divider sx={{ mb: 2 }} />
                            <Grid container spacing={2}>
                                {selectedReservation.idCardUrl && (
                                    <Grid item sx={{ xs: 12, sm: 6 }}>
                                        <Typography variant="subtitle2" gutterBottom>ID Card</Typography>
                                        <Box component="img" src={selectedReservation.idCardUrl} alt="ID Card" sx={{ maxWidth: '100%', height: 'auto', borderRadius: 1 }} />
                                    </Grid>
                                )}
                                {selectedReservation.selfieUrl && (
                                    <Grid item sx={{ xs: 12, sm: 6 }}>
                                        <Typography variant="subtitle2" gutterBottom>Selfie with ID</Typography>
                                        <Box component="img" src={selectedReservation.selfieUrl} alt="Selfie with ID" sx={{ maxWidth: '100%', height: 'auto', borderRadius: 1 }} />
                                    </Grid>
                                )}
                            </Grid>
                            {!selectedReservation.idCardUrl && !selectedReservation.selfieUrl && (
                                <Typography variant="body2" color="text.secondary">No verification documents uploaded.</Typography>
                            )}
                        </Paper>
                    </Grid>
                    {selectedReservation.adminNotes && (
                        <Grid item sx={{ xs: 12 }}>
                            <Paper variant="outlined" sx={{ p: 2, borderColor: 'warning.main' }}>
                                <Typography variant="h6" sx={{ mb: 1, color: 'warning.dark' }}>Admin Notes</Typography>
                                <Divider sx={{ mb: 2 }} />
                                <Typography variant="body2">{selectedReservation.adminNotes}</Typography>
                            </Paper>
                        </Grid>
                    )}
                </Grid>
                <Box sx={{display: 'flex', justifyContent: 'flex-end'}}>
                  <Button onClick={handleCloseModal} sx={{ mt: 3 }} variant="contained">Close</Button>
                </Box>
              </>
            )}
          </Box>
        </Fade>
      </Modal>
    </>
  );
}

export default MyReservations;
