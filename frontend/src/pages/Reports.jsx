// src/pages/Reports.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Typography, Box, CircularProgress, Grid, Card, CardContent, Paper,
  Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Tabs, Tab, Chip, IconButton, useTheme
} from '@mui/material';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';
import { db } from '../firebase';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { useSnackbar } from '../context/SnackbarContextDef';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import PrintIcon from '@mui/icons-material/Print';
import DownloadIcon from '@mui/icons-material/Download';
import AssignmentIcon from '@mui/icons-material/Assignment';
import WarningIcon from '@mui/icons-material/Warning';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PeopleIcon from '@mui/icons-material/People';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

function StatCard({ title, value, icon, color }) {
  return (
    <Card sx={{ height: '100%', borderLeft: `6px solid ${color}` }}>
      <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 3 }}>
        <Box>
          <Typography color="text.secondary" variant="subtitle2" gutterBottom fontWeight="bold">
            {title.toUpperCase()}
          </Typography>
          <Typography variant="h3" fontWeight="bold">
            {value}
          </Typography>
        </Box>
        <Box sx={{ 
            bgcolor: `${color}20`, 
            p: 1.5, 
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

function Reports() {
  const [loading, setLoading] = useState(true);
  const [reservations, setReservations] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [equipments, setEquipments] = useState([]);
  const [tabValue, setTabValue] = useState(0);
  const { showSnackbar } = useSnackbar();
  const theme = useTheme();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch all needed collections
      const [resSnap, eqSnap, incSnap] = await Promise.all([
        getDocs(query(collection(db, 'reservations'))),
        getDocs(collection(db, 'equipments')),
        getDocs(query(collection(db, 'incident_reports'), orderBy('dateReported', 'desc')))
      ]);

      const resData = resSnap.docs.map(doc => ({ ...doc.data(), id: doc.id }));
      const eqData = eqSnap.docs.map(doc => ({ ...doc.data(), id: doc.id }));
      const incData = incSnap.docs.map(doc => ({ ...doc.data(), id: doc.id }));

      setReservations(resData);
      setEquipments(eqData);
      setIncidents(incData);

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

  // --- Analytics Logic ---

  // 1. Top Borrowed Items
  const topBorrowedChartData = useMemo(() => {
    const counts = {};
    reservations.forEach(res => {
        if (res.status === 'approved' || res.status === 'completed' || res.status === 'returned' || res.status === 'delivered') {
            if (Array.isArray(res.items)) {
                res.items.forEach(item => {
                    counts[item.name] = (counts[item.name] || 0) + item.quantity;
                });
            }
        }
    });

    const sorted = Object.keys(counts)
        .map(name => ({ name, count: counts[name] }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5); // Top 5

    return {
      labels: sorted.map(i => i.name),
      datasets: [
        {
          label: 'Times Borrowed',
          data: sorted.map(i => i.count),
          backgroundColor: 'rgba(59, 130, 246, 0.5)', // Blue
          borderColor: 'rgb(59, 130, 246)',
          borderWidth: 1,
        },
      ],
    };
  }, [reservations]);

  // 2. Monthly Trends
  const monthlyChartData = useMemo(() => {
    const months = {};
    reservations.forEach(res => {
        if (!res.reservationDate) return;
        const date = res.reservationDate.toDate();
        const monthKey = date.toLocaleString('default', { month: 'short' });
        months[monthKey] = (months[monthKey] || 0) + 1;
    });

    const monthOrder = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const labels = monthOrder.filter(m => months[m] !== undefined);
    const data = labels.map(m => months[m] || 0);

    return {
      labels,
      datasets: [
        {
          label: 'Reservations',
          data: data,
          borderColor: 'rgb(16, 185, 129)', // Emerald
          backgroundColor: 'rgba(16, 185, 129, 0.5)',
          tension: 0.3,
        },
      ],
    };
  }, [reservations]);

  // 3. KPI Stats
  const kpi = useMemo(() => {
    const totalReservations = reservations.length;
    const active = reservations.filter(r => r.status === 'approved' || r.status === 'delivered').length;
    const damagedCount = incidents.length;
    const totalFines = incidents.reduce((sum, inc) => sum + (Number(inc.cost) || 0), 0);

    return { totalReservations, active, damagedCount, totalFines };
  }, [reservations, incidents]);

  // --- PDF Export Logic ---
  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text("Barangay Equipment Management Report", 14, 20);
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 28);
    
    // Summary
    doc.text("Summary:", 14, 40);
    doc.text(`Total Reservations: ${kpi.totalReservations}`, 20, 48);
    doc.text(`Active Loans: ${kpi.active}`, 20, 54);
    doc.text(`Total Incidents: ${kpi.damagedCount}`, 20, 60);

    // Table
    if (tabValue === 0) {
        doc.text("Transaction History", 14, 75);
        doc.autoTable({
            startY: 80,
            head: [['Date', 'Resident', 'Items', 'Status']],
            body: reservations.map(r => [
                r.reservationDate?.toDate().toLocaleDateString() || 'N/A',
                r.fullName,
                Array.isArray(r.items) ? r.items.map(i => i.name).join(', ') : '',
                r.status
            ]),
        });
    } else {
        doc.text("Incident Reports", 14, 75);
        doc.autoTable({
            startY: 80,
            head: [['Date', 'Resident', 'Item', 'Type', 'Cost']],
            body: incidents.map(i => [
                i.dateReported?.toDate().toLocaleDateString() || 'N/A',
                i.residentName,
                i.equipmentName,
                i.type,
                `P${i.cost}`
            ]),
        });
    }

    doc.save("barangay_reports.pdf");
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
    },
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}><CircularProgress /></Box>;

  return (
    <Box sx={{ pb: 5 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
            <Box>
                <Typography variant="h4" fontWeight="bold" gutterBottom>Reports & Analytics</Typography>
                <Typography variant="subtitle1" color="text.secondary">Overview of equipment usage and incidents.</Typography>
            </Box>
            <Button 
                variant="contained" 
                startIcon={<DownloadIcon />} 
                onClick={exportPDF}
            >
                Export Report
            </Button>
        </Box>

        {/* KPI Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
                <StatCard 
                    title="Total Reservations" 
                    value={kpi.totalReservations} 
                    icon={<AssignmentIcon fontSize="inherit" />}
                    color={theme.palette.primary.main} 
                />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
                <StatCard 
                    title="Active Loans" 
                    value={kpi.active} 
                    icon={<PeopleIcon fontSize="inherit" />}
                    color={theme.palette.success.main} 
                />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
                <StatCard 
                    title="Incidents Reported" 
                    value={kpi.damagedCount} 
                    icon={<WarningIcon fontSize="inherit" />}
                    color={theme.palette.error.main} 
                />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
                <StatCard 
                    title="Total Fines (PHP)" 
                    value={`P${kpi.totalFines.toLocaleString()}`} 
                    icon={<CheckCircleIcon fontSize="inherit" />}
                    color={theme.palette.warning.main} 
                />
            </Grid>
        </Grid>

        {/* Charts Section */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} md={6}>
                <Paper elevation={3} sx={{ p: 3, height: 400, display: 'flex', flexDirection: 'column' }}>
                    <Typography variant="h6" gutterBottom fontWeight="bold">Most Borrowed Equipment</Typography>
                    <Box sx={{ flexGrow: 1, position: 'relative' }}>
                        <Bar options={{...chartOptions, indexAxis: 'y'}} data={topBorrowedChartData} />
                    </Box>
                </Paper>
            </Grid>
            <Grid item xs={12} md={6}>
                <Paper elevation={3} sx={{ p: 3, height: 400, display: 'flex', flexDirection: 'column' }}>
                    <Typography variant="h6" gutterBottom fontWeight="bold">Monthly Reservation Trends</Typography>
                    <Box sx={{ flexGrow: 1, position: 'relative' }}>
                        <Line options={chartOptions} data={monthlyChartData} />
                    </Box>
                </Paper>
            </Grid>
        </Grid>

        {/* Tabbed Data Tables */}
        <Paper elevation={3} sx={{ width: '100%', mb: 2 }}>
            <Tabs 
                value={tabValue} 
                onChange={(e, v) => setTabValue(v)} 
                indicatorColor="primary" 
                textColor="primary"
                sx={{ borderBottom: 1, borderColor: 'divider', px: 2, pt: 2 }}
            >
                <Tab label="Transaction Log" />
                <Tab label="Incident Reports" />
            </Tabs>
            
            <Box sx={{ p: 0 }}>
                {tabValue === 0 && (
                    <TableContainer sx={{ maxHeight: 440 }}>
                        <Table stickyHeader>
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 'bold' }}>Date</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold' }}>Resident</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold' }}>Items Borrowed</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {reservations.slice(0, 50).map((row) => (
                                    <TableRow key={row.id} hover>
                                        <TableCell>{row.reservationDate?.toDate().toLocaleDateString()}</TableCell>
                                        <TableCell>{row.fullName}</TableCell>
                                        <TableCell>
                                            {Array.isArray(row.items) ? row.items.map(i => i.name).join(', ') : 'N/A'}
                                        </TableCell>
                                        <TableCell>
                                            <Chip 
                                                label={row.status} 
                                                size="small" 
                                                color={
                                                    row.status === 'approved' ? 'success' : 
                                                    row.status === 'pending' ? 'warning' : 
                                                    row.status === 'returned' ? 'default' : 
                                                    row.status === 'delivered' ? 'info' : 'error'
                                                }
                                                sx={{ textTransform: 'capitalize' }}
                                            />
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {reservations.length === 0 && (
                                    <TableRow><TableCell colSpan={4} align="center">No records found</TableCell></TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}

                {tabValue === 1 && (
                    <TableContainer sx={{ maxHeight: 440 }}>
                        <Table stickyHeader>
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 'bold' }}>Report Date</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold' }}>Resident</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold' }}>Item Involved</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold' }}>Issue</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold' }}>Cost</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {incidents.map((row) => (
                                    <TableRow key={row.id} hover>
                                        <TableCell>{row.dateReported?.toDate().toLocaleDateString()}</TableCell>
                                        <TableCell>{row.residentName}</TableCell>
                                        <TableCell>{row.equipmentName}</TableCell>
                                        <TableCell>
                                            <Chip label={row.type} color="error" size="small" variant="outlined" sx={{ textTransform: 'capitalize' }} />
                                            <Typography variant="caption" display="block" color="text.secondary">
                                                {row.description}
                                            </Typography>
                                        </TableCell>
                                        <TableCell sx={{ fontWeight: 'bold', color: 'error.main' }}>
                                            P{Number(row.cost).toLocaleString()}
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {incidents.length === 0 && (
                                    <TableRow><TableCell colSpan={5} align="center">No incidents reported</TableCell></TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </Box>
        </Paper>
    </Box>
  );
}

export default Reports;
