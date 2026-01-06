// src/pages/BorrowEquipment.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Typography, Box, CircularProgress, Card, CardContent, Grid, TextField, Button,
  Modal, Fade, Backdrop, Select, MenuItem, FormControl,
  IconButton, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, List, ListItem, ListItemText,
  Stepper, Step, StepLabel, StepContent
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
import AvailabilityCalendar from '../components/AvailabilityCalendar';

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: { xs: '90%', sm: '80%', md: 700 },
  bgcolor: 'background.paper',
  boxShadow: 24,
  p: 4,
  borderRadius: 2,
  maxHeight: '90vh',
  overflowY: 'auto',
};

const calendarModalStyle = {
  ...style,
  width: { xs: '95%', md: 900 },
};

// --- Step Content Components ---
const Step1BorrowerInfo = ({ requestorInfo, handleInfoChange }) => (
  <Grid container spacing={2}>
    <Grid item xs={12}><TextField fullWidth required label="Full Name" name="fullName" value={requestorInfo.fullName} onChange={handleInfoChange} /></Grid>
    <Grid item xs={12}><TextField fullWidth required label="Address" name="address" value={requestorInfo.address} onChange={handleInfoChange} /></Grid>
    <Grid item xs={12}><TextField fullWidth required label="Phone Number" name="phoneNumber" value={requestorInfo.phoneNumber} onChange={handleInfoChange} /></Grid>
  </Grid>
);

const Step2RequestDetails = ({ reservationDate, setReservationDate, timeSlot, setTimeSlot, reason, setReason, onCheckAvailability }) => {
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 30); // 30 days from today

    const minDate = new Date();
    minDate.setDate(minDate.getDate() + 1); // Earliest pick-up is tomorrow

    return (
        <Grid container spacing={2}>
            <Grid item xs={12}>
               <Button 
                 startIcon={<CalendarMonthIcon />} 
                 variant="outlined" 
                 onClick={onCheckAvailability}
                 sx={{ mb: 2 }}
               >
                 Check Availability Calendar
               </Button>
            </Grid>
            <Grid item xs={12} sm={6}>
                <DatePicker 
                    label="Pick-up Date" 
                    value={reservationDate} 
                    onChange={(d) => setReservationDate(d)} 
                    renderInput={(params) => <TextField {...params} fullWidth required placeholder="Pick Date" />}
                    minDate={minDate}
                    maxDate={maxDate}
                />
            </Grid>
            <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                    <Select 
                        value={timeSlot} 
                        onChange={(e) => setTimeSlot(e.target.value)} 
                        displayEmpty
                    >
                        <MenuItem value="" disabled>Pick Time Slot</MenuItem>
                        <MenuItem value="morning">Morning (7am-2pm)</MenuItem>
                        <MenuItem value="afternoon">Afternoon (3pm-9pm)</MenuItem>
                        <MenuItem value="fullday">Full Day (7am-9pm)</MenuItem>
                    </Select>
                </FormControl>
            </Grid>
            <Grid item xs={12}><TextField fullWidth required multiline rows={4} label="Reason for Borrowing" value={reason} onChange={(e) => setReason(e.target.value)}/></Grid>
        </Grid>
    );
};

