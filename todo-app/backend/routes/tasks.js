// backend/routes/tasks.js
const express = require('express');
const Task = require('../models/Task');
const authMiddleware = require('../middleware/auth');
const router = express.Router();

router.post('/', authMiddleware, async (req, res) => {
  const task = new Task(req.body);
  await task.save();
  res.status(201).json(task);
});

router.get('/', authMiddleware, async (req, res) => {
  const tasks = await Task.find().populate('assignee');
  res.status(200).json(tasks);
});

router.get('/search', authMiddleware, async (req, res) => {
  const { title, assignee, dueDate, status, priority } = req.query;
  const query = {};
  if (title) query.title = { $regex: title, $options: 'i' };
  if (assignee) query.assignee = assignee;
  if (dueDate) query.dueDate = dueDate;
  if (status) query.status = status;
  if (priority) query.priority = priority;
  const tasks = await Task.find(query).populate('assignee');
  res.status(200).json(tasks);
});

router.put('/:id', authMiddleware, async (req, res) => {
  const task = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.status(200).json(task);
});

router.delete('/:id', authMiddleware, async (req, res) => {
  await Task.findByIdAndDelete(req.params.id);
  res.status(200).json({ message: 'Task deleted' });
});

module.exports = router;
