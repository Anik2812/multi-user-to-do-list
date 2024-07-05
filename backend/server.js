const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const taskRoutes = require('./routes/tasks');

// Initialize Express app
const app = express();

// Middleware
app.use(cors({ origin: '*' })); // Allow all origins for now, configure specific origins in production
app.use(express.json());  // Parse JSON bodies

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/taskmaster', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);

// Default route
app.get('/', (req, res) => {
    res.send('Welcome to TaskMaster Pro API');
});

// Error handling for undefined routes
app.use((req, res) => {
    res.status(404).send('Route not found');
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
