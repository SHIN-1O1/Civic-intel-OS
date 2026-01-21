const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Firebase Admin SDK (Optional - for advanced backend features)
// Setup Guide: https://firebase.google.com/docs/admin/setup
/*
try {
    const serviceAccount = require('./service-account-key.json');
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
    console.log("Firebase Admin Initialized");
} catch (error) {
    console.log("Firebase Admin not initialized (Missing keys)");
}
*/

// Basic Routes
app.get('/', (req, res) => {
    res.send('Civic-Intel-OS Backend Running');
});

app.get('/api/status', (req, res) => {
    res.json({
        status: 'active',
        timestamp: new Date(),
        service: 'Civic Grievance Portal API'
    });
});

// Example API Endpoint: Get System Stats (Mock)
app.get('/api/stats', (req, res) => {
    res.json({
        totalComplaints: 1250,
        resolved: 980,
        pending: 270
    });
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
