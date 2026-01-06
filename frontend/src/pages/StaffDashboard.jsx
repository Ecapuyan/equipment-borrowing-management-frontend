// src/pages/StaffDashboard.jsx
import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Box
} from '@mui/material';
import StorageIcon from '@mui/icons-material/Storage';
import PeopleIcon from '@mui/icons-material/People';
import BookOnlineIcon from '@mui/icons-material/BookOnline';
import { useAuth } from '../context/AuthContextDef';

function StaffDashboard() {
  const { currentUser } = useAuth();

  const dashboardItems = [
    {
      title: 'Manage Equipment',
      description: 'Add, edit, and remove equipment from the inventory.',
      path: '/staff/manage-equipment',
      icon: <StorageIcon sx={{ fontSize: 40 }} color="primary" />
    },
    {
      title: 'Manage Users',
      description: 'View all users and manage their roles and permissions.',
      path: '/staff/user-management',
      icon: <PeopleIcon sx={{ fontSize: 40 }} color="primary" />
    },
    {
      title: 'Manage Reservations',
      description: 'View and manage all active and past equipment reservations.',
      path: '/staff/manage-reservations',
      icon: <BookOnlineIcon sx={{ fontSize: 40 }} color="primary" />
    },
  ];

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Staff Dashboard
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 4 }}>
        Welcome back, {currentUser?.email}.
      </Typography>
      <Grid container spacing={3}>
        {dashboardItems.map((item) => (
          <Grid item xs={12} md={6} lg={4} key={item.title}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flexGrow: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  {item.icon}
                  <Typography variant="h6" component="div" sx={{ ml: 2 }}>
                    {item.title}
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  {item.description}
                </Typography>
              </CardContent>
              <CardActions>
                <Button component={RouterLink} to={item.path} size="small">Go to Page</Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}

export default StaffDashboard;
