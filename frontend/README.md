# Frontend

This is the frontend of the SysArch project.

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

You will need Node.js and npm installed on your machine.

### Installation

1.  Clone the repo
2.  Install NPM packages
    ```sh
    npm install
    ```
3.  Run the development server
    ```sh
    npm run dev
    ```

## Usage

How to use the project.

## Folder Structure

```
frontend/
├── .gitignore
├── eslint.config.js
├── index.html
├── package-lock.json
├── package.json
├── README.md
├── vite.config.js
├── node_modules/
├── public/
│   └── vite.svg
└── src/
    ├── App.css
    ├── App.jsx
    ├── index.css
    ├── main.jsx
    └── assets/
        └── react.svg
```

## Built With

*   [React](https://reactjs.org/) - The web framework used
*   [Vite](https://vitejs.dev/) - Frontend build tool
*   [Material-UI](https://mui.com/) - React UI framework for professional styling

## Authors

*   **Edcel** - *Initial work* - [Edcel](https://github.com/Edcel)

See also the list of [contributors](https://github.com/your/project/contributors) who participated in this project.

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.

# Equipment Borrowing Management System

A web-based system for managing equipment borrowing requests within an organization.  
The system supports Borrowers, Staff, and a Superadmin, enabling reservations, approvals, inventory control, and reporting.

---

## 🚀 System Purpose

This system improves and digitizes the equipment borrowing workflow by:
- Providing an online reservation submission system
- Allowing staff to manage requests and inventory
- Giving superadmin full control over staff accounts and system activity
- Offering borrowers a way to track reservation status in real time

---

## 🧰 Technologies Used

### **Frontend (React)**
| Tool | Purpose |
|------|---------|
| React | UI Framework |
| React Router DOM | Page & role-based navigation |
| Axios | API requests |
| Material UI | UI styling |
| @mui/x-date-pickers | Date input for reservation |

### **Backend (Node.js + Express)**
| Package | Purpose |
|--------|---------|
| Express | Server framework |
| MySQL2 | Database driver |
| Bcrypt | Hashing passwords securely |
| JSON Web Token (JWT) | Authentication tokens |
| Multer | File uploads (ID + Selfie) |
| CORS | Allow cross-origin requests |
| Dotenv | Environment variable handling |
| Express Validator *(optional)* | Form field validation |
| Nodemon *(dev)* | Auto restart during development |

### **Database**
- **MySQL**
- Main Tables:
  - `users`
  - `equipment`
  - `reservations`
  - `reservation_items`

---

## ✅ Installed Packages Summary

### **Frontend Installed**
- react-router-dom
- axios
- @mui/material
- @emotion/react
- @emotion/styled
- @mui/icons-material
- @mui/x-date-pickers
- react-day-picker
- date-fns

### **Backend Installed**
- express
- mysql2
- dotenv
- cors
- bcrypt
- jsonwebtoken
- multer
- express-validator
- nodemon (dev only)

✔ All required dependencies are **already installed** and ready.

---

## 🏗 Project Development Phases

### **Phase 1: Foundation & User Authentication - Done**
- Create MySQL database and initial tables.
- Build /register and /login API with hashed passwords & JWT.
- React pages: Register.jsx, Login.jsx.
- Role-based routing → Borrower / Staff / Superadmin dashboards.

### **Phase 2: Superadmin & Staff Management - Done**
- Create Superadmin dashboard.
- Superadmin manages staff accounts (CRUD).
- Staff dashboard placeholder.

### **Phase 3: Borrower Reservation Submission - Done**
- Borrower dashboard buttons:
  - Borrow Equipment
  - My Reservations
- Submit reservation form includes:
  - Auto-filled borrower details
  - File upload: Valid ID + Selfie with ID
  - Select equipment items (cart)
  - Occasion and Notes fields
  - Date picker (max 30 days advance)
- Saves data to reservations + reservation_items.

### **Phase 4: Borrower Reservation Viewing - Done**
- Borrower views all reservation statuses:
  - Pending, Approved, Rejected, Picked Up, Returned

### **Phase 5: Staff Reservation Workflow & Inventory - Done**
- Staff can:
  - Add, Update, Delete equipment inventory
  - Manage reservation approvals
  - Change status workflow:
    ```
    Pending → Approved → Picked Up → In Progress → Returned (Completed)
    ```

### **Phase 6: Reporting & Dashboard Analytics - Done**
- Summary metrics displayed:
  - Total Pending
  - Total Approved
  - Total Borrowed (In Progress)
  - Total Completed
- Reports page for completed & rejected reservations.

---

## 🆕 Phase 7: Reservation Time Slot System - Done**

### Time Slot Options
| Slot | Time |
|------|------|
| Morning | 7:00 AM – 2:00 PM |
| Afternoon | 3:00 PM – 10:00 PM |
| Full Day | 7:00 AM – 10:00 PM |

### Rules
- Borrower **cannot select same-day date**.
- After selecting a date:
- If **Morning** reserved → only Afternoon shows.
- If **Afternoon** reserved → only Morning shows.
- If **Full Day** reserved → **date becomes unavailable**.

### Database Update
- `reservations` table now includes `time_slot` column.

### Backend API Updates
- `GET /api/availability/slots?date=YYYY-MM-DD`: Returns available time slots for a given date.
- `GET /api/availability/equipment?date=YYYY-MM-DD&slot=SLOT_NAME`: Returns available equipment and quantities for a given date and time slot.
- `POST /api/reservations`: Updated to handle `time_slot` and `items` with quantities, including server-side availability validation.

---

## 🆕 Phase 8: Real-Time Equipment Availability & Quantity - Done**

- System checks inventory based on:
  - Date selected
  - Time slot selected
- Shows:
  - Equipment name, total quantity, reserved quantity, and available quantity.
- Borrower may request quantity ≤ available.
- `reservation_items` table now includes `quantity` column.
- Frontend `BorrowEquipment.jsx` updated to reflect dynamic availability and quantity input.

---

## 🆕 Phase 9: Staff Dashboard Update & Full-System Test - Done**

- Staff's reservation management UI (`ManageReservations.jsx`) updated.
- Displays `time_slot` for each reservation.
- "View Details" functionality added to show reserved equipment and quantities in a table within a dialog.
- Backend `GET /reservations` endpoint updated to include reservation items.

---

## ✅ Overall Status
All project development phases, including the new enhancements (Phase 7-9), are **successfully completed**.
The system is ready for testing and deployment.
