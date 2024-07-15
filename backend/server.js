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

// Helper function to get sheet data
async function getSheetData(sheetName) {
    try {
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.GOOGLE_SHEET_ID,
            range: sheetName,
        });
        
        if (!response.data || !response.data.values || response.data.values.length === 0) {
            console.error('Sheet is empty or does not exist:', sheetName);
            return null;
        }
        
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

// Routes
app.post('/api/auth/signup', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const users = await getSheetData('Users');
        
        if (!users) {
            return res.status(500).json({ message: 'Error fetching user data. The Users sheet might be empty or not exist.' });
        }

        if (users.some(user => user[2] === email)) {
            return res.status(400).json({ message: 'Email already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = [Date.now().toString(), name, email, hashedPassword, '', '', ''];
        await appendRow('Users', newUser);

        const token = jwt.sign({ userId: newUser[0] }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.status(201).json({ token, user: { name, email } });
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ message: error.message });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const users = await getSheetData('Users');
        
        if (!users) {
            return res.status(500).json({ message: 'Error fetching user data. The Users sheet might be empty or not exist.' });
        }

        const user = users.find(user => user[2] === email);

        if (!user || !(await bcrypt.compare(password, user[3]))) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }

        const token = jwt.sign({ userId: user[0] }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.json({ token, user: { name: user[1], email: user[2], avatar: user[6] } });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: error.message });
    }
});

app.get('/api/tasks', authMiddleware, async (req, res) => {
    try {
        const tasks = await getSheetData('Tasks');
        
        if (!tasks) {
            return res.status(500).json({ message: 'Error fetching tasks. The Tasks sheet might be empty or not exist.' });
        }

        const userTasks = tasks.filter(task => task[1] === req.user.id);
        res.json(userTasks);
    } catch (error) {
        console.error('Get tasks error:', error);
        res.status(500).json({ message: error.message });
    }
});

app.post('/api/tasks', authMiddleware, async (req, res) => {
    try {
        const { title, description, dueDate, important } = req.body;
        const newTask = [
            Date.now().toString(),
            req.user.id,
            title,
            description,
            dueDate,
            'false',
            important ? 'true' : 'false',
            ''
        ];
        await appendRow('Tasks', newTask);
        res.status(201).json(newTask);
    } catch (error) {
        console.error('Add task error:', error);
        res.status(500).json({ message: error.message });
    }
});

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