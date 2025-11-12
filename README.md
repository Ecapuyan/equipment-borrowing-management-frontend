# Equipment Reservation System

A full-stack web application for managing equipment reservations with role-based access control.

## Features

- **User Roles**: Borrower, Staff, and Superadmin
- **Equipment Management**: Add, edit, delete equipment
- **Reservation System**: Book equipment with date and time slots
- **Availability Checking**: Real-time equipment availability
- **Image Upload**: ID and selfie verification for reservations
- **Reporting**: Reservation summaries and analytics

## Tech Stack

### Backend
- Node.js & Express.js
- MySQL Database
- JWT Authentication
- Multer for file uploads
- CORS enabled

### Frontend
- React.js
- Material-UI (MUI)
- Axios for API calls
- React Router for navigation

## Project Structure
sysarch-project/
├── backend/ # Node.js Express API
├── frontend/ # React.js application
└── README.md

## Installation & Setup

### Backend Setup
1. Navigate to backend folder: `cd backend`
2. Install dependencies: `npm install`
3. Create `.env` file from `.env.example`
4. Set up your MySQL database
5. Start server: `npm start`

### Frontend Setup
1. Navigate to frontend folder: `cd frontend`
2. Install dependencies: `npm install`
3. Start development server: `npm run dev`

## Environment Variables

See `.env.example` in backend folder for required environment variables.

## API Documentation

The API will be available at `http://localhost:3000` when running.

## Default Roles
- **Borrower**: Can make reservations and view their own reservations
- **Staff**: Can manage reservations and equipment
- **Superadmin**: Can manage staff and view all reports

## License

MIT License