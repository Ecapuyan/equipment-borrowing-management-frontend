// src/pages/BorrowEquipment.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Typography, Box, CircularProgress, Card, CardContent, Grid, TextField, Button,
  Modal, Fade, Backdrop, Select, MenuItem, FormControl, InputLabel,
  IconButton, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, List, ListItem, ListItemText,
  Stepper, Step, StepLabel, StepContent, useTheme, Divider
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { db, storage } from '../firebase';
import { collection, getDocs, addDoc, query, where, Timestamp, doc, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useAuth } from '../context/AuthContextDef';
import { useSnackbar } from '../context/SnackbarContextDef';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import DeleteIcon from '@mui/icons-material/Delete';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import AvailabilityCalendar from '../components/AvailabilityCalendar';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: { xs: '95%', md: 800 },
  bgcolor: 'background.paper',
  boxShadow: 24,
  p: 0, 
  borderRadius: 3,
  maxHeight: '90vh',
  overflowY: 'auto',
  display: 'flex',
  flexDirection: 'column'
};

const calendarModalStyle = {
  ...style,
  width: { xs: '95%', md: 900 },
  p: 4
};

// --- Step Content Components ---
const Step1BorrowerInfo = ({ requestorInfo, handleInfoChange }) => (
  <Grid container spacing={3}>
    <Grid item xs={12}><TextField fullWidth required label="Full Name" name="fullName" value={requestorInfo.fullName} onChange={handleInfoChange} variant="outlined" /></Grid>
    <Grid item xs={12}><TextField fullWidth required label="Address" name="address" value={requestorInfo.address} onChange={handleInfoChange} variant="outlined" /></Grid>
    <Grid item xs={12}><TextField fullWidth required label="Phone Number" name="phoneNumber" value={requestorInfo.phoneNumber} onChange={handleInfoChange} variant="outlined" /></Grid>
  </Grid>
);

const Step2RequestDetails = ({ reservationDate, setReservationDate, timeSlot, setTimeSlot, reason, setReason, onCheckAvailability }) => {
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 30); 

    const minDate = new Date();
    minDate.setDate(minDate.getDate() + 1); 

    return (
        <Grid container spacing={3}>
            <Grid item xs={12}>
               <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, p: 2, bgcolor: 'primary.light', borderRadius: 2, color: 'primary.contrastText' }}>
                   <CalendarMonthIcon sx={{ mr: 2 }} />
                   <Typography variant="body2" sx={{ flexGrow: 1 }}>Check availability before selecting a date to ensure items are in stock.</Typography>
                   <Button 
                     variant="contained" 
                     color="secondary"
                     onClick={onCheckAvailability}
                     size="small"
                   >
                     Check Calendar
                   </Button>
               </Box>
            </Grid>
            <Grid item xs={12} sm={6}>
                <DatePicker 
                    label="Pick-up Date" 
                    value={reservationDate} 
                    onChange={(d) => setReservationDate(d)} 
                    renderInput={(params) => <TextField {...params} fullWidth required />}
                    minDate={minDate}
                    maxDate={maxDate}
                    slotProps={{ textField: { fullWidth: true, required: true } }}
                />
            </Grid>
            <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                    <InputLabel>Time Slot</InputLabel>
                    <Select 
                        value={timeSlot} 
                        label="Time Slot"
                        onChange={(e) => setTimeSlot(e.target.value)} 
                    >
                        <MenuItem value="morning">Morning (7am-2pm)</MenuItem>
                        <MenuItem value="afternoon">Afternoon (3pm-9pm)</MenuItem>
                        <MenuItem value="fullday">Full Day (7am-9pm)</MenuItem>
                    </Select>
                </FormControl>
            </Grid>
            <Grid item xs={12}><TextField fullWidth required multiline rows={4} label="Reason for Borrowing" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="E.g., Birthday party, Community meeting..."/></Grid>
        </Grid>
    );
};

