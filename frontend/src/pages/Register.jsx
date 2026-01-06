// src/pages/Register.jsx
import React, { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Container,
  Typography,
  TextField,
  Button,
  Box,
  Card,
  CardContent,
  Grid,
  Link,
  Paper,
  InputAdornment,
  IconButton
} from '@mui/material';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';
import { useSnackbar } from '../context/SnackbarContextDef';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import PersonIcon from '@mui/icons-material/Person';
import EmailIcon from '@mui/icons-material/Email';
import HomeIcon from '@mui/icons-material/Home';
import PhoneIcon from '@mui/icons-material/Phone';
import LockIcon from '@mui/icons-material/Lock';

function Register() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    address: '',
    phoneNumber: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const { showSnackbar } = useSnackbar();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!formData.email || !formData.password || !formData.fullName) {
      showSnackbar('Please fill in all required fields.', 'error');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      showSnackbar('Passwords do not match.', 'error');
      return;
    }
    if (formData.password.length < 6) {
      showSnackbar('Password should be at least 6 characters.', 'error');
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;

      await setDoc(doc(db, 'users', user.uid), {
        email: user.email,
        fullName: formData.fullName,
        address: formData.address,
        phoneNumber: formData.phoneNumber,
        role: 'resident',
        createdAt: new Date(),
      });

      showSnackbar('Registration successful! Redirecting...', 'success');
    } catch (err) {
      showSnackbar('Failed to register. This email may already be in use.', 'error');
      console.error("Error during registration:", err);
    }
  };

  return (
    <Grid container component="main" sx={{ height: '100vh' }}>
       {/* Left Side - Brand / Image */}
       <Grid
        item
        xs={false}
        sm={4}
        md={7}
        sx={{
          backgroundImage: 'url(https://source.unsplash.com/random?community,park)',
          backgroundRepeat: 'no-repeat',
          backgroundColor: (t) => t.palette.primary.main,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          color: 'white',
          position: 'relative',
          '&::before': {
             content: '""',
             position: 'absolute',
             top: 0, left: 0, right: 0, bottom: 0,
             backgroundColor: 'rgba(15, 118, 110, 0.85)'
          }
        }}
      >
         <Box sx={{ position: 'relative', zIndex: 1, textAlign: 'center', p: 4 }}>
             <Typography variant="h2" fontWeight="bold" gutterBottom>
                 Join the Community
             </Typography>
             <Typography variant="h5">
                 Register for Equipment Borrowing
             </Typography>
         </Box>
      </Grid>

      {/* Right Side - Register Form */}
      <Grid item xs={12} sm={8} md={5} component={Paper} elevation={6} square sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Box
          sx={{
            my: 8,
            mx: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            maxWidth: 600,
            width: '100%'
          }}
        >
          <Box sx={{ mb: 3, textAlign: 'center' }}>
              <Typography component="h1" variant="h4" fontWeight="bold" color="primary">
                Create Account
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Enter your details to get started
              </Typography>
          </Box>

          <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1, width: '100%' }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  id="fullName"
                  label="Full Name"
                  name="fullName"
                  autoComplete="name"
                  autoFocus
                  value={formData.fullName}
                  onChange={handleChange}
                  InputProps={{
                    startAdornment: (<InputAdornment position="start"><PersonIcon color="action" /></InputAdornment>),
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  id="email"
                  label="Email Address"
                  name="email"
                  autoComplete="email"
                  value={formData.email}
                  onChange={handleChange}
                  InputProps={{
                    startAdornment: (<InputAdornment position="start"><EmailIcon color="action" /></InputAdornment>),
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  id="address"
                  label="Address"
                  name="address"
                  autoComplete="street-address"
                  value={formData.address}
                  onChange={handleChange}
                  InputProps={{
                    startAdornment: (<InputAdornment position="start"><HomeIcon color="action" /></InputAdornment>),
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  id="phoneNumber"
                  label="Phone Number"
                  name="phoneNumber"
                  autoComplete="tel"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  InputProps={{
                    startAdornment: (<InputAdornment position="start"><PhoneIcon color="action" /></InputAdornment>),
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  name="password"
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  autoComplete="new-password"
                  value={formData.password}
                  onChange={handleChange}
                  InputProps={{
                    startAdornment: (<InputAdornment position="start"><LockIcon color="action" /></InputAdornment>),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  name="confirmPassword"
                  label="Confirm Password"
                  type={showPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  InputProps={{
                    startAdornment: (<InputAdornment position="start"><LockIcon color="action" /></InputAdornment>),
                  }}
                />
              </Grid>
            </Grid>

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              sx={{ mt: 4, mb: 2, py: 1.5, fontSize: '1.1rem' }}
            >
              Sign Up
            </Button>
            
            <Grid container justifyContent="center" sx={{ mt: 2 }}>
              <Grid item>
                <Typography variant="body2" color="text.secondary">
                    Already have an account? {' '}
                    <Link component={RouterLink} to="/login" variant="body2" fontWeight="bold" underline="hover">
                    Sign In
                    </Link>
                </Typography>
              </Grid>
            </Grid>
          </Box>
        </Box>
      </Grid>
    </Grid>
  );
}

export default Register;
