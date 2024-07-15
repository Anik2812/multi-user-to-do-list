// server.js

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
const authRoutes = require('./routes/auth');
const taskRoutes = require('./routes/tasks');
const authMiddleware = require('./middleware/auth');

const app = express();

// Middleware
app.use(cors({ origin: 'http://localhost:8000', credentials: true }));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Load the service account credentials
const creds = require('./google-sheets-credentials.json');

// Initialize Google Sheets API
const auth = new google.auth.GoogleAuth({
    credentials: creds,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const sheets = google.sheets({ version: 'v4', auth });

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);

// Test route to verify Google Sheets connection
app.get('/api/test-sheets', async (req, res) => {
    try {
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.GOOGLE_SHEET_ID,
            range: 'Users',
        });
        res.json({ message: 'Successfully fetched data', count: response.data.values.length });
    } catch (error) {
        console.error('Test route error:', error);
        res.status(500).json({ message: error.message });
    }
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));