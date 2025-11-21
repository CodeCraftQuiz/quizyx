const express = require('express');
const router = express.Router();
const QuizAttempt = require('../models/QuizAttempt');
const User = require('../models/User');
const { protect } = require('../middleware/authMiddleware');

// Save Attempt
router.post('/', protect, async (req, res) => {
    const { quizId, mode, difficulty, score, correctCount, incorrectCount, timeTaken, answers } = req.body;

    try {
        const attempt = await QuizAttempt.create({
            userId: req.user._id,
            quizId,
            mode,
            difficulty,
            score,
            correctCount,
            incorrectCount,
            timeTaken,
            answers
        });

        // Update User Stats
        const user = await User.findById(req.user._id);
        user.stats.totalQuizzesPlayed += 1;
        user.stats.totalCorrectAnswers += correctCount;
        // Logic for streaks could go here
        await user.save();

        res.status(201).json(attempt);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

module.exports = router;
