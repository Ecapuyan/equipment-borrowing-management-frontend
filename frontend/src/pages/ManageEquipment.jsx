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
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { db } from '../firebase';
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { useSnackbar } from '../context/SnackbarContextDef';

function ManageEquipment() {
  const [equipmentName, setEquipmentName] = useState('');
  const [equipmentDescription, setEquipmentDescription] = useState('');
  const [totalStock, setTotalStock] = useState(1);
  const [equipments, setEquipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [currentEquipmentId, setCurrentEquipmentId] = useState(null);
  const { showSnackbar } = useSnackbar();

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
    { field: 'name', headerName: 'Name', flex: 1 },
    { field: 'description', headerName: 'Description', flex: 2 },
    {
      field: 'totalStock',
      headerName: 'Total Stock',
      type: 'number',
      flex: 0.5,
    },
    {
      field: 'actions',
      headerName: 'Actions',
      sortable: false,
      flex: 1,
      renderCell: (params) => (
        <Box>
          <Button onClick={() => handleEdit(params.row)} size="small">Edit</Button>
          <Button onClick={() => handleDelete(params.row.id)} size="small" color="secondary">Delete</Button>
        </Box>
      ),
    },
  ];

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} lg={4}>
        <Card>
          <CardContent>
            <Typography variant="h5" gutterBottom>
              {editMode ? 'Edit Equipment' : 'Add New Equipment'}
            </Typography>
            <Box component="form" onSubmit={handleSubmit}>
              <TextField
                label="Equipment Name"
                fullWidth
                value={equipmentName}
                onChange={(e) => setEquipmentName(e.target.value)}
                margin="normal"
                required
              />
              <TextField
                label="Description"
                fullWidth
                multiline
                rows={3}
                value={equipmentDescription}
                onChange={(e) => setEquipmentDescription(e.target.value)}
                margin="normal"
                required
              />
              <TextField
                label="Total Stock"
                fullWidth
                type="number"
                value={totalStock}
                onChange={(e) => setTotalStock(e.target.value)}
                margin="normal"
                required
                InputProps={{ inputProps: { min: 0 } }}
              />
              <Button type="submit" variant="contained" color="primary" sx={{ mt: 2 }}>
                {editMode ? 'Update Equipment' : 'Add Equipment'}
              </Button>
              {editMode && (
                <Button variant="outlined" sx={{ mt: 2, ml: 2 }} onClick={resetForm}>
                  Cancel
                </Button>
              )}
            </Box>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} lg={8}>
        <Card>
          <CardContent>
            <Typography variant="h5" gutterBottom>
              Current Equipment
            </Typography>
            <Box sx={{ height: 600, width: '100%' }}>
              <DataGrid
                rows={equipments}
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
      </Grid>
    </Grid>
  );
}

export default ManageEquipment;
