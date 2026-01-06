// src/pages/ManageEquipment.jsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  Typography,
  Box,
  TextField,
  Button,
  CircularProgress,
  Grid,
  Card,
  CardContent,
  useTheme,
  IconButton,
  Tooltip,
  Paper
} from '@mui/material';
import { DataGrid, gridClasses } from '@mui/x-data-grid';
import { db } from '../firebase';
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { useSnackbar } from '../context/SnackbarContextDef';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import CancelIcon from '@mui/icons-material/Cancel';
import SaveIcon from '@mui/icons-material/Save';

function ManageEquipment() {
  const [equipmentName, setEquipmentName] = useState('');
  const [equipmentDescription, setEquipmentDescription] = useState('');
  const [totalStock, setTotalStock] = useState(1);
  const [equipments, setEquipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [currentEquipmentId, setCurrentEquipmentId] = useState(null);
  const { showSnackbar } = useSnackbar();
  const theme = useTheme();

  const equipmentCollectionRef = collection(db, 'equipments');

  const fetchEquipments = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getDocs(equipmentCollectionRef);
      setEquipments(data.docs.map((doc) => ({ ...doc.data(), id: doc.id })));
    } catch (err) {
      console.error("Error fetching equipments:", err);
      showSnackbar("Failed to load equipment.", 'error');
    } finally {
      setLoading(false);
    }
  }, [equipmentCollectionRef, showSnackbar]);

  useEffect(() => {
    fetchEquipments();
  }, [fetchEquipments]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!equipmentName || !equipmentDescription || totalStock < 0) {
      showSnackbar("Name, description, and a valid stock number are required.", 'error');
      return;
    }

    const equipmentData = {
      name: equipmentName,
      description: equipmentDescription,
      totalStock: Number(totalStock),
    };

    try {
      if (editMode) {
        const equipmentDoc = doc(db, 'equipments', currentEquipmentId);
        await updateDoc(equipmentDoc, equipmentData);
        showSnackbar('Equipment updated successfully!', 'success');
      } else {
        await addDoc(equipmentCollectionRef, { ...equipmentData, createdAt: new Date() });
        showSnackbar('Equipment added successfully!', 'success');
      }
      resetForm();
      fetchEquipments();
    } catch (err) {
      console.error("Error saving equipment:", err);
      showSnackbar("Failed to save equipment.", 'error');
    }
  };

  const handleDelete = async (id) => {
    if(!window.confirm("Are you sure you want to delete this item?")) return;
    try {
      const equipmentDoc = doc(db, 'equipments', id);
      await deleteDoc(equipmentDoc);
      showSnackbar('Equipment deleted successfully.', 'success');
      fetchEquipments();
    } catch (err) {
      console.error("Error deleting equipment:", err);
      showSnackbar("Failed to delete equipment.", 'error');
    }
  };

  const handleEdit = (equipment) => {
    setEditMode(true);
    setCurrentEquipmentId(equipment.id);
    setEquipmentName(equipment.name);
    setEquipmentDescription(equipment.description);
    setTotalStock(equipment.totalStock);
  };

  const resetForm = () => {
    setEditMode(false);
    setCurrentEquipmentId(null);
    setEquipmentName('');
    setEquipmentDescription('');
    setTotalStock(1);
  };

  const columns = [
    { field: 'name', headerName: 'Name', flex: 1, minWidth: 150 },
    { field: 'description', headerName: 'Description', flex: 2, minWidth: 200 },
    {
      field: 'totalStock',
      headerName: 'Stock',
      type: 'number',
      flex: 0.5,
      minWidth: 100,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => (
         <Box sx={{ fontWeight: 'bold', color: params.value > 0 ? 'success.main' : 'error.main' }}>
            {params.value}
         </Box>
      )
    },
    {
      field: 'actions',
      headerName: 'Actions',
      sortable: false,
      flex: 1,
      minWidth: 120,
      align: 'right',
      headerAlign: 'right',
      renderCell: (params) => (
        <Box>
          <Tooltip title="Edit">
             <IconButton onClick={() => handleEdit(params.row)} color="primary" size="small">
                <EditIcon />
             </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
             <IconButton onClick={() => handleDelete(params.row.id)} color="error" size="small">
                <DeleteIcon />
             </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  return (
    <Box>
       <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>Equipment Inventory</Typography>
        <Typography variant="subtitle1" color="text.secondary">Manage available items for borrowing.</Typography>
      </Box>

      <Grid container spacing={4}>
        {/* Form Section */}
        <Grid item xs={12} lg={4}>
          <Paper elevation={0} variant="outlined" sx={{ p: 3, bgcolor: 'background.paper', borderRadius: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                {editMode ? <EditIcon color="primary" sx={{ mr: 1 }}/> : <AddCircleOutlineIcon color="primary" sx={{ mr: 1 }}/>}
                <Typography variant="h6" fontWeight="bold">
                {editMode ? 'Edit Equipment' : 'Add New Item'}
                </Typography>
            </Box>
            
            <Box component="form" onSubmit={handleSubmit}>
              <TextField
                label="Item Name"
                fullWidth
                value={equipmentName}
                onChange={(e) => setEquipmentName(e.target.value)}
                margin="normal"
                required
                variant="outlined"
                size="small"
              />
              <TextField
                label="Description"
                fullWidth
                multiline
                rows={4}
                value={equipmentDescription}
                onChange={(e) => setEquipmentDescription(e.target.value)}
                margin="normal"
                required
                variant="outlined"
                size="small"
              />
              <TextField
                label="Total Stock"
                fullWidth
                type="number"
                value={totalStock}
                onChange={(e) => setTotalStock(e.target.value)}
                margin="normal"
                required
                variant="outlined"
                size="small"
                InputProps={{ inputProps: { min: 0 } }}
              />
              
              <Box sx={{ mt: 3, display: 'flex', gap: 1 }}>
                  <Button 
                    type="submit" 
                    variant="contained" 
                    fullWidth 
                    startIcon={editMode ? <SaveIcon /> : <AddCircleOutlineIcon />}
                  >
                    {editMode ? 'Save Changes' : 'Add Item'}
                  </Button>
                  {editMode && (
                    <Button variant="outlined" color="inherit" fullWidth onClick={resetForm} startIcon={<CancelIcon />}>
                      Cancel
                    </Button>
                  )}
              </Box>
            </Box>
          </Paper>
        </Grid>

        {/* Data Grid Section */}
        <Grid item xs={12} lg={8}>
          <Card sx={{ boxShadow: theme.shadows[2], borderRadius: 2 }}>
            <CardContent sx={{ p: 0 }}>
              <Box sx={{ height: 600, width: '100%' }}>
                <DataGrid
                  rows={equipments}
                  columns={columns}
                  pageSize={10}
                  rowsPerPageOptions={[10]}
                  loading={loading}
                  sx={{
                    border: 'none',
                    '& .MuiDataGrid-columnHeaders': {
                        backgroundColor: theme.palette.grey[50],
                        color: theme.palette.text.primary,
                        fontSize: '0.9rem',
                        fontWeight: 'bold',
                    },
                    [`& .${gridClasses.row}.even`]: {
                        backgroundColor: theme.palette.grey[50],
                    },
                    '& .MuiDataGrid-cell': {
                        borderBottom: `1px solid ${theme.palette.divider}`,
                    }
                  }}
                  components={{
                    LoadingOverlay: CircularProgress,
                  }}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

export default ManageEquipment;
