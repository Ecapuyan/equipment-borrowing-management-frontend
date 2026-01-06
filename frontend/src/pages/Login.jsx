// src/pages/Login.jsx
import React, { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
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
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useSnackbar } from '../context/SnackbarContextDef';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import EmailIcon from '@mui/icons-material/Email';
import LockIcon from '@mui/icons-material/Lock';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { showSnackbar } = useSnackbar();
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      showSnackbar('Login successful!', 'success');

      let targetPath = '/resident-dashboard'; 
      try {
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          if (userData.role === 'staff') {
            targetPath = '/staff-dashboard';
          }
        }
      } catch (firestoreError) {
        console.error("Error fetching user role:", firestoreError);
      }

      navigate(targetPath, { replace: true });

    } catch (err) {
      console.error("Error during login:", err);
      let errorMessage = 'Failed to sign in.';
      if (err.code === 'auth/invalid-credential') errorMessage = 'Invalid email or password.';
      showSnackbar(errorMessage, 'error');
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
          backgroundColor: (t) => t.palette.primary.main, // Fallback color
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          color: 'white',
          position: 'relative',
          '&::before': { // Overlay
             content: '""',
             position: 'absolute',
             top: 0, left: 0, right: 0, bottom: 0,
             backgroundColor: 'rgba(15, 118, 110, 0.85)' // Primary color with opacity
          }
        }}
      >
         <Box sx={{ position: 'relative', zIndex: 1, textAlign: 'center', p: 4 }}>
             <Typography variant="h2" fontWeight="bold" gutterBottom>
                 Barangay Masambong
             </Typography>
             <Typography variant="h5">
                 Equipment Management System
             </Typography>
         </Box>
      </Grid>

      {/* Right Side - Login Form */}
      <Grid item xs={12} sm={8} md={5} component={Paper} elevation={6} square sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Box
          sx={{
            my: 8,
            mx: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            maxWidth: 450,
            width: '100%'
          }}
        >
          <Box sx={{ mb: 3, textAlign: 'center' }}>
              <Typography component="h1" variant="h4" fontWeight="bold" color="primary">
                Welcome Back
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Please sign in to continue
              </Typography>
          </Box>
          
          <Box component="form" noValidate onSubmit={handleSubmit} sx={{ mt: 1, width: '100%' }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              autoComplete="email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <EmailIcon color="action" />
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type={showPassword ? 'text' : 'password'}
              id="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockIcon color="action" />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            
            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              sx={{ mt: 4, mb: 2, py: 1.5, fontSize: '1.1rem' }}
            >
              Sign In
            </Button>
            
            <Grid container justifyContent="center" sx={{ mt: 2 }}>
              <Grid item>
                <Typography variant="body2" color="text.secondary">
                    Don't have an account? {' '}
                    <Link component={RouterLink} to="/register" variant="body2" fontWeight="bold" underline="hover">
                    Create an Account
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

export default Login;
