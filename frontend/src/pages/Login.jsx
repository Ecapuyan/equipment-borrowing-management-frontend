import React, { useState } from 'react';
import axiosInstance from '../api/axios';
import { useNavigate, Link } from 'react-router-dom';
import { Container, Box, Typography, TextField, Button, Alert } from '@mui/material';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = (e) => {
        e.preventDefault();
        axiosInstance.post('/auth/login', {
            username,
            password
        })
        .then(res => {
            if (res.data.token) {
                localStorage.setItem('token', res.data.token);
                localStorage.setItem('user', JSON.stringify(res.data.user));
                const token = res.data.token;
                let userRole = null;
                if (token) {
                    try {
                        userRole = JSON.parse(atob(token.split('.')[1])).role;
                    } catch (e) {
                        console.error('Invalid token:', e);
                        localStorage.removeItem('token');
                        setError('Invalid token received from server.');
                        return;
                    }
                }

                if (userRole === 'borrower') {
                    navigate('/borrower');
                } else if (userRole === 'staff') {
                    navigate('/staff');
                } else if (userRole === 'superadmin') {
                    navigate('/superadmin');
                } else {
                    navigate('/login');
                }
            }
        })
        .catch(err => {
            console.log('Login error:', err.response?.data || err.message);
            setError(err.response?.data?.message || 'An error occurred during login.');
        });
    };

    return (
        <Container component="main" maxWidth="xs">
            <Box
                sx={{
                    marginTop: 8,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                }}
            >
                <Typography component="h1" variant="h5">
                    Login
                </Typography>
                <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
                    {error && <Alert severity="error">{error}</Alert>}
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        id="username"
                        label="Username"
                        name="username"
                        autoComplete="username"
                        autoFocus
                        value={username}
                        onChange={e => setUsername(e.target.value)}
                    />
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        name="password"
                        label="Password"
                        type="password"
                        id="password"
                        autoComplete="current-password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                    />
                    <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        sx={{ mt: 3, mb: 2 }}
                    >
                        Login
                    </Button>
                    <Link to="/register" variant="body2">
                        {"Don't have an account? Sign Up"}
                    </Link>
                </Box>
            </Box>
        </Container>
    );
};

export default Login;
