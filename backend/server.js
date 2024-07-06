require('dotenv').config({ path: './backend/.env' });  // Ensure this path points to the .env file

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const taskRoutes = require('./routes/tasks');
const User = require('./models/User');  // Import User model
const jwt = require('jsonwebtoken');    // Import JWT for token verification
const authMiddleware = require('./middleware/auth');  // Import authMiddleware

// Initialize Express app
const app = express();

// Middleware
app.use(cors({ origin: '*' }));  // Allow all origins for now; in production, configure specific origins
app.use(express.json());  // Parse JSON bodies

// Log the MONGODB_URI to verify it is loaded
console.log('MongoDB URI:', process.env.MONGODB_URI);

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);

// Add this route for getting user info
app.get('/api/auth/user', authMiddleware, async (req, res) => {
    try {
        res.status(200).json({ user: req.user });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
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
const PORT = process.env.PORT || 5000;  // Default port to 5000
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
