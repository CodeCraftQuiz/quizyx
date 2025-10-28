const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');
const mainRoutes = require('./routes/index');

const app = express();
const PORT = process.env.PORT || 5000;

connectDB();

// Zezwól na żądania z tego samego originu (bo frontend i backend na localhost)
app.use(cors({
  origin: 'http://localhost:5000',
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());

// Serwowanie plików statycznych
app.use(express.static(path.join(__dirname, 'public')));

// API
app.use('/api/auth', authRoutes);
app.use('/api', mainRoutes);

// Obsługa SPA — przekierowanie wszystkich tras do index.html (opcjonalne)
app.get('/register', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'register.html'));
});

app.get('/profile', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'profile.html'));
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Serwer działa na http://localhost:${PORT}`);
});