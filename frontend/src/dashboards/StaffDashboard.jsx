import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import ManageEquipment from '../components/ManageEquipment';
import ManageReservations from '../components/ManageReservations';
import { Container, Box, Typography, Tabs, Tab, Button } from '@mui/material';

const StaffDashboard = () => {
    const [activeTab, setActiveTab] = useState(0);

    const handleChange = (event, newValue) => {
        setActiveTab(newValue);
    };

    return (
        <Container component="main" maxWidth="lg">
            <Box sx={{ marginTop: 8 }}>
                <Typography component="h1" variant="h4" gutterBottom>
                    Staff Dashboard
                </Typography>
                <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                    <Tabs value={activeTab} onChange={handleChange} aria-label="staff dashboard tabs">
                        <Tab label="Manage Reservations" />
                        <Tab label="Manage Equipment" />
                    </Tabs>
                    <Button
                        component={Link}
                        to="/reports"
                        variant="contained"
                        sx={{ m: 1, position: 'absolute', top: 80, right: 20 }}
                    >
                        Reports
                    </Button>
                </Box>
                <Box sx={{ p: 3 }}>
                    {activeTab === 0 && <ManageReservations />}
                    {activeTab === 1 && <ManageEquipment />}
                </Box>
            </Box>
        </Container>
    );
};

export default StaffDashboard;