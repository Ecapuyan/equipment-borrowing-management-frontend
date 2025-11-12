const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Security check for JWT Key
if (!process.env.JWT_KEY) {
    console.error("FATAL ERROR: JWT_KEY is not defined in the environment variables.");
    process.exit(1);
}

// Security check for Database configuration
if (!process.env.DB_HOST || !process.env.DB_USER || !process.env.DB_NAME) {
    console.error("FATAL ERROR: Database configuration is incomplete in environment variables.");
    process.exit(1);
}

const app = express();

// CORS configuration
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Ensure uploads directory exists
const fs = require('fs');
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log('Uploads directory created');
}

// Import routes
const authRoutes = require('./routes/auth');
const equipmentRoutes = require('./routes/equipment');
const reservationRoutes = require('./routes/reservations');
const staffRoutes = require('./routes/staff');
const reportsRoutes = require('./routes/reports');
const availabilityRoutes = require('./routes/availability');

// Use routes
app.use('/auth', authRoutes);
app.use('/equipment', equipmentRoutes);
app.use('/reservations', reservationRoutes);
app.use('/staff', staffRoutes);
app.use('/reports', reportsRoutes);
app.use('/api/availability', availabilityRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ 
        status: 'OK', 
        message: 'Server is running',
        timestamp: new Date().toISOString()
    });
});

// Root endpoint
app.get('/', (req, res) => {
    res.status(200).json({ 
        message: 'Equipment Reservation API',
        version: '1.0.0',
        endpoints: {
            auth: '/auth',
            equipment: '/equipment',
            reservations: '/reservations',
            staff: '/staff',
            reports: '/reports',
            availability: '/api/availability'
        }
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error Stack:', err.stack);
    
    // Multer errors
    if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ 
            message: 'File too large. Maximum size is 5MB.' 
        });
    }
    
    // Check if multer is defined before using it
    if (err.name === 'MulterError') {
        return res.status(400).json({ 
            message: `File upload error: ${err.message}` 
        });
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({ 
            message: 'Invalid token.' 
        });
    }

    if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ 
            message: 'Token expired.' 
        });
    }

    // Default error
    res.status(500).json({ 
        message: 'Something went wrong!',
        ...(process.env.NODE_ENV === 'development' && { error: err.message })
    });
});

// 404 handler - must be after all routes
// FIXED: Use a proper route pattern instead of '*'
app.use((req, res) => {
    res.status(404).json({ 
        message: 'Route not found',
        path: req.originalUrl,
        method: req.method
    });
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});

const port = process.env.PORT || 3000;

const server = app.listen(port, () => {
    console.log(`🚀 Server is running on port ${port}`);
    console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🌐 Health check: http://localhost:${port}/health`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    server.close(() => {
        console.log('Process terminated');
    });
});

module.exports = app;