const Step3AddEquipment = ({ allEquipment, currentItemId, setCurrentItemId, currentQuantity, setCurrentQuantity, handleAddToCart, availableStockHint, cart, setCart }) => (
  <Box>
    <Grid container spacing={2} alignItems="center">
        <Grid item xs={12} sm={8}>
            <FormControl fullWidth required>
                <Select 
                    value={currentItemId} 
                    onChange={e => setCurrentItemId(e.target.value)} 
                    displayEmpty
                >
                    <MenuItem value="" disabled>Select Equipment</MenuItem>
                    {allEquipment.map((e) => <MenuItem key={e.id} value={e.id}>{e.name}</MenuItem>)}
                </Select>
            </FormControl>
        </Grid>
        <Grid item xs={6} sm={2}><TextField label="Qty" type="number" value={currentQuantity} onChange={e => setCurrentQuantity(e.target.value)} fullWidth InputProps={{ inputProps: { min: 1 } }} required/></Grid>
        <Grid item xs={6} sm={2}><Button variant="contained" color="primary" onClick={handleAddToCart} fullWidth sx={{height: '56px'}}>Add</Button></Grid>
        {currentItemId && <Grid item xs={12}><Typography variant="caption">({availableStockHint} available for this date/slot)</Typography></Grid>}
    </Grid>
    {cart.length > 0 && <TableContainer component={Paper} variant="outlined" sx={{mt:2}}><Table size="small"><TableHead><TableRow><TableCell>Item</TableCell><TableCell align="right">Qty</TableCell><TableCell align="right">Actions</TableCell></TableRow></TableHead><TableBody>{cart.map(item => (<TableRow key={item.id}><TableCell>{item.name}</TableCell><TableCell align="right">{item.quantity}</TableCell><TableCell align="right"><IconButton size="small" onClick={() => setCart(p => p.filter(i => i.id !== item.id))}><DeleteIcon/></IconButton></TableCell></TableRow>))}</TableBody></Table></TableContainer>}
  </Box>
);

const Step4UploadDocs = ({ handleFileChange, idPreview, selfiePreview }) => (
    <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
            <Typography gutterBottom>Upload ID Card <span style={{color: 'red'}}>*</span></Typography>
            <Button variant="outlined" component="label" fullWidth>
                Choose File
                <input type="file" accept="image/*" hidden onChange={(e) => handleFileChange(e, 'id')} required />
            </Button>
            {idPreview && <Box component="img" src={idPreview} sx={{width: '100%', maxWidth: 100, height: 'auto', mt: 1, borderRadius: 1}} />}
        </Grid>
        <Grid item xs={12} sm={6}>
            <Typography gutterBottom>Upload Selfie with ID <span style={{color: 'red'}}>*</span></Typography>
            <Button variant="outlined" component="label" fullWidth>
                Choose File
                <input type="file" accept="image/*" hidden onChange={(e) => handleFileChange(e, 'selfie')} required />
            </Button>
            {selfiePreview && <Box component="img" src={selfiePreview} sx={{width: '100%', maxWidth: 100, height: 'auto', mt: 1, borderRadius: 1}} />}
        </Grid>
    </Grid>
);

const Step5Review = ({ requestorInfo, reservationDate, timeSlot, reason, cart, idPreview, selfiePreview }) => (
    <Box>
        <Typography variant="h6">Review Your Request</Typography>
        <List dense>
            <ListItem><ListItemText primary="Name" secondary={requestorInfo.fullName} /></ListItem>
            <ListItem><ListItemText primary="Address" secondary={requestorInfo.address} /></ListItem>
            <ListItem><ListItemText primary="Phone" secondary={requestorInfo.phoneNumber} /></ListItem>
            <ListItem><ListItemText primary="Date" secondary={reservationDate ? reservationDate.toLocaleDateString() : 'N/A'} /></ListItem>
            <ListItem><ListItemText primary="Time Slot" secondary={<span style={{textTransform: 'capitalize'}}>{timeSlot || 'N/A'}</span>} /></ListItem>
            <ListItem><ListItemText primary="Reason" secondary={reason} /></ListItem>
        </List>
        <Typography variant="subtitle1" sx={{mt:1}}>Items:</Typography>
        <List dense>{cart.map(i => <ListItemText key={i.id} primary={`${i.name} (x${i.quantity})`}/>)}</List>
        <Typography variant="subtitle1" sx={{mt:1}}>Documents:</Typography>
        <Grid container spacing={2}>
            {idPreview && <Grid item xs={6}><Box component="img" src={idPreview} sx={{width: '100%', maxWidth: 100, height: 'auto', borderRadius: 1}} /></Grid>}
            {selfiePreview && <Grid item xs={6}><Box component="img" src={selfiePreview} sx={{width: '100%', maxWidth: 100, height: 'auto', borderRadius: 1}} /></Grid>}
        </Grid>
    </Box>
);

