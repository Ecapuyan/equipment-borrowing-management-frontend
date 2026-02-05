// src/pages/ManageReservations.jsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  Typography, Box, CircularProgress, Card, CardContent, Chip, Button,
  Modal, Fade, Backdrop, Grid, Divider, List, ListItem, ListItemText, Paper, Link,
  FormControlLabel, Switch, TextField, Select, MenuItem, FormControl, InputLabel,
  useTheme, IconButton, Tooltip, InputAdornment, Tabs, Tab, Badge,
  Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle
} from '@mui/material';
import { DataGrid, gridClasses } from '@mui/x-data-grid';
import { db } from '../firebase';
import { collection, getDocs, doc, updateDoc, query, where, addDoc, Timestamp } from 'firebase/firestore';
import { useSnackbar } from '../context/SnackbarContextDef';
import VisibilityIcon from '@mui/icons-material/Visibility';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import SearchIcon from '@mui/icons-material/Search';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PhoneIcon from '@mui/icons-material/Phone';
import PersonIcon from '@mui/icons-material/Person';
import ContactPageIcon from '@mui/icons-material/ContactPage';
import AccessTimeIcon from '@mui/icons-material/AccessTime'; // New Import

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
  const { showSnackbar }
        = useSnackbar();
  const theme = useTheme();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('pending');
  const [zoomedImage, setZoomedImage] = useState(null);
  
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState(null);

  const [returnModalOpen, setReturnModalOpen] = useState(false);
  const [returnIssue, setReturnIssue] = useState({ hasIssue: false, itemId: '', type: 'damaged', description: '', cost: '' });

  const [outstandingDialog, setOutstandingDialog] = useState({ isOpen: false, reservation: null, newStatus: null });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const reservationsSnapshot = await getDocs(collection(db, 'reservations'));
      const reservationData = reservationsSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
      reservationData.sort((a, b) => (b.requestDate?.seconds || 0) - (a.requestDate?.seconds || 0));
      setReservations(reservationData);

      const equipmentSnapshot = await getDocs(collection(db, 'equipments'));
      const equipmentData = equipmentSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
      setEquipments(equipmentData);

    } catch (err) { showSnackbar("Failed to load reservation data.", "error"); } 
    finally { setLoading(false); }
  }, [showSnackbar]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const getDeliveryTime = (reservationDate, timeSlot) => {
    if (!reservationDate || !timeSlot) return null;
    const date = reservationDate.toDate(); // Convert Firebase Timestamp to Date object
    if (timeSlot === 'morning' || timeSlot === 'fullday') {
      date.setHours(7, 0, 0, 0); // 7 AM
    } else if (timeSlot === 'afternoon') {
      date.setHours(15, 0, 0, 0); // 3 PM
    }
    return date;
  };

  const counts = {
    pending: reservations.filter(r => r.status === 'pending').length,
    approved: reservations.filter(r => r.status === 'approved').length,
    delivered: reservations.filter(r => r.status === 'delivered').length,
  };

  const filteredReservations = reservations.filter(res => {
    const search = searchTerm.toLowerCase();
    const matchesSearch = searchTerm === '' ||
        (res.fullName && res.fullName.toLowerCase().includes(search)) ||
        (res.status && res.status.toLowerCase().includes(search)) ||
        (res.id && res.id.toLowerCase().includes(search));
    
    if (!matchesSearch) return false;
    if (statusFilter === 'all') return true;
    if (statusFilter === 'returned') return ['returned', 'completed'].includes(res.status);
    if (statusFilter === 'issues') return res.hasIncident === true;
    
    return res.status === statusFilter;
  });

  const handleOpenModal = (reservation) => { setSelectedReservation(reservation); setModalOpen(true); };
  const handleCloseModal = () => { setModalOpen(false); setSelectedReservation(null); };
  const handleOpenReturnModal = () => { setReturnIssue({ hasIssue: false, itemId: '', type: 'damaged', description: '', cost: '' }); setReturnModalOpen(true); };

  const handleReturnSubmit = async () => {
    if (!selectedReservation) return;
  
    setLoading(true);
    try {
      const reservationRef = doc(db, 'reservations', selectedReservation.id);
      let newStatus = 'returned';
  
      // If there's an issue, create an incident report
      if (returnIssue.hasIssue) {
        if (!returnIssue.itemId || !returnIssue.description || !returnIssue.cost) {
          showSnackbar("Please fill all fields for the incident report.", "error");
          setLoading(false);
          return;
        }

        newStatus = 'completed'; // Or a more specific status like 'returned_with_issue'
        await addDoc(collection(db, 'incidents'), {
          reservationId: selectedReservation.id,
          userId: selectedReservation.userId,
          fullName: selectedReservation.fullName,
          item: {
            id: returnIssue.itemId,
            name: selectedReservation.items.find(i => i.id === returnIssue.itemId)?.name,
          },
          type: returnIssue.type,
          description: returnIssue.description,
          cost: parseFloat(returnIssue.cost),
          status: 'pending_payment',
          reportedAt: Timestamp.now(),
        });

        // Mark the reservation as having an incident
        await updateDoc(reservationRef, { hasIncident: true });
        showSnackbar('Incident report created successfully.', 'info');
      }
  
      // Update the reservation status
      await updateDoc(reservationRef, { status: newStatus });
  
      // We are not updating stock here assuming totalStock is the overall count
      // and availability is managed by checking reservations.
      // If stock count needs to be dynamically changed, logic would be added here.
  
      showSnackbar(`Reservation marked as ${newStatus}.`, 'success');
      fetchData(); // Refresh data
      setReturnModalOpen(false); // Close return modal
      handleCloseModal(); // Close main details modal
  
    } catch (err) {
      console.error("Error processing return: ", err);
      showSnackbar('Failed to process the return.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const proceedWithStatusUpdate = async (reservation, newStatus) => {
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
      showSnackbar("Failed to update reservation status.", 'error');
    }
  };
  
  const handleStatusUpdate = async (reservation, newStatus) => {
    if (newStatus !== 'delivered') {
        await proceedWithStatusUpdate(reservation, newStatus);
        return;
    }

    try {
        const q = query(
            collection(db, 'reservations'),
            where('userId', '==', reservation.userId),
            where('status', '==', 'delivered')
        );
        const snapshot = await getDocs(q);
        
        if (!snapshot.empty) {
            setOutstandingDialog({ isOpen: true, reservation, newStatus });
        } else {
            await proceedWithStatusUpdate(reservation, newStatus);
        }
    } catch (err) {
        showSnackbar("Failed to check for outstanding reservations.", "error");
    }
  };
  
  const columns = [
    { field: 'fullName', headerName: 'Resident Name', flex: 1.5, minWidth: 150 },
    { field: 'reason', headerName: 'Reason', flex: 2, minWidth: 200 },
    {
      field: 'items', headerName: 'Equipments', flex: 1, minWidth: 150,
      renderCell: (params) => {
        const itemCount = Array.isArray(params.row.items) ? params.row.items.reduce((sum, item) => sum + item.quantity, 0) : 0;
        return <Chip label={`${itemCount} Item${itemCount !== 1 ? 's' : ''}`} size="small" variant="outlined" />;
      },
    },
    { field: 'reservationDate', headerName: 'Date', flex: 1, minWidth: 120, renderCell: (params) => (params.value ? new Date(params.value.seconds * 1000).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A') },
    {
        field: 'deliveryTime',
        headerName: 'Delivery Time',
        flex: 1,
        minWidth: 150,
        renderCell: (params) => {
          if (params.row.status === 'approved' || params.row.status === 'pending') {
              const deliveryTime = getDeliveryTime(params.row.reservationDate, params.row.timeSlot);
              return deliveryTime ? (
                  <Box>
                      <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>{params.row.timeSlot}</Typography>
                      <Typography variant="caption" color="text.secondary">{deliveryTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Typography>
                  </Box>
              ) : 'N/A';
          }
          return 'N/A';
        },
      },
    { field: 'status', headerName: 'Status', flex: 1, minWidth: 120,
      renderCell: (params) => {
        const status = params.value;
        let color = 'default';
        if (status === 'pending') color = 'warning';
        if (status === 'approved') color = 'success';
        if (status === 'delivered') color = 'info';
        if (status === 'rejected' || status === 'cancelled') color = 'error';
        return <Chip label={status} color={color} size="small" sx={{ textTransform: 'capitalize', fontWeight: 'bold' }} />;
      },
    },
    { field: 'actions', headerName: 'Actions', sortable: false, flex: 1, minWidth: 150, align: 'right', headerAlign: 'right',
        renderCell: (params) => (
            <Button onClick={() => handleOpenModal(params.row)} color="primary" size="small" startIcon={<VisibilityIcon />} variant="outlined" sx={{ textTransform: 'none' }}>View Details</Button>
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
          <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 2, pt: 2, bgcolor: 'grey.50' }}>
            <Tabs value={statusFilter} onChange={(e, v) => setStatusFilter(v)} variant="scrollable" scrollButtons="auto">
                <Tab label={<Badge badgeContent={counts.pending} color="error" sx={{ pr: 2 }}>Request for Approval</Badge>} value="pending" />
                <Tab label={<Badge badgeContent={counts.approved} color="success" sx={{ pr: 2 }}>Approved</Badge>} value="approved" />
                <Tab label={<Badge badgeContent={counts.delivered} color="info" sx={{ pr: 2 }}>Delivered (To Return)</Badge>} value="delivered" />
                <Tab label="Returned" value="returned" />
                <Tab label="With Issues" value="issues" />
            </Tabs>
          </Box>
          <Box sx={{ p: 2 }}>
            <TextField fullWidth variant="outlined" size="small" placeholder="Search by name, status, or ID..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} sx={{ mb: 2 }} InputProps={{ startAdornment: (<InputAdornment position="start"><SearchIcon color="action" /></InputAdornment>), }} />
            <Box sx={{ height: 650, width: '100%' }}>
                <DataGrid rows={filteredReservations} columns={columns} loading={loading} getRowId={(row) => row.id} disableSelectionOnClick sx={{ border: 'none' }} />
            </Box>
          </Box>
        </CardContent>
      </Card>
      <Modal open={modalOpen} onClose={handleCloseModal} closeAfterTransition BackdropComponent={Backdrop} BackdropProps={{ timeout: 500 }} disableRestoreFocus>
        <Fade in={modalOpen}>
          <Box sx={modalStyle}>
            <Box sx={{ p: 3, bgcolor: 'primary.main', color: 'white' }}>
                 <Typography variant="h6" fontWeight="bold">Reservation Details</Typography>
            </Box>
            <Box sx={{ p: 3, overflowY: 'auto', flexGrow: 1 }}>
                {selectedReservation && (
                <Box sx={{ p: 3 }}>
                    {/* Header Summary */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                        <Box>
                            <Typography variant="h5" fontWeight="bold" color="primary.main">
                                Reservation #{selectedReservation.id.slice(0, 6).toUpperCase()}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                Requested on {selectedReservation.requestDate?.toDate().toLocaleString()}
                            </Typography>
                        </Box>
                        <Chip 
                            label={selectedReservation.status} 
                            color={
                                selectedReservation.status === 'approved' ? 'success' : 
                                selectedReservation.status === 'pending' ? 'warning' : 
                                selectedReservation.status === 'delivered' ? 'info' : 
                                selectedReservation.status === 'returned' ? 'default' : 'error'
                            }
                            sx={{ fontWeight: 'bold', textTransform: 'capitalize', fontSize: '0.9rem', height: 32 }}
                        />
                    </Box>

                    <Grid container spacing={3}>
                        {/* Left Column: Borrower Profile */}
                        <Grid item xs={12} md={5}>
                            <Card sx={{ height: '100%', borderRadius: 2, boxShadow: 1 }}>
                                <CardContent sx={{ p: 3 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                                        <Box sx={{ bgcolor: 'primary.light', p: 1.5, borderRadius: '50%', color: 'white' }}>
                                            <PersonIcon fontSize="large" />
                                        </Box>
                                        <Box>
                                            <Typography variant="subtitle1" fontWeight="bold">{selectedReservation.fullName}</Typography>
                                            <Typography variant="body2" color="text.secondary">Resident</Typography>
                                        </Box>
                                    </Box>
                                    
                                    <Divider sx={{ mb: 3 }} />

                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                                        <Box sx={{ display: 'flex', gap: 2 }}>
                                            <PhoneIcon color="action" fontSize="small" sx={{ mt: 0.3 }} />
                                            <Box>
                                                <Typography variant="caption" color="text.secondary" fontWeight="bold">PHONE</Typography>
                                                <Typography variant="body2">{selectedReservation.phoneNumber}</Typography>
                                            </Box>
                                        </Box>
                                        <Box sx={{ display: 'flex', gap: 2 }}>
                                            <LocationOnIcon color="action" fontSize="small" sx={{ mt: 0.3 }} />
                                            <Box>
                                                <Typography variant="caption" color="text.secondary" fontWeight="bold">ADDRESS</Typography>
                                                <Typography variant="body2">{selectedReservation.address}</Typography>
                                            </Box>
                                        </Box>
                                    </Box>

                                    <Divider sx={{ my: 3 }} />
                                    
                                    <Typography variant="subtitle2" fontWeight="bold" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <ContactPageIcon fontSize="small" /> Verification
                                    </Typography>
                                    <Grid container spacing={1} sx={{ mt: 0.5 }}>
                                        <Grid item xs={6}>
                                            <Typography variant="caption" display="block" gutterBottom align="center">ID Card</Typography>
                                            <Box 
                                                onClick={() => selectedReservation.idCardUrl && setZoomedImage(selectedReservation.idCardUrl)}
                                                sx={{ 
                                                    width: '100%', 
                                                    height: 140, 
                                                    borderRadius: 2, 
                                                    bgcolor: 'grey.100', 
                                                    border: '1px solid #eee',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    color: 'text.disabled',
                                                    fontSize: '0.75rem',
                                                    overflow: 'hidden',
                                                    cursor: selectedReservation.idCardUrl ? 'pointer' : 'default',
                                                    transition: 'all 0.2s',
                                                    '&:hover': selectedReservation.idCardUrl ? {
                                                        transform: 'scale(1.02)',
                                                        boxShadow: 2
                                                    } : {}
                                                }}
                                            >
                                                {selectedReservation.idCardUrl ? (
                                                    <Box component="img" src={selectedReservation.idCardUrl} sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                ) : (
                                                    "No Image"
                                                )}
                                            </Box>
                                        </Grid>
                                        <Grid item xs={6}>
                                            <Typography variant="caption" display="block" gutterBottom align="center">Selfie</Typography>
                                            <Box 
                                                onClick={() => selectedReservation.selfieUrl && setZoomedImage(selectedReservation.selfieUrl)}
                                                sx={{ 
                                                    width: '100%', 
                                                    height: 140, 
                                                    borderRadius: 2, 
                                                    bgcolor: 'grey.100', 
                                                    border: '1px solid #eee',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    color: 'text.disabled',
                                                    fontSize: '0.75rem',
                                                    overflow: 'hidden',
                                                    cursor: selectedReservation.selfieUrl ? 'pointer' : 'default',
                                                    transition: 'all 0.2s',
                                                    '&:hover': selectedReservation.selfieUrl ? {
                                                        transform: 'scale(1.02)',
                                                        boxShadow: 2
                                                    } : {}
                                                }}
                                            >
                                                {selectedReservation.selfieUrl ? (
                                                    <Box component="img" src={selectedReservation.selfieUrl} sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                ) : (
                                                    "No Image"
                                                )}
                                            </Box>
                                        </Grid>
                                    </Grid>
                                </CardContent>
                            </Card>
                        </Grid>

                        {/* Right Column: Request Specifics */}
                        <Grid item xs={12} md={7}>
                            <Card sx={{ height: '100%', borderRadius: 2, boxShadow: 1 }}>
                                <CardContent sx={{ p: 3 }}>
                                    <Typography variant="h6" fontWeight="bold" gutterBottom>Request Details</Typography>
                                    
                                    <Box sx={{ bgcolor: 'primary.50', p: 2, borderRadius: 2, display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                                        <CalendarTodayIcon color="primary" />
                                        <Box>
                                            <Typography variant="subtitle2" fontWeight="bold" color="primary.main">
                                                {selectedReservation.reservationDate ? new Date(selectedReservation.reservationDate.seconds * 1000).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }) : 'N/A'}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'capitalize' }}>
                                                Time Slot: {selectedReservation.timeSlot}
                                            </Typography>
                                        </Box>
                                    </Box>

                                    <Typography variant="caption" fontWeight="bold" color="text.secondary" gutterBottom display="block">REASON FOR BORROWING</Typography>
                                    <Typography variant="body2" sx={{ mb: 3, fontStyle: 'italic', bgcolor: 'grey.50', p: 1.5, borderRadius: 1, borderLeft: '3px solid #ccc' }}>
                                        "{selectedReservation.reason}"
                                    </Typography>

                                    <Typography variant="caption" fontWeight="bold" color="text.secondary" gutterBottom display="block">ITEMS REQUESTED</Typography>
                                    <List disablePadding sx={{ border: '1px solid #eee', borderRadius: 1 }}>
                                        {Array.isArray(selectedReservation.items) ? selectedReservation.items.map((item, index) => (
                                            <ListItem key={item.id} divider={index < selectedReservation.items.length - 1} sx={{ py: 1 }}>
                                                <ListItemText 
                                                    primary={<Typography variant="body2" fontWeight="medium">{item.name}</Typography>} 
                                                />
                                                <Chip label={`x${item.quantity}`} size="small" variant="outlined" sx={{ fontWeight: 'bold' }} />
                                            </ListItem>
                                        )) : <Typography variant="caption" sx={{ p: 2 }}>N/A</Typography>}
                                    </List>
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>
                </Box>
                )}
            </Box>
            <Box sx={{ p: 3, bgcolor: 'grey.50', display: 'flex', justifyContent: 'flex-end', gap: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                <Button onClick={handleCloseModal} variant="outlined">Close</Button>
                {selectedReservation && selectedReservation.status === 'pending' && (<>
                    <Button onClick={() => handleStatusUpdate(selectedReservation, 'rejected')} variant="contained" color="error">Reject</Button>
                    <Button onClick={() => handleStatusUpdate(selectedReservation, 'approved')} variant="contained" color="success">Approve</Button>
                </>)}
                {selectedReservation && selectedReservation.status === 'approved' && (
                    <Button onClick={() => handleStatusUpdate(selectedReservation, 'delivered')} variant="contained" color="primary">Mark as Delivered</Button>
                )}
                {selectedReservation && (selectedReservation.status === 'delivered') && (
                    <Button onClick={handleOpenReturnModal} variant="contained" startIcon={<AssignmentTurnedInIcon />}>Mark Returned</Button>
                )}
            </Box>
          </Box>
        </Fade>
      </Modal>
      {/* Image Zoom Modal */}
      <Modal 
        open={!!zoomedImage} 
        onClose={() => setZoomedImage(null)} 
        closeAfterTransition 
        BackdropComponent={Backdrop} 
        BackdropProps={{ timeout: 500 }}
        sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2 }}
        disableRestoreFocus
      >
        <Fade in={!!zoomedImage}>
            <Box 
                component="img" 
                src={zoomedImage} 
                sx={{ 
                    maxHeight: '90vh', 
                    maxWidth: '90vw', 
                    borderRadius: 2, 
                    boxShadow: 24, 
                    outline: 'none',
                    bgcolor: 'background.paper' 
                }} 
                onClick={() => setZoomedImage(null)}
            />
        </Fade>
      </Modal>

      {/* Return Inspection Modal */}
      <Modal open={returnModalOpen} onClose={() => setReturnModalOpen(false)} closeAfterTransition BackdropComponent={Backdrop} BackdropProps={{ timeout: 500 }} disableRestoreFocus>
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
      <Dialog
        open={outstandingDialog.isOpen}
        onClose={() => setOutstandingDialog({ isOpen: false, reservation: null, newStatus: null })}
      >
        <DialogTitle>{"Outstanding Reservation Found"}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This resident has another reservation that is still marked as 'delivered'. Do you want to proceed with marking this new reservation as 'delivered' anyway?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOutstandingDialog({ isOpen: false, reservation: null, newStatus: null })}>Cancel</Button>
          <Button onClick={async () => {
              await proceedWithStatusUpdate(outstandingDialog.reservation, outstandingDialog.newStatus);
              setOutstandingDialog({ isOpen: false, reservation: null, newStatus: null });
          }} autoFocus>
            Proceed
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export default ManageReservations;
