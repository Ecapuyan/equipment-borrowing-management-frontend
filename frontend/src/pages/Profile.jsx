// src/pages/Profile.jsx
import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Card,
  CardContent,
  Box,
  Chip,
  TextField,
  Button,
  Grid
} from '@mui/material';
import { useAuth } from '../context/AuthContextDef';
import { useSnackbar } from '../context/SnackbarContextDef';
import { db } from '../firebase';
import { doc, updateDoc, getDoc } from 'firebase/firestore';

function Profile() {
  const { currentUser } = useAuth();
  const { showSnackbar } = useSnackbar();
  const [profile, setProfile] = useState({
    fullName: '',
    address: '',
    phoneNumber: '',
  });

  useEffect(() => {
    const fetchProfile = async () => {
      if (currentUser) {
        const userDocRef = doc(db, 'users', currentUser.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          setProfile(userDoc.data());
        }
      }
    };
    fetchProfile();
  }, [currentUser]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const userDocRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userDocRef, {
        fullName: profile.fullName,
        address: profile.address,
        phoneNumber: profile.phoneNumber,
      });
      showSnackbar('Profile updated successfully!', 'success');
    } catch (error) {
      console.error("Error updating profile: ", error);
      showSnackbar('Failed to update profile.', 'error');
    }
  };

  return (
    <Container maxWidth="md">
      <Card>
        <CardContent>
          <Typography variant="h4" component="h1" gutterBottom>
            My Profile
          </Typography>
          <Box component="form" onSubmit={handleSubmit} noValidate>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Full Name"
                  name="fullName"
                  value={profile.fullName || ''}
                  onChange={handleChange}
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Address"
                  name="address"
                  value={profile.address || ''}
                  onChange={handleChange}
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Phone Number"
                  name="phoneNumber"
                  value={profile.phoneNumber || ''}
                  onChange={handleChange}
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  disabled
                  label="Email"
                  name="email"
                  value={currentUser?.email || ''}
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle1" color="text.secondary">Role</Typography>
                <Chip
                  label={profile.role}
                  color={profile.role === 'staff' ? 'primary' : 'default'}
                  sx={{ textTransform: 'capitalize' }}
                />
              </Grid>
              <Grid item xs={12}>
                <Button type="submit" variant="contained" color="primary">
                  Save Changes
                </Button>
              </Grid>
            </Grid>
          </Box>
        </CardContent>
      </Card>
    </Container>
  );
}

export default Profile;
