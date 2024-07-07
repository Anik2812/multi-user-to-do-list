// backend/routes/tasks.js
const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const User = require('../models/User');
const Task = require('../models/Task');

// @route    POST /tasks/share
// @desc     Share tasks with another user
// @access   Private
router.post(
    '/share',
    [auth, [check('email', 'Please include a valid email').isEmail()]],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { email } = req.body;

        try {
            // Find the user to share tasks with
            const recipient = await User.findOne({ email });
            if (!recipient) return res.status(404).json({ message: 'User not found' });

            // Share tasks logic
            // ...

            res.status(200).json({ message: 'Tasks shared successfully' });
        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    }
);

// GET all tasks for a user
router.get('/', auth, async (req, res) => {
    try {
      const tasks = await Task.find({ user: req.user.id });
      res.json(tasks);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });

  // GET shared tasks
router.get('/shared', auth, async (req, res) => {
    try {
      const sharedTasks = await Task.find({ sharedWith: req.user.id });
      res.json(sharedTasks);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });

// Other task routes...

module.exports = router;
