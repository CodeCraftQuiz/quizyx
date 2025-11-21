const express = require('express');
const router = express.Router();
const User = require('../models/User');
const QuizAttempt = require('../models/QuizAttempt');
const { protect } = require('../middleware/authMiddleware');
const bcrypt = require('bcryptjs');

// Get User Profile & Stats
router.get('/me', protect, async (req, res) => {
    res.json(req.user);
});

// Get User History
router.get('/me/history', protect, async (req, res) => {
    try {
        const attempts = await QuizAttempt.find({ userId: req.user._id })
            .sort({ createdAt: -1 })
            .populate('quizId', 'title');
        res.json(attempts);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get User Stats (Calculated)
router.get('/me/stats', protect, async (req, res) => {
    try {
        const attempts = await QuizAttempt.find({ userId: req.user._id });
        const totalQuizzes = attempts.length;
        const totalCorrect = attempts.reduce((acc, curr) => acc + curr.correctCount, 0);
        // Simple stats logic
        res.json({
            totalQuizzesPlayed: totalQuizzes,
            totalCorrectAnswers: totalCorrect,
            // ... other stats
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Change Username
router.patch('/me/username', protect, async (req, res) => {
    const { newUsername } = req.body;
    const user = await User.findById(req.user._id);

    if (user.lastUsernameChangeAt) {
        const daysSinceChange = (Date.now() - new Date(user.lastUsernameChangeAt)) / (1000 * 60 * 60 * 24);
        if (daysSinceChange < 7) {
            return res.status(400).json({ message: 'Możesz zmienić nazwę tylko raz na tydzień.' });
        }
    }

    user.username = newUsername;
    user.lastUsernameChangeAt = Date.now();
    await user.save();

    res.json({ message: 'Nazwa użytkownika zmieniona.' });
});

// Delete Account
router.delete('/me', protect, async (req, res) => {
    const { email, username, password } = req.body;

    try {
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ message: 'Użytkownik nie znaleziony' });
        }

        // Weryfikacja danych
        const isEmailValid = user.email === email;
        const isUsernameValid = user.username === username;
        const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

        if (!isEmailValid || !isUsernameValid || !isPasswordValid) {
            return res.status(400).json({ message: 'Nieprawidłowe dane weryfikacyjne (email, nazwa lub hasło).' });
        }

        // Usunięcie użytkownika
        await User.findByIdAndDelete(req.user._id);
        
        // Usunięcie powiązanych danych (opcjonalne - np. historia gier)
        await QuizAttempt.deleteMany({ userId: req.user._id });

        res.json({ message: 'Konto zostało usunięte pomyślnie.' });
    } catch (error) {
        res.status(500).json({ message: 'Błąd serwera: ' + error.message });
    }
});

module.exports = router;
