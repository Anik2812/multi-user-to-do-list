const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const app = express();
app.use(cors());
app.use(express.json());

const users = [];
const todos = {};

app.post('/register', (req, res) => {
  const { username, password } = req.body;
  if (users.find(u => u.username === username)) {
    return res.status(400).json({ message: 'User already exists' });
  }
  const hashedPassword = bcrypt.hashSync(password, 8);
  users.push({ username, password: hashedPassword });
  todos[username] = [];
  res.status(201).json({ message: 'User created successfully' });
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.username === username);
  if (user && bcrypt.compareSync(password, user.password)) {
    const token = jwt.sign({ username }, 'secret_key', { expiresIn: '1h' });
    res.json({ token });
  } else {
    res.status(400).json({ message: 'Invalid credentials' });
  }
});

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (token == null) return res.sendStatus(401);

  jwt.verify(token, 'secret_key', (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

app.get('/todos', authenticateToken, (req, res) => {
  res.json(todos[req.user.username]);
});

app.post('/todos', authenticateToken, (req, res) => {
  todos[req.user.username].push(req.body);
  res.status(201).json(req.body);
});

app.put('/todos/:id', authenticateToken, (req, res) => {
  const id = parseInt(req.params.id);
  const index = todos[req.user.username].findIndex(t => t.id === id);
  if (index !== -1) {
    todos[req.user.username][index] = { ...todos[req.user.username][index], ...req.body };
    res.json(todos[req.user.username][index]);
  } else {
    res.status(404).json({ message: 'Todo not found' });
  }
});

app.delete('/todos/:id', authenticateToken, (req, res) => {
  const id = parseInt(req.params.id);
  todos[req.user.username] = todos[req.user.username].filter(t => t.id !== id);
  res.status(204).send();
});

app.listen(5000, () => console.log('Server running on port 5000'));