const Step3AddEquipment = ({ allEquipment, currentItemId, setCurrentItemId, currentQuantity, setCurrentQuantity, handleAddToCart, availableStockHint, cart, setCart }) => (
  <Box>
    <Paper elevation={0} variant="outlined" sx={{ p: 3, mb: 3, bgcolor: 'grey.50' }}>
        <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6}>
                <FormControl fullWidth required size="small">
                    <InputLabel>Select Equipment</InputLabel>
                    <Select 
                        value={currentItemId} 
                        label="Select Equipment"
                        onChange={e => setCurrentItemId(e.target.value)} 
                    >
                        {allEquipment.map((e) => <MenuItem key={e.id} value={e.id}>{e.name}</MenuItem>)}
                    </Select>
                </FormControl>
            </Grid>
            <Grid item xs={6} sm={3}><TextField label="Qty" type="number" size="small" value={currentQuantity} onChange={e => setCurrentQuantity(e.target.value)} fullWidth InputProps={{ inputProps: { min: 1 } }} required/></Grid>
            <Grid item xs={6} sm={3}><Button variant="contained" startIcon={<AddCircleIcon />} onClick={handleAddToCart} fullWidth>Add</Button></Grid>
            {currentItemId && <Grid item xs={12}><Typography variant="caption" color="text.secondary">({availableStockHint} available for this date/slot)</Typography></Grid>}
        </Grid>
    </Paper>
    
    <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>Requested Items:</Typography>
    {cart.length > 0 ? (
        <TableContainer component={Paper} variant="outlined">
            <Table size="small">
                <TableHead sx={{ bgcolor: 'grey.100' }}>
                    <TableRow>
                        <TableCell>Item</TableCell>
                        <TableCell align="right">Qty</TableCell>
                        <TableCell align="right">Action</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {cart.map(item => (
                        <TableRow key={item.id}>
                            <TableCell>{item.name}</TableCell>
                            <TableCell align="right">{item.quantity}</TableCell>
                            <TableCell align="right">
                                <IconButton size="small" color="error" onClick={() => setCart(p => p.filter(i => i.id !== item.id))}><DeleteIcon/></IconButton>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    ) : (
        <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 3 }}>No items added yet.</Typography>
    )}
  </Box>
);

const Step4UploadDocs = ({ handleFileChange, idPreview, selfiePreview }) => (
    <Grid container spacing={3}>
        <Grid item xs={12} sm={6}>
            <Paper variant="outlined" sx={{ p: 3, textAlign: 'center', borderStyle: 'dashed' }}>
                <Typography gutterBottom fontWeight="bold">Upload ID Card <span style={{color: 'red'}}>*</span></Typography>
                <Button variant="outlined" component="label" startIcon={<CloudUploadIcon />}>
                    Select File
                    <input type="file" accept="image/*" hidden onChange={(e) => handleFileChange(e, 'id')} required />
                </Button>
                {idPreview && <Box component="img" src={idPreview} sx={{display: 'block', mx: 'auto', mt: 2, maxHeight: 150, maxWidth: '100%', borderRadius: 1}} />}
            </Paper>
        </Grid>
        <Grid item xs={12} sm={6}>
            <Paper variant="outlined" sx={{ p: 3, textAlign: 'center', borderStyle: 'dashed' }}>
                <Typography gutterBottom fontWeight="bold">Selfie with ID <span style={{color: 'red'}}>*</span></Typography>
                <Button variant="outlined" component="label" startIcon={<CloudUploadIcon />}>
                    Select File
                    <input type="file" accept="image/*" hidden onChange={(e) => handleFileChange(e, 'selfie')} required />
                </Button>
                {selfiePreview && <Box component="img" src={selfiePreview} sx={{display: 'block', mx: 'auto', mt: 2, maxHeight: 150, maxWidth: '100%', borderRadius: 1}} />}
            </Paper>
        </Grid>
    </Grid>
);

