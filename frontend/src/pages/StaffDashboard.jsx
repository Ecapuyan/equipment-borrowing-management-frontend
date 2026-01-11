// src/pages/StaffDashboard.jsx
import React, { useState, useEffect } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Typography,
  Grid,
  Card,
  CardContent,
  CardActionArea,
  Box,
  CircularProgress,
  useTheme,
  Avatar
} from '@mui/material';
import StorageIcon from '@mui/icons-material/Storage';
import PeopleIcon from '@mui/icons-material/People';
import BookOnlineIcon from '@mui/icons-material/BookOnline';
import AssessmentIcon from '@mui/icons-material/Assessment';
import { useAuth } from '../context/AuthContextDef';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import StaffCalendar from '../components/StaffCalendar';

function StaffDashboard() {
  const { currentUser } = useAuth();
  const theme = useTheme();
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReservations = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'reservations'));
        const data = querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
        setReservations(data);
      } catch (error) {
        console.error("Error fetching reservations for calendar:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchReservations();
  }, []);

  const handleMarkDelivered = async (reservationId) => {
    try {
        await updateDoc(doc(db, 'reservations', reservationId), {
            status: 'delivered'
        });
        // Update local state to reflect change immediately
        setReservations(prev => prev.map(res => 
            res.id === reservationId ? { ...res, status: 'delivered' } : res
        ));
    } catch (error) {
        console.error("Error marking reservation as delivered:", error);
    }
  };

  const dashboardItems = [
    {
      title: 'Equipment Inventory',
      description: 'Track stock, add new items, and manage availability.',
      path: '/staff/manage-equipment',
      icon: <StorageIcon sx={{ fontSize: 32, color: 'white' }} />,
      color: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' // Blue
    },
    {
      title: 'User Directory',
      description: 'Manage resident accounts, roles, and permissions.',
      path: '/staff/user-management',
      icon: <PeopleIcon sx={{ fontSize: 32, color: 'white' }} />,
      color: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)' // Violet
    },
    {
      title: 'Reservation Requests',
      description: 'Approve, reject, or mark equipment as returned.',
      path: '/staff/manage-reservations',
      icon: <BookOnlineIcon sx={{ fontSize: 32, color: 'white' }} />,
      color: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' // Emerald
    },
    {
      title: 'Reports & Analytics',
      description: 'View usage statistics and incident reports.',
      path: '/staff/reports',
      icon: <AssessmentIcon sx={{ fontSize: 32, color: 'white' }} />,
      color: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' // Amber
    }
  ];

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
            Staff Overview
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
            Hello, <Box component="span" fontWeight="bold" color="primary.main">{currentUser?.email?.split('@')[0]}</Box>. Here is what's happening today.
        </Typography>
      </Box>
      
      {/* Navigation Cards */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        {dashboardItems.map((item) => (
          <Grid item xs={12} sm={6} lg={3} key={item.title}>
            <Card 
              sx={{ 
                height: '100%', 
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: theme.shadows[4]
                }
              }}
            >
              <CardActionArea component={RouterLink} to={item.path} sx={{ height: '100%', p: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                   <Avatar variant="rounded" sx={{ background: item.color, width: 44, height: 44, boxShadow: 1 }}>
                      {React.cloneElement(item.icon, { sx: { fontSize: 24, color: 'white' } })}
                   </Avatar>
                </Box>
                <CardContent sx={{ p: 0 }}>
                    <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                        {item.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem' }}>
                        {item.description}
                    </Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Operational Calendar */}
      <Typography variant="h5" fontWeight="bold" gutterBottom sx={{ mb: 3 }}>
        Operational Calendar
      </Typography>
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
            <CircularProgress />
        </Box>
      ) : (
        <Card sx={{ borderRadius: 2 }}>
            <CardContent sx={{ p: 3 }}>
                <StaffCalendar reservations={reservations} onMarkDelivered={handleMarkDelivered} />
            </CardContent>
        </Card>
      )}
    </Box>
  );
}

export default StaffDashboard;
