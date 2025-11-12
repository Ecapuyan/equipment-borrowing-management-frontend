import React from 'react';
import { Typography, Box, Paper, Grid } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

const BorrowerHome = () => {
    // Attempt to get user info from localStorage
    let user = null;
    const userStr = localStorage.getItem('user');
    if (userStr) {
        try {
            user = JSON.parse(userStr);
        } catch (e) {
            console.error("Failed to parse user data from localStorage", e);
        }
    }

    const welcomeMessage = user ? `Welcome, ${user.firstName} ${user.lastName}!` : 'Welcome!';

    return (
        <Box>
            <Typography variant="h4" gutterBottom>
                {welcomeMessage}
            </Typography>
            <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 4 }}>
                Here you can manage your equipment reservations.
            </Typography>
            <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                    <Paper 
                        component={RouterLink} 
                        to="borrow-equipment"
                        sx={{ 
                            p: 3, 
                            display: 'flex', 
                            flexDirection: 'column', 
                            alignItems: 'center', 
                            textDecoration: 'none',
                            '&:hover': {
                                backgroundColor: 'action.hover'
                            }
                        }}
                    >
                        <Typography variant="h6" color="primary">Borrow New Equipment</Typography>
                        <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 1 }}>
                            Browse available equipment and create a new reservation for your upcoming event.
                        </Typography>
                    </Paper>
                </Grid>
                <Grid item xs={12} md={6}>
                    <Paper 
                        component={RouterLink} 
                        to="my-reservations"
                        sx={{ 
                            p: 3, 
                            display: 'flex', 
                            flexDirection: 'column', 
                            alignItems: 'center', 
                            textDecoration: 'none',
                            '&:hover': {
                                backgroundColor: 'action.hover'
                            }
                        }}
                    >
                        <Typography variant="h6" color="primary">View My Reservations</Typography>
                        <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 1 }}>
                            Check the status of your current reservations, view details, and see your reservation history.
                        </Typography>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
};

export default BorrowerHome;