const Step5Review = ({ requestorInfo, reservationDate, timeSlot, reason, cart, idPreview, selfiePreview }) => (
    <Paper elevation={0} variant="outlined" sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom color="primary">Summary of Request</Typography>
        <Divider sx={{ mb: 2 }} />
        <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Borrower</Typography>
                <Typography variant="body1" fontWeight="medium">{requestorInfo.fullName}</Typography>
                <Typography variant="body2">{requestorInfo.address}</Typography>
                <Typography variant="body2">{requestorInfo.phoneNumber}</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Schedule</Typography>
                <Typography variant="body1" fontWeight="medium">{reservationDate ? reservationDate.toLocaleDateString() : 'N/A'}</Typography>
                <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>{timeSlot || 'N/A'}</Typography>
            </Grid>
            <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary">Reason</Typography>
                <Typography variant="body2">{reason}</Typography>
            </Grid>
        </Grid>
        
        <Divider sx={{ my: 2 }} />
        <Typography variant="subtitle2" gutterBottom color="text.secondary">Items Requested</Typography>
        {cart.map(i => (
             <Box key={i.id} sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                 <Typography variant="body2">{i.name}</Typography>
                 <Typography variant="body2" fontWeight="bold">x{i.quantity}</Typography>
             </Box>
        ))}
    </Paper>
);

