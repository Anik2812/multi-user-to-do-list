// middleware/auth.js
const jwt = require('jsonwebtoken');
const { google } = require('googleapis');

// Load the service account credentials
const creds = require('../google-sheets-credentials.json');

const auth = new google.auth.GoogleAuth({
    credentials: creds,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const sheets = google.sheets({ version: 'v4', auth });

const authMiddleware = async (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
        return res.status(401).json({ message: 'No token provided' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Fetch user data from Google Sheets
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.GOOGLE_SHEET_ID,
            range: 'Users',
        });

        const users = response.data.values;
        const user = users.find(row => row[0] === decoded.userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Attach user information to the request object
        req.user = {
            id: user[0],
            name: user[1],
            email: user[2],
            avatar: user[6] || null // Use null if avatar is not set
        };

        next();
    } catch (error) {
        console.error('Authentication error:', error);
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ message: 'Invalid token' });
        }
        res.status(500).json({ message: 'Server error during authentication' });
    }
};

module.exports = authMiddleware;