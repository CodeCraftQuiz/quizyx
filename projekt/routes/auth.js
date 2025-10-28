const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { validateRegister, validateLogin } = require('../utils/validate');
require('dotenv').config();

const router = express.Router();

// Rejestracja
router.post('/register', async (req, res) => {
  const { error } = validateRegister(req.body);
  if (error) {
    return res.status(400).json({
      message: 'Błędy walidacji',
      details: error.details.map(d => d.message),
    });
  }

  const { email, password } = req.body;

  try {
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ message: 'Użytkownik o tym e-mailu już istnieje' });

    user = new User({ email, password });
    await user.save();

    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 1000 * 60 * 60 * 24 * parseInt(process.env.COOKIE_EXPIRES || '7'),
    });

    res.status(201).json({ message: 'Zarejestrowano pomyślnie' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Błąd serwera podczas rejestracji' });
  }
});

// Logowanie
router.post('/login', async (req, res) => {
  const { error } = validateLogin(req.body);
  if (error) {
    return res.status(400).json({
      message: 'Błędy walidacji',
      details: error.details.map(d => d.message),
    });
  }

  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Nieprawidłowy e-mail lub hasło' });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(400).json({ message: 'Nieprawidłowy e-mail lub hasło' });

    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 1000 * 60 * 60 * 24 * parseInt(process.env.COOKIE_EXPIRES || '7'),
    });

    res.json({ message: 'Zalogowano pomyślnie' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Błąd serwera podczas logowania' });
  }
});

// Wylogowanie
router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Wylogowano pomyślnie' });
});

module.exports = router;