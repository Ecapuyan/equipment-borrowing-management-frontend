// src/pages/StaffDashboard.jsx
import React, { useState, useEffect, useMemo } from 'react';
import {
  Typography,
  Card,
  CardContent,
  Box,
  CircularProgress,
  Grid,
  useTheme,
  List,
  ListItem,
  ListItemText,
  Divider,
  Chip,
  Tooltip,
  IconButton
} from '@mui/material';
import { useAuth } from '../context/AuthContextDef';
import { collection, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import StaffCalendar from '../components/StaffCalendar';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import EventBusyIcon from '@mui/icons-material/EventBusy';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import AssignmentReturnIcon from '@mui/icons-material/AssignmentReturn';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

function StatCard({ title, value, icon, color }) {
    return (
        <Card sx={{ height: '100%', borderLeft: `5px solid ${color}`, borderRadius: 2, boxShadow: 2 }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2, '&:last-child': { pb: 2 } }}>
                <Box>
                    <Typography color="text.secondary" variant="caption" fontWeight="bold" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        {title}
                    </Typography>
                    <Typography variant="h4" fontWeight="bold" sx={{ mt: 0.5 }}>
                        {value}
                    </Typography>
                </Box>
                <Box sx={{ 
                    bgcolor: `${color}15`, 
                    p: 1, 
                    borderRadius: '50%', 
                    display: 'flex', 
                    color: color 
                }}>
                    {icon}
                </Box>
            </CardContent>
        </Card>
    );
}

