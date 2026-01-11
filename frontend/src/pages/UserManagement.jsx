// src/pages/UserManagement.jsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  Typography,
  Box,
  CircularProgress,
  Select,
  MenuItem,
  Card,
  CardContent,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { db } from '../firebase';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { useSnackbar } from '../context/SnackbarContextDef';

function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showSnackbar } = useSnackbar();

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    const timeout = setTimeout(() => {
        setLoading(false);
        showSnackbar("Request timed out. Please check your connection.", "error");
    }, 10000); // 10s timeout safety

    try {
      console.log("Fetching users...");
      const usersCollectionRef = collection(db, 'users');
      const data = await getDocs(usersCollectionRef);
      console.log("Users fetched:", data.docs.length);
      setUsers(data.docs.map((doc) => ({ ...doc.data(), id: doc.id })));
    } catch (err) {
      console.error("Error fetching users:", err);
      showSnackbar("Failed to load users: " + err.message, "error");
    } finally {
      clearTimeout(timeout);
      setLoading(false);
    }
  }, [showSnackbar]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleRoleChange = async (userId, newRole) => {
    try {
      const userDoc = doc(db, 'users', userId);
      await updateDoc(userDoc, { role: newRole });
      setUsers(users.map((user) => (user.id === userId ? { ...user, role: newRole } : user)));
      showSnackbar("User role updated successfully.", "success");
    } catch (err) {
      console.error("Error updating user role:", err);
      showSnackbar("Failed to update user role.", "error");
    }
  };

  const columns = [
    { field: 'email', headerName: 'Email', flex: 2 },
    {
      field: 'role',
      headerName: 'Role',
      flex: 1,
      renderCell: (params) => (
        <Select
          value={params.value || 'resident'}
          onChange={(e) => handleRoleChange(params.row.id, e.target.value)}
          sx={{ width: '100%' }}
          size="small"
        >
          <MenuItem value={'resident'}>Resident</MenuItem>
          <MenuItem value={'staff'}>Staff</MenuItem>
        </Select>
      ),
    },
    {
      field: 'createdAt',
      headerName: 'Date Joined',
      flex: 1,
      renderCell: (params) => (
        params.value ? new Date(params.value.seconds * 1000).toLocaleDateString() : 'N/A'
      ),
    },
  ];

  return (
    <Card>
      <CardContent>
        <Typography variant="h5" gutterBottom>
          User Management
        </Typography>
        <Box sx={{ height: 650, width: '100%' }}>
          <DataGrid
            rows={users}
            columns={columns}
            pageSize={10}
            rowsPerPageOptions={[10]}
            loading={loading}
            components={{
              LoadingOverlay: CircularProgress,
            }}
          />
        </Box>
      </CardContent>
    </Card>
  );
}

export default UserManagement;
