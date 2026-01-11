// src/pages/ResidentDashboard.jsx
import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Typography,
  Grid,
  Card,
  CardContent,
  CardActionArea,
  Box,
  Avatar,
  useTheme
} from '@mui/material';
import ViewListIcon from '@mui/icons-material/ViewList';
import BookOnlineIcon from '@mui/icons-material/BookOnline';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import { useAuth } from '../context/AuthContextDef';

function ResidentDashboard() {
  const { currentUser } = useAuth();
  const theme = useTheme();

  const dashboardItems = [
    {
      title: 'Borrow Equipment',
      description: 'Browse the catalog and submit a new borrowing request.',
      path: '/resident/borrow-equipment',
      icon: <ViewListIcon sx={{ fontSize: 32, color: 'white' }} />,
      color: 'linear-gradient(135deg, #0f766e 0%, #0d9488 100%)' // Teal
    },
    {
      title: 'My Reservations',
      description: 'Track the status of your requests and view history.',
      path: '/resident/my-reservations',
      icon: <BookOnlineIcon sx={{ fontSize: 32, color: 'white' }} />,
      color: 'linear-gradient(135deg, #ea580c 0%, #f97316 100%)' // Orange
    },
    {
      title: 'My Profile',
      description: 'Update your personal information and contact details.',
      path: '/profile',
      icon: <AccountCircleIcon sx={{ fontSize: 32, color: 'white' }} />,
      color: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)' // Indigo
    }
  ];

  return (
    <Box>
      <Box sx={{ mb: 5 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
           Resident Portal
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
           Welcome back, <Box component="span" fontWeight="bold" color="primary.main">{currentUser?.email?.split('@')[0]}</Box>. What would you like to do today?
        </Typography>
      </Box>

      <Grid container spacing={2}>
        {dashboardItems.map((item) => (
          <Grid item xs={12} sm={6} md={4} key={item.title}>
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
    </Box>
  );
}

export default ResidentDashboard;
