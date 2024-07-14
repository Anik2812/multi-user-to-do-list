require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { GoogleSpreadsheet } = require('google-spreadsheet');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const authMiddleware = require('./middleware/auth');

const app = express();

// Middleware
app.use(cors({ origin: 'http://localhost:8000' }));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Load the service account credentials
const creds = JSON.parse(fs.readFileSync('./google-sheets-credentials.json'));

// Initialize Google Sheets document
const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID);

(async function() {
    try {
        await doc.useServiceAccountAuth({
            client_email: creds.client_email,
            private_key: creds.private_key.replace(/\\n/g, '\n'),
        });

        await doc.loadInfo();
    } catch (error) {
        console.error('Error initializing Google Sheets document:', error);
    }
})();

// Helper function to get sheet data
async function getSheetData(sheetIndex) {
    try {
        const sheet = doc.sheetsByIndex[sheetIndex];
        await sheet.loadCells();
        const rows = await sheet.getRows();
        return rows.map(row => row._rawData);
    } catch (error) {
        console.error('Error getting sheet data:', error);
        throw error;
    }
}

// Routes
app.post('/api/auth/signup', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const usersSheet = doc.sheetsByIndex[0];
        const users = await getSheetData(0);
        
        if (users.some(user => user[2] === email)) {
            return res.status(400).json({ message: 'Email already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = [Date.now().toString(), name, email, hashedPassword, '', '', ''];
        await usersSheet.addRow(newUser);

        const token = jwt.sign({ userId: newUser[0] }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.status(201).json({ token, user: { name, email } });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const users = await getSheetData(0);
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

app.get('/api/auth/user', authMiddleware, async (req, res) => {
    try {
        const users = await getSheetData(0);
        const user = users.find(user => user[0] === req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json({ user: { name: user[1], email: user[2], avatar: user[6] } });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.get('/api/tasks', authMiddleware, async (req, res) => {
    try {
        const tasks = await getSheetData(1);
        const userTasks = tasks.filter(task => task[1] === req.user.id);
        res.json(userTasks);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.post('/api/tasks', authMiddleware, async (req, res) => {
    try {
        const { title, description, dueDate, important } = req.body;
        const tasksSheet = doc.sheetsByIndex[1];
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
        await tasksSheet.addRow(newTask);
        res.status(201).json(newTask);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.put('/api/tasks/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, dueDate, important, completed } = req.body;
        const tasksSheet = doc.sheetsByIndex[1];
        const rows = await tasksSheet.getRows();
        const task = rows.find(row => row._rawData[0] === id && row._rawData[1] === req.user.id);

        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        task.title = title;
        task.description = description;
        task.dueDate = dueDate;
        task.important = important ? 'true' : 'false';
        task.completed = completed ? 'true' : 'false';

        await task.save();
        res.json(task._rawData);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.delete('/api/tasks/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const tasksSheet = doc.sheetsByIndex[1];
        const rows = await tasksSheet.getRows();
        const task = rows.find(row => row._rawData[0] === id && row._rawData[1] === req.user.id);

        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        await task.delete();
        res.json({ message: 'Task deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Default route
app.get('/', (req, res) => {
    res.send('Welcome to TaskMaster Pro API');
});

// Error handling for undefined routes
app.use((req, res, next) => {
    res.status(404).json({ error: 'Route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
