const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { google } = require('googleapis');
const authMiddleware = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

// Load the service account credentials
const creds = require('../google-sheets-credentials.json');

const auth = new google.auth.GoogleAuth({
    credentials: creds,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const sheets = google.sheets({ version: 'v4', auth });

// Helper function to get sheet data
async function getSheetData(sheetName) {
    try {
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.GOOGLE_SHEET_ID,
            range: sheetName,
        });
        return response.data.values;
    } catch (error) {
        console.error(`Error fetching sheet data for ${sheetName}:`, error);
        return null;
    }
}

// Helper function to append row to sheet
async function appendRow(sheetName, values) {
    try {
        await sheets.spreadsheets.values.append({
            spreadsheetId: process.env.GOOGLE_SHEET_ID,
            range: sheetName,
            valueInputOption: 'USER_ENTERED',
            resource: { values: [values] },
        });
    } catch (error) {
        console.error(`Error appending row to ${sheetName}:`, error);
        throw error;
    }
}

// Helper function to update a row in a sheet
async function updateRow(sheetName, range, values) {
    try {
        await sheets.spreadsheets.values.update({
            spreadsheetId: process.env.GOOGLE_SHEET_ID,
            range: range,
            valueInputOption: 'USER_ENTERED',
            resource: { values: [values] },
        });
    } catch (error) {
        console.error(`Error updating row in ${sheetName}:`, error);
        throw error;
    }
}

// Signup route
router.post('/signup', [
    body('name').notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Invalid email format'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { name, email, password } = req.body;
        const users = await getSheetData('Users');
        
        if (users.some(user => user[2] === email)) {
            return res.status(400).json({ message: 'Email already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = [Date.now().toString(), name, email, hashedPassword, '', '', ''];
        await appendRow('Users', newUser);

        const token = jwt.sign({ userId: newUser[0] }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.status(201).json({ token, user: { name, email } });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Login route
router.post('/login', [
    body('email').isEmail().withMessage('Invalid email format'),
    body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { email, password } = req.body;
        const users = await getSheetData('Users');
        
        const user = users.find(user => user[2] === email);
        if (!user || !(await bcrypt.compare(password, user[3]))) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }

        const token = jwt.sign({ userId: user[0] }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.json({ token, user: { name: user[1], email: user[2], avatar: user[6] } });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get user details route
router.get('/user', authMiddleware, async (req, res) => {
    try {
        res.json({ user: req.user });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Avatar upload configuration
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/')
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname))
    }
});

const upload = multer({ storage: storage });

// Avatar upload route
router.post('/avatar', authMiddleware, upload.single('avatar'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
    }

    try {
        const users = await getSheetData('Users');
        const userIndex = users.findIndex(user => user[0] === req.user.id);
        
        if (userIndex === -1) {
            return res.status(404).json({ message: 'User not found' });
        }

        const avatarUrl = `/uploads/${req.file.filename}`;
        users[userIndex][6] = avatarUrl;

        await updateRow('Users', `Users!A${userIndex + 1}:G${userIndex + 1}`, users[userIndex]);

        res.json({ message: 'Avatar uploaded successfully', avatarUrl });
    } catch (error) {
        console.error('Avatar upload error:', error);
        res.status(500).json({ message: 'Error uploading avatar' });
    }
});

// Forgot password route
router.post('/forgot-password', [
    body('email').isEmail().withMessage('Invalid email format')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { email } = req.body;

    try {
        const users = await getSheetData('Users');
        const userIndex = users.findIndex(user => user[2] === email);
        
        if (userIndex === -1) {
            return res.status(404).json({ message: 'User not found' });
        }

        const resetToken = crypto.randomBytes(20).toString('hex');
        const resetTokenExpiry = Date.now() + 3600000; // 1 hour

        users[userIndex][4] = resetToken;
        users[userIndex][5] = resetTokenExpiry;

        await updateRow('Users', `Users!A${userIndex + 1}:G${userIndex + 1}`, users[userIndex]);

        // Send email with reset token
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Password Reset',
            text: `You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n
            Please click on the following link, or paste this into your browser to complete the process:\n\n
            http://localhost:8000/reset-password/${resetToken}\n\n
            If you did not request this, please ignore this email and your password will remain unchanged.\n`,
        };

        await transporter.sendMail(mailOptions);

        res.status(200).json({ message: 'Password reset email sent' });
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ message: 'Error in forgot password process' });
    }
});

// Reset password route
router.post('/reset-password/:token', [
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { password } = req.body;
    const { token } = req.params;

    try {
        const users = await getSheetData('Users');
        const userIndex = users.findIndex(user => user[4] === token && user[5] > Date.now());

        if (userIndex === -1) {
            return res.status(400).json({ message: 'Invalid or expired token' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        users[userIndex][3] = hashedPassword;

        // Remove the reset token and expiry
        users[userIndex][4] = '';
        users[userIndex][5] = '';

        await updateRow('Users', `Users!A${userIndex + 1}:G${userIndex + 1}`, users[userIndex]);

        res.status(200).json({ message: 'Password has been reset successfully' });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ message: 'Error resetting password' });
    }
});

module.exports = router;
