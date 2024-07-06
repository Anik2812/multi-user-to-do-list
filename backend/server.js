require('dotenv').config();  // Load environment variables from .env file
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const taskRoutes = require('./routes/tasks');

// Initialize Express app
const app = express();

// Middleware
app.use(cors({ origin: '*' }));  // Allow all origins for now; in production, configure specific origins
app.use(express.json());  // Parse JSON bodies

// Connect to MongoDB
mongoose.connect('mongodb+srv://myAtlasDBUser:coc28125@cluster0.p4mtziw.mongodb.net/', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);

// Add this route to server.js
app.get('/api/user', (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'No token provided' });

    jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
        if (err) return res.status(401).json({ message: 'Invalid token' });

        try {
            const user = await User.findById(decoded.userId);
            if (!user) return res.status(404).json({ message: 'User not found' });

            res.json({ user });
        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    });
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