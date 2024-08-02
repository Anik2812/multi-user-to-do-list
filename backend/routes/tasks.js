const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const authMiddleware = require('../middleware/auth');
const { google } = require('googleapis');

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
        throw new Error('Failed to fetch data from Google Sheets');
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

// Helper function to update a task using Google Sheets API
async function updateTaskInSheet(taskId, updates) {
    try {
        console.log('Fetching tasks from sheet');
        const tasks = await getSheetData('Tasks');
        console.log('Tasks fetched:', tasks.length);
        
        const taskIndex = tasks.findIndex(task => task[0] === taskId);
        console.log('Task index:', taskIndex);
        
        if (taskIndex === -1) {
            throw new Error('Task not found');
        }

        const updatedTask = [...tasks[taskIndex]];
        console.log('Original task:', updatedTask);
        
        Object.keys(updates).forEach(key => {
            switch (key) {
                case 'title':
                    updatedTask[2] = updates.title;
                    break;
                case 'description':
                    updatedTask[3] = updates.description;
                    break;
                case 'completed':
                    updatedTask[5] = updates.completed.toString().toUpperCase();
                    break;
                case 'important':
                    updatedTask[6] = updates.important.toString().toUpperCase();
                    break;
            }
        });
        
        console.log('Updated task:', updatedTask);

        const response = await sheets.spreadsheets.values.update({
            spreadsheetId: process.env.GOOGLE_SHEET_ID,
            range: `Tasks!A${taskIndex + 2}:H${taskIndex + 2}`,
            valueInputOption: 'USER_ENTERED',
            resource: { values: [updatedTask] }
        });
        
        console.log('Sheets API response:', response.status, response.statusText);

        return {
            _id: updatedTask[0],
            userId: updatedTask[1],
            title: updatedTask[2],
            description: updatedTask[3],
            dueDate: updatedTask[4],
            completed: updatedTask[5] === 'TRUE',
            important: updatedTask[6] === 'TRUE',
            sharedId: updatedTask[7]
        };
    } catch (error) {
        console.error('Error updating task in sheet:', error);
        throw error;
    }
}

// Create a new task
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { title, description, dueDate, important } = req.body;
        const newTask = [
            Date.now().toString(),
            req.user.id,
            title,
            description,
            dueDate || '',
            'FALSE',
            important ? 'TRUE' : 'FALSE',
            ''
        ];
        await sheets.spreadsheets.values.append({
            spreadsheetId: process.env.GOOGLE_SHEET_ID,
            range: 'Tasks',
            valueInputOption: 'USER_ENTERED',
            resource: { values: [newTask] },
        });
        res.status(201).json({
            _id: newTask[0],
            userId: newTask[1],
            title: newTask[2],
            description: newTask[3],
            dueDate: newTask[4],
            completed: false,
            important: important || false,
            sharedId: ''
        });
    } catch (error) {
        console.error('Error creating task:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get all tasks for a user (including shared tasks)
router.get('/', authMiddleware, async (req, res) => {
    try {
        const tasks = await getSheetData('Tasks');
        const userTasks = tasks.slice(1).filter(task =>
            task[1] === req.user.id || // User's own tasks
            (task[7] && task[7].split(',').map(id => id.trim()).includes(req.user.id)) // Shared tasks
        ).map(task => ({
            _id: task[0],
            user: task[1],
            title: task[2],
            description: task[3],
            dueDate: task[4],
            completed: task[5] === 'TRUE',
            important: task[6] === 'TRUE',
            sharedWith: task[7] ? task[7].split(',').map(id => id.trim()) : [],
            isShared: task[1] !== req.user.id
        }));
        res.json(userTasks);
    } catch (error) {
        console.error('Error fetching tasks:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get shared tasks
router.get('/shared', authMiddleware, async (req, res) => {
    try {
        const tasks = await getSheetData('Tasks');
        const sharedTasks = tasks.filter(task => {
            const sharedWith = task[7] ? task[7].split(',').map(id => id.trim()) : [];
            return sharedWith.includes(req.user.id);
        }).map(task => ({
            _id: task[0],
            user: task[1],
            title: task[2],
            description: task[3],
            dueDate: task[4],
            completed: task[5] === 'true',
            important: task[6] === 'true',
            sharedWith: task[7] ? task[7].split(',').map(id => id.trim()) : [],
            isShared: true
        }));
        res.json(sharedTasks);
    } catch (error) {
        console.error('Error fetching shared tasks:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update a task
router.put('/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, completed, important } = req.body;

        console.log('Updating task:', id, req.body); // Log the incoming data

        const updatedTask = await updateTaskInSheet(id, { title, description, completed, important });
        console.log('Task updated:', updatedTask); // Log the updated task
        res.json(updatedTask);
    } catch (error) {
        console.error('Error updating task:', error);
        res.status(500).json({ message: error.message, stack: error.stack });
    }
});

// Delete a task
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const tasks = await getSheetData('Tasks');
        const taskIndex = tasks.findIndex(task => task[0] === req.params.id && task[1] === req.user.id);

        if (taskIndex === -1) {
            return res.status(404).json({ message: 'Task not found' });
        }

        await sheets.spreadsheets.batchUpdate({
            spreadsheetId: process.env.GOOGLE_SHEET_ID,
            resource: {
                requests: [
                    {
                        deleteDimension: {
                            range: {
                                sheetId: 0,
                                dimension: 'ROWS',
                                startIndex: taskIndex + 1,
                                endIndex: taskIndex + 2
                            }
                        }
                    }
                ]
            }
        });

        res.json({ message: 'Task removed' });
    } catch (error) {
        console.error('Error deleting task:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Share tasks with another user
router.post('/share', [
    authMiddleware,
    [
        check('email', 'Please include a valid email').isEmail(),
        check('taskIds', 'Task IDs are required').isArray().notEmpty()
    ]
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { email, taskIds } = req.body;

    try {
        const users = await getSheetData('Users');
        const recipient = users.slice(1).find(user => user[2] === email);
        if (!recipient) return res.status(404).json({ message: 'User not found' });

        const tasks = await getSheetData('Tasks');
        const updatedTasks = tasks.map(task => {
            if (taskIds.includes(task[0]) && task[1] === req.user.id) {
                let sharedWith = task[7] ? task[7].split(',').map(id => id.trim()) : [];
                if (!sharedWith.includes(recipient[0])) {
                    sharedWith.push(recipient[0]);
                }
                task[7] = sharedWith.join(', ');
            }
            return task;
        });

        await sheets.spreadsheets.values.update({
            spreadsheetId: process.env.GOOGLE_SHEET_ID,
            range: 'Tasks',
            valueInputOption: 'USER_ENTERED',
            resource: { values: updatedTasks },
        });

        res.status(200).json({ message: 'Tasks shared successfully' });
    } catch (error) {
        console.error('Error sharing tasks:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;