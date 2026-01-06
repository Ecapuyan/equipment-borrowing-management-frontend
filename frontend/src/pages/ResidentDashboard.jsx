// src/pages/ResidentDashboard.jsx
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
import ViewListIcon from '@mui/icons-material/ViewList';
import BookOnlineIcon from '@mui/icons-material/BookOnline';
import { useAuth } from '../context/AuthContextDef';

function ResidentDashboard() {
  const { currentUser } = useAuth();

  const dashboardItems = [
    {
      title: 'Equipment Catalog',
      description: 'Browse all available equipment and make new reservations.',
      path: '/resident/catalog',
      icon: <ViewListIcon sx={{ fontSize: 40 }} color="primary" />
    },
    {
      title: 'My Reservations',
      description: 'View your active and past equipment reservations.',
      path: '/resident/my-reservations',
      icon: <BookOnlineIcon sx={{ fontSize: 40 }} color="primary" />
    },
  ];

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Resident Dashboard
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 4 }}>
        Welcome, {currentUser?.email}.
      </Typography>
      <Grid container spacing={3}>
        {dashboardItems.map((item) => (
          <Grid item xs={12} md={6} key={item.title}>
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

export default ResidentDashboard;
