// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage"; // Import Storage

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDFDFkCnop4C59HbTxMqvum8divUTYl1Cs",
  authDomain: "borrowing-system-e9492.firebaseapp.com",
  projectId: "borrowing-system-e9492",
  storageBucket: "borrowing-system-e9492.firebasestorage.app",
  messagingSenderId: "1035841933960",
  appId: "1:1035841933960:web:bcbfb32cc96bfab358853d",
  measurementId: "G-6E9MFTKYXJ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app); // Initialize Storage

export { app, auth, db, storage }; // Export storage
