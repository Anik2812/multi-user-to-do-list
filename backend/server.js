const express = require('express');
const session = require('express-session');
const passport = require('passport');
const Auth0Strategy = require('passport-auth0');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const app = express();

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
        secure: false, // Set to true if using HTTPS
        httpOnly: true,
        maxAge: 86400000, // 24 hours
    },
}));

passport.use(new Auth0Strategy({
    domain: process.env.AUTH0_DOMAIN,
    clientID: process.env.AUTH0_CLIENT_ID,
    clientSecret: process.env.AUTH0_CLIENT_SECRET,
    callbackURL: process.env.AUTH0_CALLBACK_URL,
}, (accessToken, refreshToken, extraParams, profile, done) => {
    return done(null, profile);
}));

passport.serializeUser((user, done) => {
    done(null, user);
});

passport.deserializeUser((user, done) => {
    done(null, user);
});

app.use(passport.initialize());
app.use(passport.session());

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    if (req.isAuthenticated()) {
        res.send('Welcome to the homepage!'); // Or you can serve the index.html file
    } else {
        res.send('<h1>Home Page</h1><a href="/login">Login</a>'); // Basic HTML for the home page with a login link
    }
});

app.get('/login', (req, res) => {
    res.redirect('/auth0');
});

app.get('/auth0', passport.authenticate('auth0', {
    scope: 'openid email profile',
}));

app.get('/callback', passport.authenticate('auth0', {
    failureRedirect: '/',
}), (req, res) => {
    res.redirect('/'); // Redirect to the main page or dashboard
});

app.get('/logout', (req, res) => {
    req.logout();
    res.redirect('/');
});

app.get('/user', (req, res) => {
    res.json({ user: req.user });
});

// Example of a protected route
app.get('/protected', (req, res) => {
    if (req.isAuthenticated()) {
        res.send('This is a protected route');
    } else {
        res.redirect('/login');
    }
});

app.listen(8000, () => {
    console.log('Server is running on http://localhost:8000');
});
