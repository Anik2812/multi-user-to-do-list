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
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'No token provided' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.GOOGLE_SHEET_ID,
            range: 'Users',
        });
        
        const users = response.data.values;
        const user = users.find(row => row[0] === decoded.userId);

        if (!user) return res.status(404).json({ message: 'User not found' });

        req.user = {
            id: user[0],
            name: user[1],
            email: user[2],
            avatar: user[6]
        };
        next();
    } catch (error) {
        res.status(401).json({ message: 'Invalid token' });
    }
};

module.exports = authMiddleware;