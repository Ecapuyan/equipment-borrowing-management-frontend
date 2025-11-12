import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Container, Box } from '@mui/material';

const BorrowerLayout = () => {
    const navigate = useNavigate();

    // The logout handler is kept in case the user wants a logout button elsewhere.
    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    return (
        <Box sx={{ width: '100%' }}>
            <Container component="main" sx={{ py: 4 }}>
                <Outlet />
            </Container>
        </Box>
    );
};

export default BorrowerLayout;
