// src/pages/UserManagement.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Typography,
  Box,
  CircularProgress,
  Select,
  MenuItem,
  Card,
  CardContent,
  TextField,
  InputAdornment,
  Grid,
  Avatar,
  Chip,
  Divider,
  useTheme,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemText
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { db } from '../firebase';
import { collection, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { useSnackbar } from '../context/SnackbarContextDef';
import { useAuth } from '../context/AuthContextDef';
import SearchIcon from '@mui/icons-material/Search';
import PersonIcon from '@mui/icons-material/Person';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import GroupIcon from '@mui/icons-material/Group';
import DeleteIcon from '@mui/icons-material/Delete';
import BlockIcon from '@mui/icons-material/Block';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';
import SupervisorAccountIcon from '@mui/icons-material/SupervisorAccount';
import VisibilityIcon from '@mui/icons-material/Visibility';

function StatCard({ title, value, icon, color }) {
    return (
        <Card sx={{ height: '100%', borderLeft: `5px solid ${color}`, borderRadius: 2, boxShadow: 2 }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2, '&:last-child': { pb: 2 } }}>
                <Box>
                    <Typography color="text.secondary" variant="caption" fontWeight="bold" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        {title}
                    </Typography>
                    <Typography variant="h4" fontWeight="bold" sx={{ mt: 0.5 }}>
                        {value}
                    </Typography>
                </Box>
                <Box sx={{ 
                    bgcolor: `${color}15`, 
                    p: 1, 
                    borderRadius: '50%', 
                    display: 'flex', 
                    color: color 
                }}>
                    {icon}
                </Box>
            </CardContent>
        </Card>
    );
}

