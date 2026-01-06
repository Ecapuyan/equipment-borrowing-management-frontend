// src/pages/Reports.jsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  Typography,
  Box,
  CircularProgress,
  Grid,
  Card,
  CardContent,
  Paper
} from '@mui/material';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Pie } from 'react-chartjs-2';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';
import { useSnackbar } from '../context/SnackbarContextDef';

ChartJS.register(ArcElement, Tooltip, Legend);

function StatCard({ title, value, icon }) {
  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Box sx={{ flexGrow: 1 }}>
            <Typography color="text.secondary" gutterBottom>
              {title}
            </Typography>
            <Typography variant="h4" component="div">
              {value}
            </Typography>
          </Box>
          <Box sx={{ fontSize: 48, color: 'primary.main' }}>
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

function Reports() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalEquipment: 0,
    pendingReservations: 0,
  });
  const [equipmentStatusData, setEquipmentStatusData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { showSnackbar } = useSnackbar();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const equipmentSnapshot = await getDocs(collection(db, 'equipments'));
      const reservationsSnapshot = await getDocs(collection(db, 'reservations'));

      const pendingReservations = reservationsSnapshot.docs.filter(doc => doc.data().status === 'pending').length;
      
      const totalEquipment = equipmentSnapshot.size;
      const approvedReservations = reservationsSnapshot.docs
        .filter(doc => doc.data().status === 'approved')
        .map(doc => doc.data().equipmentId);
      
      const availableCount = totalEquipment - new Set(approvedReservations).size;
      const unavailableCount = new Set(approvedReservations).size;

      setStats({
        totalUsers: usersSnapshot.size,
        totalEquipment,
        pendingReservations,
      });

      setEquipmentStatusData({
        labels: ['Available', 'On Loan'],
        datasets: [
          {
            label: 'Equipment Status',
            data: [availableCount, unavailableCount],
            backgroundColor: ['#4caf50', '#f44336'],
            borderColor: ['#ffffff', '#ffffff'],
            borderWidth: 1,
          },
        ],
      });

    } catch (err) {
      console.error("Error fetching report data:", err);
      showSnackbar("Failed to load report data.", "error");
    } finally {
      setLoading(false);
    }
  }, [showSnackbar]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return <CircularProgress />;
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Reports & Analytics
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard title="Total Users" value={stats.totalUsers} />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard title="Total Equipment" value={stats.totalEquipment} />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard title="Pending Reservations" value={stats.pendingReservations} />
        </Grid>
        <Grid item xs={12} md={6}>
            <Card>
                <CardContent>
                    <Typography variant="h6">Equipment Status</Typography>
                    {equipmentStatusData && (
                        <Box sx={{ height: 300, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                            <Pie data={equipmentStatusData} options={{ maintainAspectRatio: false }}/>
                        </Box>
                    )}
                </CardContent>
            </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

export default Reports;
