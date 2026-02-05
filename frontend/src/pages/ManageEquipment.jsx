// src/pages/ManageEquipment.jsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  Typography, Box, TextField, Button, CircularProgress, Grid, Card, CardContent,
  useTheme, IconButton, Tooltip, Paper, Modal, Fade, Backdrop, List, ListItem, ListItemText, Divider,
  InputAdornment, Chip, Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import { DataGrid, gridClasses } from '@mui/x-data-grid';
import { db } from '../firebase';
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc, Timestamp, query, where, orderBy } from 'firebase/firestore';
import { useAuth } from '../context/AuthContextDef';
import { useSnackbar } from '../context/SnackbarContextDef';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import CancelIcon from '@mui/icons-material/Cancel';
import SaveIcon from '@mui/icons-material/Save';
import HistoryIcon from '@mui/icons-material/History';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import SearchIcon from '@mui/icons-material/Search';
import WarningIcon from '@mui/icons-material/Warning';
import ManageIcon from '@mui/icons-material/ManageAccounts'; // Reusing the icon for consistency

const historyModalStyle = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: { xs: '90%', sm: 600 },
  bgcolor: 'background.paper',
  boxShadow: 24,
  p: 4,
  borderRadius: 2,
  maxHeight: '80vh',
  overflowY: 'auto'
};