function BorrowEquipment() {
  const { currentUser } = useAuth();
  const { showSnackbar } = useSnackbar();
  const theme = useTheme();
  
  const [modalOpen, setModalOpen] = useState(false);
  const [availabilityModalOpen, setAvailabilityModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [allEquipment, setAllEquipment] = useState([]);
  const [allReservations, setAllReservations] = useState([]);
  
  const [activeStep, setActiveStep] = useState(0);
  const [cart, setCart] = useState([]);
  const [currentItemId, setCurrentItemId] = useState('');
  const [currentQuantity, setCurrentQuantity] = useState(1);
  const [reservationDate, setReservationDate] = useState(null); 
  const [timeSlot, setTimeSlot] = useState(''); 
  const [reason, setReason] = useState('');
  const [idFile, setIdFile] = useState(null);
  const [selfieFile, setSelfieFile] = useState(null);
  const [idPreview, setIdPreview] = useState('');
  const [selfiePreview, setSelfiePreview] = useState('');
  const [uploading, setUploading] = useState(false);
  const [requestorInfo, setRequestorInfo] = useState({ fullName: '', address: '', phoneNumber: '' });

  const fetchPrerequisites = useCallback(async () => {
    setLoading(true);
    try {
      const equipmentSnapshot = await getDocs(collection(db, 'equipments'));
      setAllEquipment(equipmentSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })));
      const reservationsQuery = query(collection(db, 'reservations'), where('status', 'in', ['approved', 'pending']));
      const reservationsSnapshot = await getDocs(reservationsQuery);
      setAllReservations(reservationsSnapshot.docs.map(d => d.data()));
      if (currentUser) {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setRequestorInfo({
            fullName: userData.fullName || currentUser.email,
            address: userData.address || '',
            phoneNumber: userData.phoneNumber || ''
          });
        }
      }
    } catch (err) { 
      console.error("Failed to load required data.", err);
      showSnackbar('Failed to load required data.', 'error'); 
    } 
    finally { setLoading(false); }
  }, [currentUser, showSnackbar]);

  useEffect(() => { fetchPrerequisites(); }, [fetchPrerequisites]);

  const availableStockHint = useMemo(() => {
    if (!currentItemId || !reservationDate || !timeSlot) return 0;
    const equipment = allEquipment.find(e => e.id === currentItemId);
    const stock = equipment?.totalStock || 0;
    const reservationsForThisItem = allReservations.filter(r => Array.isArray(r.items) && r.items.some(i => i.id === currentItemId) && r.reservationDate.toDate().toDateString() === reservationDate.toDateString());
    let reservedCount = 0;
    for (const res of reservationsForThisItem) {
        const itemInRes = res.items.find(i => i.id === currentItemId);
        if (res.timeSlot === 'fullday' || res.timeSlot === timeSlot) reservedCount += itemInRes.quantity;
        else if (timeSlot === 'fullday' && (res.timeSlot === 'morning' || res.timeSlot === 'afternoon')) reservedCount += itemInRes.quantity;
    }
    return stock - reservedCount;
  }, [currentItemId, reservationDate, timeSlot, allEquipment, allReservations]);

  const handleAddToCart = () => {
    if (!currentItemId || currentQuantity <= 0) { showSnackbar('Please select an item and a valid quantity.', 'warning'); return; }
    if (cart.find(item => item.id === currentItemId)) { showSnackbar('Item is already in your request list.', 'info'); return; }
    if (currentQuantity > availableStockHint) { showSnackbar(`Cannot add quantity. Only ${availableStockHint} available.`, 'error'); return; }
    const equipment = allEquipment.find(e => e.id === currentItemId);
    setCart(prev => [...prev, { ...equipment, quantity: Number(currentQuantity) }]);
    setCurrentItemId('');
    setCurrentQuantity(1);
  };
  
  const handleFileChange = (e, fileType) => {
    const file = e.target.files[0];
    if (!file) return;
    const previewUrl = URL.createObjectURL(file);
    if (fileType === 'id') { setIdFile(file); setIdPreview(previewUrl); } 
    else { setSelfieFile(file); setSelfiePreview(previewUrl); }
  };

  const handleInfoChange = (e) => {
    setRequestorInfo(prev => ({...prev, [e.target.name]: e.target.value}));
  };

  const isStepValid = (step) => {
    const s = step !== undefined ? step : activeStep;
    switch (s) {
        case 0: return !!requestorInfo.fullName && !!requestorInfo.address && !!requestorInfo.phoneNumber;
        case 1: return !!reservationDate && !!timeSlot && !!reason;
        case 2: return cart.length > 0;
        case 3: return !!idFile && !!selfieFile;
        default: return true;
    }
  };

  const handleSubmitRequest = async () => {
    if (!isStepValid()) {
        showSnackbar('Please ensure all fields are complete before submitting.', 'error');
        return;
    }
    setUploading(true);

    try {
      const userReservationsQuery = query(collection(db, 'reservations'), where('userId', '==', currentUser.uid));
      const userReservationsSnapshot = await getDocs(userReservationsQuery);
      const userHasReservationForDate = userReservationsSnapshot.docs.some(doc => doc.data().reservationDate.toDate().toDateString() === reservationDate.toDateString());
      if (userHasReservationForDate) {
        showSnackbar('You already have a reservation request for this day.', 'error');
        setUploading(false);
        return;
      }
      
      const idRef = ref(storage, `verifications/${currentUser.uid}/${Timestamp.now().toMillis()}_id`);
      await uploadBytes(idRef, idFile);
      const idCardUrl = await getDownloadURL(idRef);
      const selfieRef = ref(storage, `verifications/${currentUser.uid}/${Timestamp.now().toMillis()}_selfie`);
      await uploadBytes(selfieRef, selfieFile);
      const selfieUrl = await getDownloadURL(selfieRef);

      await addDoc(collection(db, 'reservations'), {
        ...requestorInfo, userId: currentUser.uid, reason, items: cart,
        reservationDate: Timestamp.fromDate(reservationDate), timeSlot, status: 'pending', requestDate: Timestamp.now(),
        idCardUrl, selfieUrl,
      });
      showSnackbar('Reservation request sent successfully!', 'success');
      handleCloseModal();
    } catch (err) { 
      console.error("Failed to send request.", err);
      showSnackbar('Failed to send request.', 'error'); 
    } 
    finally { setUploading(false); }
  };
  
  const handleCloseModal = () => {
    setModalOpen(false); setActiveStep(0); setCart([]); setReason('');
    setIdFile(null); setSelfieFile(null); setIdPreview(''); setSelfiePreview('');
    setReservationDate(null);
    setTimeSlot('');
  };

  const steps = [
    { label: 'Borrower Info', content: <Step1BorrowerInfo {...{requestorInfo, handleInfoChange}} /> },
    { 
        label: 'Request Details', 
        content: <Step2RequestDetails 
            {...{reservationDate, setReservationDate, timeSlot, setTimeSlot, reason, setReason}} 
            onCheckAvailability={() => setAvailabilityModalOpen(true)}
        /> 
    },
    { label: 'Select Equipment', content: <Step3AddEquipment {...{allEquipment, currentItemId, setCurrentItemId, currentQuantity, setCurrentQuantity, handleAddToCart, availableStockHint, cart, setCart}} /> },
    { label: 'Upload Documents', content: <Step4UploadDocs {...{handleFileChange, idPreview, selfiePreview}} /> },
    { label: 'Confirm', content: <Step5Review {...{requestorInfo, reservationDate, timeSlot, reason, cart, idPreview, selfiePreview}} /> },
  ];

  return (
    <>
      <Box sx={{ mt: 4, mb: 4 }}>
          <Typography variant="h4" fontWeight="bold" gutterBottom>Borrow Equipment</Typography>
          <Typography variant="subtitle1" color="text.secondary">Follow the steps to submit a new equipment request.</Typography>
      </Box>

      <Card sx={{ maxWidth: 800, mx: 'auto', textAlign: 'center', py: 8, px: 4, borderRadius: 4, boxShadow: theme.shadows[4] }}>
          <CardContent>
              <Box sx={{ mb: 4, display: 'flex', justifyContent: 'center' }}>
                  <AddCircleIcon sx={{ fontSize: 80, color: 'primary.light' }} />
              </Box>
              <Typography variant="h5" gutterBottom fontWeight="bold">Ready to Borrow?</Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: 500, mx: 'auto' }}>
                  Start a new request application. You'll need to provide your details, select items, and upload verification documents.
              </Typography>
              <Button 
                variant="contained" 
                size="large" 
                onClick={() => setModalOpen(true)} 
                disabled={loading}
                sx={{ borderRadius: 50, px: 6, py: 1.5, fontSize: '1.1rem' }}
              >
                Start New Request
              </Button>
          </CardContent>
      </Card>
      
      {/* Main Borrowing Flow Modal */}
      <Modal open={modalOpen} onClose={handleCloseModal} closeAfterTransition BackdropComponent={Backdrop} BackdropProps={{ timeout: 500 }}>
        <Fade in={modalOpen}>
            <Box sx={style}>
                {/* Header */}
                <Box sx={{ p: 3, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'primary.main', color: 'white', borderTopLeftRadius: 12, borderTopRightRadius: 12 }}>
                   <Typography variant="h6" fontWeight="bold">New Borrowing Request</Typography>
                </Box>

                {/* Content */}
                <Box sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1, overflowY: 'auto' }}>
                    <Box sx={{ p: 3 }}>
                        <Stepper activeStep={activeStep} alternativeLabel>
                            {steps.map((step) => (
                            <Step key={step.label}>
                                <StepLabel>{step.label}</StepLabel>
                            </Step>
                            ))}
                        </Stepper>
                    </Box>
                    
                    <Box sx={{ p: 4, flexGrow: 1 }}>
                        {steps[activeStep].content}
                    </Box>
                </Box>

                {/* Footer Actions */}
                <Box sx={{ p: 3, borderTop: '1px solid', borderColor: 'divider', bgcolor: 'grey.50', display: 'flex', justifyContent: 'space-between', borderBottomLeftRadius: 12, borderBottomRightRadius: 12 }}>
                    <Button 
                        disabled={activeStep === 0} 
                        onClick={() => setActiveStep(p => p - 1)}
                        startIcon={<ArrowBackIcon />}
                    >
                        Back
                    </Button>
                    <Box>
                        {activeStep === steps.length - 1 ? (
                            <Button 
                                onClick={handleSubmitRequest} 
                                variant="contained" 
                                color="success" 
                                disabled={uploading}
                                size="large"
                            >
                                {uploading ? <CircularProgress size={24} color="inherit" /> : 'Submit Request'}
                            </Button>
                        ) : (
                            <Button 
                                variant="contained" 
                                onClick={() => setActiveStep(p => p + 1)} 
                                disabled={!isStepValid(activeStep)}
                                endIcon={<ArrowForwardIcon />}
                            >
                                Continue
                            </Button>
                        )}
                    </Box>
                </Box>
            </Box>
        </Fade>
      </Modal>

      {/* Availability Calendar Modal */}
      <Modal open={availabilityModalOpen} onClose={() => setAvailabilityModalOpen(false)} closeAfterTransition BackdropComponent={Backdrop} BackdropProps={{ timeout: 500 }}>
         <Fade in={availabilityModalOpen}>
             <Box sx={calendarModalStyle}>
                 <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h5" fontWeight="bold">Equipment Availability</Typography>
                    <Button onClick={() => setAvailabilityModalOpen(false)}>Close</Button>
                 </Box>
                 <AvailabilityCalendar allEquipment={allEquipment} allReservations={allReservations} />
             </Box>
         </Fade>
      </Modal>
    </>
  );
}

export default BorrowEquipment;
