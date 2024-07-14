require('dotenv').config();
const mongoose = require('mongoose');
const { GoogleSpreadsheet } = require('google-spreadsheet');
const fs = require('fs');

// Import your models
const User = require('./models/User');
const Task = require('./models/Task');

// Load the service account credentials
const creds = JSON.parse(fs.readFileSync('./google-sheets-credentials.json'));

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

async function exportToSheets() {
    try {
        // Initialize the sheet
        const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID);
        await doc.useServiceAccountAuth(creds);
        await doc.loadInfo();

        // Export Users
        const usersSheet = doc.sheetsByIndex[0];
        await usersSheet.clear();
        await usersSheet.setHeaderRow(['_id', 'name', 'email', 'password', 'resetPasswordToken', 'resetPasswordExpires', 'avatar']);
        const users = await User.find({});
        await usersSheet.addRows(users.map(user => user.toObject()));

        // Export Tasks
        const tasksSheet = doc.sheetsByIndex[1];
        await tasksSheet.clear();
        await tasksSheet.setHeaderRow(['_id', 'user', 'title', 'description', 'dueDate', 'completed', 'important', 'sharedWith']);
        const tasks = await Task.find({});
        const formattedTasks = tasks.map(task => ({
            ...task.toObject(),
            user: task.user.toString(),
            sharedWith: task.sharedWith.join(', ')
        }));
        await tasksSheet.addRows(formattedTasks);

        console.log('Export completed successfully');
    } catch (error) {
        console.error('Export failed:', error);
    } finally {
        mongoose.disconnect();
    }
}

exportToSheets();