function ManageEquipment() {
  const { currentUser } = useAuth();
  const [equipmentName, setEquipmentName] = useState('');
  const [equipmentDescription, setEquipmentDescription] = useState('');
  const [totalStock, setTotalStock] = useState(1);
  const [adjustmentReason, setAdjustmentReason] = useState(''); // New field for audit trail
  const [equipments, setEquipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [currentEquipmentId, setCurrentEquipmentId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  
  // History Modal State
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [selectedItemHistory, setSelectedItemHistory] = useState([]);
  const [selectedItemName, setSelectedItemName] = useState('');
  const [historyLoading, setHistoryLoading] = useState(false);

  const { showSnackbar } = useSnackbar();
  const theme = useTheme();

  const fetchEquipments = useCallback(async () => {
    setLoading(true);
    try {
      const equipmentCollectionRef = collection(db, 'equipments');
      const data = await getDocs(equipmentCollectionRef);
      setEquipments(data.docs.map((doc) => ({ ...doc.data(), id: doc.id })));
    } catch (err) {
      console.error("Error fetching equipments:", err);
      showSnackbar("Failed to load equipment.", 'error');
    } finally {
      setLoading(false);
    }
  }, [showSnackbar]);

  useEffect(() => {
    fetchEquipments();
  }, [fetchEquipments]);

  const filteredEquipments = equipments.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const fetchHistory = async (equipmentId, equipmentName) => {
    setHistoryLoading(true);
    setSelectedItemName(equipmentName);
    setHistoryModalOpen(true);
    try {
        const q = query(
            collection(db, 'inventory_logs'), 
            where('equipmentId', '==', equipmentId)
        );
        const querySnapshot = await getDocs(q);
        const logs = querySnapshot.docs
            .map(doc => ({ ...doc.data(), id: doc.id }))
            .sort((a, b) => {
                const timeA = a.timestamp?.toMillis() || 0;
                const timeB = b.timestamp?.toMillis() || 0;
                return timeB - timeA;
            });
        setSelectedItemHistory(logs);
    } catch (err) {
        console.error("Error fetching history:", err);
        showSnackbar("Failed to load history.", "error");
    } finally {
        setHistoryLoading(false);
    }
  };

  const logInventoryChange = async (equipmentId, equipmentName, oldStock, newStock, reason, type) => {
    try {
        await addDoc(collection(db, 'inventory_logs'), {
            equipmentId,
            equipmentName,
            oldStock: Number(oldStock),
            newStock: Number(newStock),
            changeAmount: Number(newStock) - Number(oldStock),
            type, // 'creation', 'adjustment', 'correction'
            reason: reason || 'Manual update',
            updatedBy: currentUser?.email || 'Unknown User',
            timestamp: Timestamp.now()
        });
    } catch (err) {
        console.error("Error logging inventory change:", err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!equipmentName || !equipmentDescription || totalStock < 0) {
      showSnackbar("Name, description, and a valid stock number are required.", 'error');
      return;
    }

    const newStockVal = Number(totalStock);

    try {
      if (editMode) {
        const existingItem = equipments.find(e => e.id === currentEquipmentId);
        const oldStock = existingItem ? existingItem.totalStock : 0;

        // Only update if changes were made
        const equipmentDoc = doc(db, 'equipments', currentEquipmentId);
        await updateDoc(equipmentDoc, {
            name: equipmentName,
            description: equipmentDescription,
            totalStock: newStockVal
        });

        // Log if stock changed
        if (oldStock !== newStockVal) {
            await logInventoryChange(
                currentEquipmentId, 
                equipmentName, 
                oldStock, 
                newStockVal, 
                adjustmentReason, 
                'adjustment'
            );
        }

        showSnackbar('Equipment updated successfully!', 'success');
      } else {
        const equipmentCollectionRef = collection(db, 'equipments');
        const docRef = await addDoc(equipmentCollectionRef, { 
            name: equipmentName, 
            description: equipmentDescription, 
            totalStock: newStockVal,
            createdAt: Timestamp.now() 
        });

        // Log creation
        await logInventoryChange(
            docRef.id, 
            equipmentName, 
            0, 
            newStockVal, 
            'Initial Stock', 
            'creation'
        );

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
    setAdjustmentReason(''); // Reset reason
    setFormOpen(true);
  };

  const handleAddNew = () => {
      resetForm();
      setFormOpen(true);
  };

  const resetForm = () => {
    setEditMode(false);
    setCurrentEquipmentId(null);
    setEquipmentName('');
    setEquipmentDescription('');
    setTotalStock(1);
    setAdjustmentReason('');
    setFormOpen(false);
  };

  const columns = [
    { field: 'name', headerName: 'Name', flex: 1, minWidth: 150 },
    { field: 'description', headerName: 'Description', flex: 2, minWidth: 200 },
    {
      field: 'totalStock',
      headerName: 'Stock',
      type: 'number',
      flex: 0.5,
      minWidth: 120,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => (
         <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
            <Typography fontWeight="bold" color={params.value > 0 ? 'success.main' : 'error.main'}>
                {params.value}
            </Typography>
            {params.value < 5 && params.value > 0 && (
                <Tooltip title="Low Stock">
                    <WarningIcon color="warning" fontSize="small" />
                </Tooltip>
            )}
         </Box>
      )
    },
    {
      field: 'actions',
      headerName: 'Actions',
      sortable: false,
      flex: 1,
      minWidth: 150,
      align: 'right',
      headerAlign: 'right',
      renderCell: (params) => (
        <Button 
            variant="outlined" 
            size="small" 
            startIcon={<ManageIcon />} 
            onClick={() => handleEdit(params.row)}
            sx={{ textTransform: 'none' }}
        >
            Manage
        </Button>
      ),
    },
  ];

  return (
    <Box>
       <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
        <Box>
            <Typography variant="h4" fontWeight="bold" gutterBottom>Equipment Inventory</Typography>
            <Typography variant="subtitle1" color="text.secondary">Manage available items and track stock history.</Typography>
        </Box>
        <Button 
            variant="contained" 
            startIcon={<AddCircleOutlineIcon />} 
            onClick={handleAddNew}
            size="large"
            sx={{ width: { xs: '100%', sm: 'auto' } }}
        >
            Add New Equipment
        </Button>
      </Box>

      <Card sx={{ boxShadow: theme.shadows[2], borderRadius: 2 }}>
        <CardContent sx={{ p: 2 }}>
            
            {/* Search Bar */}
            <TextField
            fullWidth
            variant="outlined"
            size="small"
            placeholder="Search equipment..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ mb: 2 }}
            InputProps={{
                startAdornment: (
                    <InputAdornment position="start">
                        <SearchIcon color="action" />
                    </InputAdornment>
                ),
            }}
            />

            {/* Desktop View (DataGrid) */}
            <Box sx={{ height: 600, width: '100%', display: { xs: 'none', md: 'block' } }}>
            <DataGrid
                rows={filteredEquipments}
                columns={columns}
                pageSize={10}
                rowsPerPageOptions={[10]}
                loading={loading}
                disableSelectionOnClick
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

            {/* Mobile View (Cards) */}
            <Box sx={{ display: { xs: 'block', md: 'none' } }}>
                {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                    <CircularProgress />
                </Box>
                ) : filteredEquipments.length === 0 ? (
                <Typography align="center" color="text.secondary" sx={{ py: 3 }}>
                    No equipment found.
                </Typography>
                ) : (
                filteredEquipments.map((item) => (
                    <Card key={item.id} variant="outlined" sx={{ mb: 2 }}>
                        <CardContent>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                                <Typography variant="h6" fontWeight="bold">
                                    {item.name}
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    {item.totalStock < 5 && item.totalStock > 0 && <WarningIcon color="warning" fontSize="small"/>}
                                    <Chip 
                                        label={`Stock: ${item.totalStock}`} 
                                        color={item.totalStock > 0 ? 'success' : 'error'} 
                                        size="small" 
                                    />
                                </Box>
                            </Box>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                {item.description}
                            </Typography>
                            <Divider sx={{ my: 1 }} />
                            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                                <Button 
                                    variant="outlined" 
                                    size="small" 
                                    startIcon={<ManageIcon />} 
                                    onClick={() => handleEdit(item)}
                                    fullWidth
                                >
                                    Manage
                                </Button>
                            </Box>
                        </CardContent>
                    </Card>
                ))
                )}
            </Box>

        </CardContent>
      </Card>

      {/* Add/Edit Equipment Dialog */}
      <Dialog open={formOpen} onClose={resetForm} fullWidth maxWidth="sm">
        <DialogTitle fontWeight="bold">
             {editMode ? 'Manage Equipment' : 'Add New Equipment'}
        </DialogTitle>
        <DialogContent dividers>
             <Box component="form" sx={{ mt: 1 }}>
                <TextField
                    label="Item Name"
                    fullWidth
                    value={equipmentName}
                    onChange={(e) => setEquipmentName(e.target.value)}
                    margin="normal"
                    required
                    variant="outlined"
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
                    InputProps={{ inputProps: { min: 0 } }}
                    helperText={editMode ? "Changing this will log an adjustment." : ""}
                />
                {editMode && (
                <TextField 
                    label="Reason for Adjustment"
                    fullWidth
                    value={adjustmentReason}
                    onChange={(e) => setAdjustmentReason(e.target.value)}
                    margin="normal"
                    variant="outlined"
                    placeholder="e.g., Damaged, New purchase, Correction"
                    helperText="Optional but recommended for audit trail."
                />
                )}
             </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, justifyContent: 'space-between' }}>
             <Box>
                {editMode && (
                    <Button 
                        startIcon={<HistoryIcon />} 
                        color="info" 
                        onClick={() => fetchHistory(currentEquipmentId, equipmentName)}
                    >
                        Audit Log
                    </Button>
                )}
             </Box>
             <Box sx={{ display: 'flex', gap: 1 }}>
                {editMode && currentUser.role === 'admin' && (
                    <Button 
                        startIcon={<DeleteIcon />} 
                        color="error" 
                        onClick={() => {
                            handleDelete(currentEquipmentId);
                            resetForm();
                        }}
                    >
                        Delete
                    </Button>
                )}
                <Button onClick={resetForm} color="inherit">Cancel</Button>
                <Button onClick={handleSubmit} variant="contained" color="primary">
                    Save Changes
                </Button>
             </Box>
        </DialogActions>
      </Dialog>

      {/* Audit Trail Modal */}
      <Modal 
        open={historyModalOpen} 
        onClose={() => setHistoryModalOpen(false)}
        closeAfterTransition
        BackdropComponent={Backdrop}
        BackdropProps={{ timeout: 500 }}
      >
        <Fade in={historyModalOpen}>
            <Box sx={historyModalStyle}>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                    Audit Trail: {selectedItemName}
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                {historyLoading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                        <CircularProgress />
                    </Box>
                ) : selectedItemHistory.length === 0 ? (
                    <Typography variant="body2" color="text.secondary" align="center">
                        No history records found for this item.
                    </Typography>
                ) : (
                    <List>
                        {selectedItemHistory.map((log) => (
                            <ListItem key={log.id} divider>
                                <Box sx={{ mr: 2, display: 'flex', alignItems: 'center' }}>
                                    {log.changeAmount > 0 ? (
                                        <TrendingUpIcon color="success" />
                                    ) : log.changeAmount < 0 ? (
                                        <TrendingDownIcon color="error" />
                                    ) : (
                                        <HistoryIcon color="action" />
                                    )}
                                </Box>
                                <ListItemText 
                                    primary={
                                        <Typography variant="subtitle2" fontWeight="bold">
                                            {log.reason || 'No reason provided'}
                                        </Typography>
                                    }
                                    secondary={
                                        <>
                                            <Typography variant="caption" component="span" display="block" color="text.primary">
                                                {log.oldStock} ➔ <strong>{log.newStock}</strong> ({log.changeAmount > 0 ? '+' : ''}{log.changeAmount})
                                            </Typography>
                                            <Typography variant="caption" component="span" display="block">
                                                {log.timestamp?.toDate().toLocaleString()} by {log.updatedBy}
                                            </Typography>
                                        </>
                                    }
                                />
                            </ListItem>
                        ))}
                    </List>
                )}
                
                <Box sx={{ mt: 3, textAlign: 'right' }}>
                    <Button onClick={() => setHistoryModalOpen(false)}>Close</Button>
                </Box>
            </Box>
        </Fade>
      </Modal>
    </Box>
  );
}

export default ManageEquipment;