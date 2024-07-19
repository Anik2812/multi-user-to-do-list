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
            'false',
            important ? 'true' : 'false',
            ''
        ];
        await appendRow('Tasks', newTask);
        res.status(201).json(newTask);
    } catch (error) {
        console.error('Error creating task:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get all tasks for a user
router.get('/', authMiddleware, async (req, res) => {
    try {
      const tasks = await getSheetData('Tasks');
      const userTasks = tasks
        .filter(task => task[1] === req.user.id)
        .map(task => ({
          _id: task[0],
          user: task[1],
          title: task[2],
          description: task[3],
          dueDate: task[4],
          completed: task[5] === 'true',
          important: task[6] === 'true',
          sharedWith: task[7] ? task[7].split(',').map(id => id.trim()) : []
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
        });
        res.json(sharedTasks);
    } catch (error) {
        console.error('Error fetching shared tasks:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update a task
router.put('/:id', authMiddleware, async (req, res) => {
    try {
        const tasks = await getSheetData('Tasks');
        const taskIndex = tasks.findIndex(task => task[0] === req.params.id && task[1] === req.user.id);

        if (taskIndex === -1) {
            return res.status(404).json({ message: 'Task not found' });
        }

        const { title, description, dueDate, completed, important } = req.body;

        tasks[taskIndex][2] = title || tasks[taskIndex][2];
        tasks[taskIndex][3] = description || tasks[taskIndex][3];
        tasks[taskIndex][4] = dueDate || tasks[taskIndex][4];
        tasks[taskIndex][5] = completed !== undefined ? completed.toString() : tasks[taskIndex][5];
        tasks[taskIndex][6] = important !== undefined ? important.toString() : tasks[taskIndex][6];

        await sheets.spreadsheets.values.update({
            spreadsheetId: process.env.GOOGLE_SHEET_ID,
            range: `Tasks!A${taskIndex + 1}:H${taskIndex + 1}`,
            valueInputOption: 'USER_ENTERED',
            resource: { values: [tasks[taskIndex]] },
        });

        res.json(tasks[taskIndex]);
    } catch (error) {
        console.error('Error updating task:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete a task
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
      console.log('Attempting to delete task:', req.params.id);
      const tasks = await getSheetData('Tasks');
      const taskIndex = tasks.findIndex(task => task[0] === req.params.id && task[1] === req.user.id);
  
      if (taskIndex === -1) {
        console.log('Task not found:', req.params.id);
        return res.status(404).json({ message: 'Task not found' });
      }

        tasks.splice(taskIndex, 1);

        await sheets.spreadsheets.values.clear({
            spreadsheetId: process.env.GOOGLE_SHEET_ID,
            range: 'Tasks',
        });

        if (tasks.length > 0) {
            await sheets.spreadsheets.values.update({
                spreadsheetId: process.env.GOOGLE_SHEET_ID,
                range: 'Tasks',
                valueInputOption: 'USER_ENTERED',
                resource: { values: tasks },
            });
        }

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
        const recipient = users.find(user => user[2] === email);
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