// app.js

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

// CORS — zezwól na żądania z localhost:3000 i 5000
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5000'],
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());

// ✅ 1. Najpierw serwuj pliki statyczne z build/
app.use(express.static(path.join(__dirname, 'build')));

// ✅ 2. Potem API
app.use('/api/auth', authRoutes);
app.use('/api', mainRoutes);

// ✅ 3. Na końcu — fallback dla SPA (tylko jeśli żądany zasób nie istnieje)
app.get('*', (req, res) => {
  res.sendFile(path.resolve(__dirname, 'build', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Serwer działa na http://localhost:${PORT}`);
});