function StaffDashboard() {
  const { currentUser } = useAuth();
  const theme = useTheme();
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log("StaffDashboard component mounted");
    const unsubscribe = onSnapshot(collection(db, 'reservations'), (snapshot) => {
        const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
        setReservations(data);
        setLoading(false);
    }, (error) => {
        console.error("Error fetching reservations:", error);
        setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const stats = useMemo(() => {
    const todayStr = new Date().toDateString();
    
    let pending = 0;
    let active = 0;
    const deliveriesToday = [];
    const returnsToday = [];

    reservations.forEach(res => {
        const resDate = res.reservationDate?.toDate().toDateString();

        if (res.status === 'pending') pending++;
        if (res.status === 'approved' || res.status === 'delivered') active++;

        // Deliveries: Approved & Scheduled for Today
        if (res.status === 'approved' && resDate === todayStr) {
            deliveriesToday.push(res);
        }

        // Returns: Delivered & Scheduled for Today (or earlier/overdue)
        // We include 'delivered' items from today or past to ensure they get returned.
        if (res.status === 'delivered' && resDate === todayStr) {
            returnsToday.push(res);
        }
    });

    console.log("stats.returnsToday:", returnsToday);

    return { pending, active, deliveriesToday, returnsToday };
  }, [reservations]);

  const handleMarkDelivered = async (reservationId) => {
    if (!window.confirm("Confirm equipment delivery to resident?")) return;
    try {
        await updateDoc(doc(db, 'reservations', reservationId), {
            status: 'delivered'
        });
    } catch (error) {
        console.error("Error marking reservation as delivered:", error);
    }
  };

  const handleMarkReturned = async (reservationId) => {
    console.log("handleMarkReturned called with reservationId:", reservationId);
    if (!window.confirm("Confirm equipment return? Ensure items are checked.")) return;
    try {
        await updateDoc(doc(db, 'reservations', reservationId), {
            status: 'returned',
            returnDate: new Date()
        });
    } catch (error) {
        console.error("Error marking reservation as returned:", error);
    }
  };

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
            Staff Overview
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
            Hello, <Box component="span" fontWeight="bold" color="primary.main">{currentUser?.email?.split('@')[0]}</Box>. Here is your operational schedule for today.
        </Typography>
      </Box>
      
      {/* Quick Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item sx={{ xs: 12, sm: 4 }}>
            <StatCard 
                title="Pending Requests" 
                value={stats.pending} 
                icon={<PendingActionsIcon fontSize="large" />} 
                color={theme.palette.warning.main}
            />
        </Grid>
        <Grid item sx={{ xs: 12, sm: 4 }}>
            <StatCard 
                title="To Deliver Today" 
                value={stats.deliveriesToday.length} 
                icon={<LocalShippingIcon fontSize="large" />} 
                color={theme.palette.info.main}
            />
        </Grid>
        <Grid item sx={{ xs: 12, sm: 4 }}>
            <StatCard 
                title="Expected Returns" 
                value={stats.returnsToday.length} 
                icon={<AssignmentReturnIcon fontSize="large" />} 
                color={theme.palette.success.main}
            />
        </Grid>
      </Grid>

      {/* Today's Schedule Section */}
      <Typography variant="h5" fontWeight="bold" gutterBottom sx={{ mb: 2 }}>
        Today's Schedule
      </Typography>
      
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Deliveries Column */}
        <Grid item sx={{ xs: 12, md: 6 }}>
            <Card sx={{ height: '100%', borderRadius: 2, borderTop: `4px solid ${theme.palette.info.main}` }}>
                <CardContent>
                    <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <LocalShippingIcon color="info" /> Scheduled Deliveries
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    {stats.deliveriesToday.length === 0 ? (
                        <Typography color="text.secondary" align="center" sx={{ py: 4 }}>No deliveries scheduled for today.</Typography>
                    ) : (
                        <List dense>
                            {stats.deliveriesToday.map((res) => (
                                <ListItem 
                                    key={res.id} 
                                    divider 
                                    secondaryAction={
                                        <IconButton edge="end" color="primary" onClick={() => handleMarkDelivered(res.id)}>
                                            <CheckCircleIcon />
                                        </IconButton>
                                    }
                                >
                                    <ListItemText 
                                        primary={<Typography fontWeight="bold">{res.fullName}</Typography>}
                                        secondary={
                                            <Box component="span">
                                                <Chip label={res.timeSlot} size="small" variant="outlined" sx={{ textTransform: 'capitalize', mr: 1, mt: 0.5 }} />
                                                {Array.isArray(res.items) ? `${res.items.length} items` : 'Items'}
                                            </Box>
                                        }
                                        secondaryTypographyProps={{ component: 'span' }}
                                    />
                                </ListItem>
                            ))}
                        </List>
                    )}
                </CardContent>
            </Card>
        </Grid>

        {/* Returns Column */}
        <Grid item sx={{ xs: 12, md: 6 }}>
            <Card sx={{ height: '100%', borderRadius: 2, borderTop: `4px solid ${theme.palette.success.main}` }}>
                <CardContent>
                    <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <AssignmentReturnIcon color="success" /> Expected Returns
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    {stats.returnsToday.length === 0 ? (
                        <Typography color="text.secondary" align="center" sx={{ py: 4 }}>No returns expected for today.</Typography>
                    ) : (
                        <List dense>
                            {stats.returnsToday.map((res) => (
                                <ListItem 
                                    key={res.id} 
                                    divider 
                                    secondaryAction={
                                        <IconButton edge="end" color="success" onClick={() => handleMarkReturned(res.id)}>
                                            <AssignmentTurnedInIcon />
                                        </IconButton>
                                    }
                                >
                                    <ListItemText 
                                        primary={<Typography fontWeight="bold">{res.fullName}</Typography>}
                                        secondary={
                                            <Box component="span">
                                                <Chip label={res.timeSlot} size="small" variant="outlined" sx={{ textTransform: 'capitalize', mr: 1, mt: 0.5 }} />
                                                {Array.isArray(res.items) ? `${res.items.length} items` : 'Items'}
                                            </Box>
                                        }
                                        secondaryTypographyProps={{ component: 'span' }}
                                    />
                                </ListItem>
                            ))}
                        </List>
                    )}
                </CardContent>
            </Card>
        </Grid>
      </Grid>

      {/* Operational Calendar */}
      <Typography variant="h5" fontWeight="bold" gutterBottom sx={{ mb: 2 }}>
        Operational Calendar
      </Typography>
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
            <CircularProgress />
        </Box>
      ) : (
        <Card sx={{ borderRadius: 2, boxShadow: 3 }}>
            <CardContent sx={{ p: 3 }}>
                <StaffCalendar reservations={reservations} onMarkDelivered={handleMarkDelivered} />
            </CardContent>
        </Card>
      )}
    </Box>
  );
}

export default StaffDashboard;
