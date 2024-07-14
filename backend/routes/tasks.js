const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const User = require('../models/User');
const Task = require('../models/Task');

// @route    POST /api/tasks
// @desc     Create a new task
// @access   Private
router.post(
    '/',
    [
        auth,
        [
            check('title', 'Title is required').notEmpty(),
            check('description', 'Description is required').notEmpty(),
        ]
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const { title, description, dueDate, important } = req.body;

            const newTask = new Task({
                user: req.user.id,
                title,
                description,
                dueDate,
                important: important || false
            });

            const task = await newTask.save();
            res.json(task);
        } catch (err) {
            console.error('Error creating task:', err);
            res.status(500).json({ message: 'Server error' });
        }
    }
);

// @route    GET /api/tasks
// @desc     Get all tasks for a user
// @access   Private
router.get('/', auth, async (req, res) => {
    try {
        const tasks = await Task.find({ user: req.user.id }).sort({ dueDate: 1 });
        res.json(tasks);
    } catch (err) {
        console.error('Error fetching tasks:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route    GET /api/tasks/shared
// @desc     Get shared tasks
// @access   Private
router.get('/shared', auth, async (req, res) => {
    try {
        const sharedTasks = await Task.find({ sharedWith: req.user.id }).sort({ dueDate: 1 });
        res.json(sharedTasks);
    } catch (err) {
        console.error('Error fetching shared tasks:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route    GET /api/tasks/:id
// @desc     Get a specific task
// @access   Private
router.get('/:id', auth, async (req, res) => {
    try {
        const task = await Task.findById(req.params.id);
        
        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        if (task.user.toString() !== req.user.id && !task.sharedWith.includes(req.user.id)) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        res.json(task);
    } catch (err) {
        console.error('Error fetching task:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route    PUT /api/tasks/:id
// @desc     Update a task
// @access   Private
router.put('/:id', auth, async (req, res) => {
    try {
        let task = await Task.findById(req.params.id);

        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        if (task.user.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const { title, description, dueDate, completed, important } = req.body;

        if (title) task.title = title;
        if (description) task.description = description;
        if (dueDate) task.dueDate = dueDate;
        if (completed !== undefined) task.completed = completed;
        if (important !== undefined) task.important = important;

        await task.save();

        res.json(task);
    } catch (err) {
        console.error('Error updating task:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route    DELETE /api/tasks/:id
// @desc     Delete a task
// @access   Private
router.delete('/:id', auth, async (req, res) => {
    try {
        const task = await Task.findById(req.params.id);

        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        if (task.user.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        await Task.findByIdAndDelete(req.params.id);

        res.json({ message: 'Task removed' });
    } catch (err) {
        console.error('Error deleting task:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route    POST /api/tasks/share
// @desc     Share tasks with another user
// @access   Private
router.post(
    '/share',
    [
        auth,
        [
            check('email', 'Please include a valid email').isEmail(),
            check('taskIds', 'Task IDs are required').isArray().notEmpty()
        ]
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { email, taskIds } = req.body;

        try {
            const recipient = await User.findOne({ email });
            if (!recipient) return res.status(404).json({ message: 'User not found' });

            const tasks = await Task.find({
                _id: { $in: taskIds },
                user: req.user.id
            });

            if (tasks.length !== taskIds.length) {
                return res.status(400).json({ message: 'One or more tasks not found or not owned by you' });
            }

            await Task.updateMany(
                { _id: { $in: taskIds } },
                { $addToSet: { sharedWith: recipient._id } }
            );

            res.status(200).json({ message: 'Tasks shared successfully' });
        } catch (err) {
            console.error('Error sharing tasks:', err);
            res.status(500).json({ message: 'Server error' });
        }
    }
);

module.exports = router;