function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { showSnackbar } = useSnackbar();
  const { currentUser } = useAuth();
  const theme = useTheme();
  
  const [selectedUser, setSelectedUser] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  
  const isStaff = currentUser.role === 'staff';

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const usersCollectionRef = collection(db, 'users');
      const data = await getDocs(usersCollectionRef);
      setUsers(data.docs.map((doc) => ({ ...doc.data(), id: doc.id })));
    } catch (err) {
      showSnackbar("Failed to load users: " + err.message, "error");
    } finally {
      setLoading(false);
    }
  }, [showSnackbar]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleRoleChange = async (userId, newRole) => {
    if (isStaff) {
        showSnackbar("You do not have permission to change user roles.", "error");
        return;
    }
    // ... (rest of the function is for admin)
    if (userId === currentUser.uid) {
        showSnackbar("You cannot change your own role.", "warning");
        return;
    }
    try {
      const userDoc = doc(db, 'users', userId);
      await updateDoc(userDoc, { role: newRole });
      setUsers(users.map((user) => (user.id === userId ? { ...user, role: newRole } : user)));
      showSnackbar("User role updated successfully.", "success");
    } catch (err) {
      showSnackbar("Failed to update user role. You may not have permission.", "error");
    }
  };

  const handleBanUser = async (user) => {
      // ... (admin only function)
      if (user.id === currentUser.uid) {
        showSnackbar("You cannot ban yourself.", "warning");
        return;
      }
      const newStatus = user.status === 'banned' ? 'active' : 'banned';
      if (!window.confirm(`Are you sure you want to ${newStatus === 'banned' ? 'ban' : 'unban'} this user?`)) return;

      try {
          await updateDoc(doc(db, 'users', user.id), { status: newStatus });
          setUsers(users.map(u => u.id === user.id ? { ...u, status: newStatus } : u));
          showSnackbar(`User ${newStatus === 'banned' ? 'banned' : 'unbanned'} successfully.`, 'success');
      } catch (err) {
          showSnackbar("Failed to update user status.", "error");
      }
  };

  const handleDeleteUser = async (userId) => {
      // ... (admin only function)
      if (userId === currentUser.uid) {
        showSnackbar("You cannot delete your own account.", "warning");
        return;
      }
      if (!window.confirm("Are you sure you want to permanently delete this user? This action cannot be undone.")) return;

      try {
          await deleteDoc(doc(db, 'users', userId));
          setUsers(users.filter(u => u.id !== userId));
          showSnackbar("User deleted successfully.", "success");
      } catch (err) {
          showSnackbar("Failed to delete user.", "error");
      }
  };

  const handleViewUser = (user) => {
      setSelectedUser(user);
      setModalOpen(true);
  };

  const handleCloseModal = () => {
      setModalOpen(false);
      setSelectedUser(null);
  };

  const filteredUsers = users.filter(user => 
    (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const stats = useMemo(() => {
      const total = users.length;
      const admins = users.filter(u => u.role === 'admin').length;
      const staff = users.filter(u => u.role === 'staff').length;
      const residents = users.filter(u => u.role === 'resident').length;
      return { total, admins, staff, residents };
  }, [users]);

  const columns = [
    { field: 'email', headerName: 'Email', flex: 2 },
    {
      field: 'role',
      headerName: 'Role',
      flex: 1,
      renderCell: (params) => (
        isStaff ? <Chip label={params.value || 'resident'} size="small" sx={{textTransform: 'capitalize'}} /> :
        <Select
          value={params.value || 'resident'}
          onChange={(e) => handleRoleChange(params.row.id, e.target.value)}
          sx={{ width: '100%' }}
          size="small"
          disabled={params.row.id === currentUser.uid || params.row.role === 'admin'}
        >
          <MenuItem value={'resident'}>Resident</MenuItem>
          <MenuItem value={'staff'}>Staff</MenuItem>
          <MenuItem value={'admin'} disabled>Admin</MenuItem>
        </Select>
      ),
    },
    {
        field: 'status',
        headerName: 'Status',
        flex: 0.8,
        renderCell: (params) => (
            <Chip 
                label={params.row.status === 'banned' ? 'Banned' : 'Active'} 
                color={params.row.status === 'banned' ? 'error' : 'success'}
                size="small"
                variant="outlined"
            />
        )
    },
    {
      field: 'createdAt',
      headerName: 'Date Joined',
      flex: 1,
      renderCell: (params) => (
        params.value ? new Date(params.value.seconds * 1000).toLocaleDateString() : 'N/A'
      ),
    },
    {
        field: 'actions',
        headerName: 'Actions',
        flex: 1.5,
        sortable: false,
        align: 'right',
        headerAlign: 'right',
        renderCell: (params) => (
            <Button 
                variant="outlined" 
                size="small" 
                startIcon={isStaff ? <VisibilityIcon /> : <ManageAccountsIcon />}
                onClick={() => handleViewUser(params.row)}
                sx={{ textTransform: 'none' }}
                disabled={params.row.id === currentUser.uid && !isStaff}
            >
                {isStaff ? 'View Details' : 'Manage Account'}
            </Button>
        )
    }
  ];

  return (
    <Box>
       <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>{isStaff ? 'User Directory' : 'User Management'}</Typography>
        <Typography variant="subtitle1" color="text.secondary">{isStaff ? 'View user information.' : 'Manage system access and user roles.'}</Typography>
      </Box>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item sx={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard title="Total Users" value={stats.total} icon={<GroupIcon fontSize="large" />} color={theme.palette.primary.main}/>
        </Grid>
        <Grid item sx={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard title="Admins" value={stats.admins} icon={<SupervisorAccountIcon fontSize="large" />} color={theme.palette.error.main}/>
        </Grid>
        <Grid item sx={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard title="Staff" value={stats.staff} icon={<AdminPanelSettingsIcon fontSize="large" />} color={theme.palette.secondary.main}/>
        </Grid>
        <Grid item sx={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard title="Residents" value={stats.residents} icon={<PersonIcon fontSize="large" />} color={theme.palette.info.main}/>
        </Grid>
      </Grid>

      <Card sx={{ borderRadius: 2 }}>
        <CardContent sx={{ p: 3 }}>
          
          <TextField
            fullWidth
            variant="outlined"
            size="small"
            placeholder="Search by email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ mb: 3 }}
            InputProps={{ startAdornment: (<InputAdornment position="start"><SearchIcon color="action" /></InputAdornment>), }}
          />

          <Box sx={{ height: 650, width: '100%' }}>
            <DataGrid
                rows={filteredUsers}
                columns={columns}
                pageSize={10}
                rowsPerPageOptions={[10]}
                loading={loading}
                disableSelectionOnClick
                components={{ LoadingOverlay: CircularProgress }}
            />
          </Box>
        </CardContent>
      </Card>

      <Dialog open={modalOpen} onClose={handleCloseModal} fullWidth maxWidth="sm">
        <DialogTitle fontWeight="bold">{isStaff ? 'User Details' : 'Manage User Account'}</DialogTitle>
        <DialogContent dividers>
            {selectedUser && (
                <Box>
                    <List>
                        <ListItem><ListItemText primary="Email" secondary={selectedUser.email} /></ListItem>
                        <ListItem><ListItemText primary="User ID" secondary={selectedUser.id} /></ListItem>
                         <ListItem>
                            <ListItemText primary="Role" secondary={<Chip label={selectedUser.role || 'Resident'} size="small" color={selectedUser.role === 'admin' ? 'error' : selectedUser.role === 'staff' ? 'secondary' : 'default'} sx={{textTransform: 'capitalize'}}/>} />
                        </ListItem>
                        <ListItem>
                            <ListItemText primary="Account Status" secondary={<Chip label={selectedUser.status === 'banned' ? 'Banned' : 'Active'} color={selectedUser.status === 'banned' ? 'error' : 'success'} size="small" />} />
                        </ListItem>
                        <ListItem>
                            <ListItemText primary="Date Joined" secondary={selectedUser.createdAt ? new Date(selectedUser.createdAt.seconds * 1000).toLocaleString() : 'Unknown'} />
                        </ListItem>
                    </List>
                </Box>
            )}
        </DialogContent>
        <DialogActions sx={{ p: 2, justifyContent: 'space-between' }}>
            {!isStaff &&
                <Box>
                    <Button color="error" startIcon={<DeleteIcon />} onClick={() => { handleDeleteUser(selectedUser.id); handleCloseModal(); }}>
                        Delete User
                    </Button>
                </Box>
            }
            <Box sx={{ display: 'flex', gap: 1 }}>
                {!isStaff &&
                    <Button 
                        color={selectedUser?.status === 'banned' ? "success" : "warning"}
                        variant="outlined"
                        startIcon={selectedUser?.status === 'banned' ? <CheckCircleIcon /> : <BlockIcon />}
                        onClick={() => {
                            handleBanUser(selectedUser);
                            setSelectedUser(prev => ({ ...prev, status: prev.status === 'banned' ? 'active' : 'banned' }));
                        }}
                    >
                        {selectedUser?.status === 'banned' ? "Unban" : "Ban"}
                    </Button>
                }
                <Button onClick={handleCloseModal} variant="contained">Close</Button>
            </Box>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default UserManagement;