function BorrowEquipment() {
  const { currentUser } = useAuth();
  const { showSnackbar } = useSnackbar();
  const [modalOpen, setModalOpen] = useState(false);
  const [availabilityModalOpen, setAvailabilityModalOpen] = useState(false); // New state for availability modal
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

  const isStepValid = () => {
    switch (activeStep) {
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
    { label: 'Borrower Information', content: <Step1BorrowerInfo {...{requestorInfo, handleInfoChange}} /> },
    { 
        label: 'Request Details', 
        content: <Step2RequestDetails 
            {...{reservationDate, setReservationDate, timeSlot, setTimeSlot, reason, setReason}} 
            onCheckAvailability={() => setAvailabilityModalOpen(true)} // Pass handler
        /> 
    },
    { label: 'Add Equipment', content: <Step3AddEquipment {...{allEquipment, currentItemId, setCurrentItemId, currentQuantity, setCurrentQuantity, handleAddToCart, availableStockHint, cart, setCart}} /> },
    { label: 'Upload Documents', content: <Step4UploadDocs {...{handleFileChange, idPreview, selfiePreview}} /> },
    { label: 'Review & Submit', content: <Step5Review {...{requestorInfo, reservationDate, timeSlot, reason, cart, idPreview, selfiePreview}} /> },
  ];

  return (
    <>
      <Card><CardContent sx={{ textAlign: 'center', p: 5 }}><Typography variant="h5" gutterBottom>Create a New Borrowing Request</Typography><Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>Request one or more items for a specific date and time slot.</Typography><Button variant="contained" size="large" onClick={() => setModalOpen(true)} disabled={loading}>Create Request</Button></CardContent></Card>
      
      {/* Main Borrowing Flow Modal */}
      <Modal open={modalOpen} onClose={handleCloseModal} closeAfterTransition BackdropComponent={Backdrop} BackdropProps={{ timeout: 500 }}>
        <Fade in={modalOpen}><Box sx={style}><Typography variant="h5" component="h2" sx={{ mb: 2 }}>New Borrowing Request</Typography>
          <Stepper activeStep={activeStep} orientation="vertical">
            {steps.map((step, index) => (<Step key={step.label}><StepLabel>{step.label}</StepLabel><StepContent><Box sx={{py: 2}}>{step.content}</Box><Box sx={{ mb: 2 }}><div>
              <Button variant="contained" onClick={() => setActiveStep(p => p + 1)} sx={{ mt: 1, mr: 1 }} disabled={!isStepValid(activeStep)}>
                {index === steps.length - 1 ? 'Submit' : 'Continue'}
              </Button>
              <Button disabled={index === 0} onClick={() => setActiveStep(p => p - 1)} sx={{ mt: 1, mr: 1 }}>Back</Button>
            </div></Box></StepContent></Step>))}
          </Stepper>
          {activeStep === steps.length && (<Paper square elevation={0} sx={{ p: 3 }}><Typography>All steps completed - you're ready to submit.</Typography>
            <Button onClick={handleSubmitRequest} sx={{ mt: 1, mr: 1 }} variant="contained" color="success" disabled={uploading}>{uploading ? <CircularProgress size={24} /> : 'Submit Final Request'}</Button>
            <Button onClick={() => setActiveStep(0)} sx={{ mt: 1, mr: 1 }}>Reset</Button>
          </Paper>)}
        </Box></Fade>
      </Modal>

      {/* Availability Calendar Modal */}
      <Modal open={availabilityModalOpen} onClose={() => setAvailabilityModalOpen(false)} closeAfterTransition BackdropComponent={Backdrop} BackdropProps={{ timeout: 500 }}>
         <Fade in={availabilityModalOpen}>
             <Box sx={calendarModalStyle}>
                 <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h5">Check Equipment Availability</Typography>
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
