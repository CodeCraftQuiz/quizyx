const express = require('express');
const router = express.Router();
const Quiz = require('../models/Quiz');
const { protect, admin } = require('../middleware/authMiddleware');

// Get all quizzes (with filters)
router.get('/', async (req, res) => {
    const { mode, difficulty } = req.query;
    let query = { isActive: true };

    if (mode) query.mode = mode;
    if (difficulty) query.difficulty = difficulty;

    try {
        const quizzes = await Quiz.find(query).select('-questions.answers.isCorrect'); // Hide answers in list? Actually list doesn't need questions
        res.json(quizzes);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get Infinity Mode Questions (Random pool)
router.get('/infinity', protect, async (req, res) => {
    try {
        // Aggregate to get random questions from all quizzes
        const questions = await Quiz.aggregate([
            { $match: { isActive: true } },
            { $unwind: "$questions" },
            { $sample: { size: 50 } }, // Get 50 random questions
            { $project: { 
                _id: "$questions._id",
                text: "$questions.text",
                answers: "$questions.answers",
                points: "$questions.points",
                quizId: "$_id"
            }}
        ]);
        res.json({ title: "Infinity Mode", questions });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get single quiz
router.get('/:id', protect, async (req, res) => {
    try {
        const quiz = await Quiz.findById(req.params.id);
        if (quiz) {
            res.json(quiz);
        } else {
            res.status(404).json({ message: 'Quiz nie znaleziony' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Create Quiz (Admin)
router.post('/', protect, admin, async (req, res) => {
    try {
        const quiz = new Quiz({
            ...req.body,
            createdBy: req.user._id
        });
        const createdQuiz = await quiz.save();
        res.status(201).json(createdQuiz);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Delete Quiz (Admin)
router.delete('/:id', protect, admin, async (req, res) => {
    try {
        const quiz = await Quiz.findById(req.params.id);
        if (quiz) {
            await quiz.deleteOne();
            res.json({ message: 'Quiz usunięty' });
        } else {
            res.status(404).json({ message: 'Quiz nie znaleziony' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Update Quiz (Admin)
router.patch('/:id', protect, admin, async (req, res) => {
    try {
        const quiz = await Quiz.findById(req.params.id);
        if (quiz) {
            Object.assign(quiz, req.body);
            const updatedQuiz = await quiz.save();
            res.json(updatedQuiz);
        } else {
            res.status(404).json({ message: 'Quiz nie znaleziony' });
        }
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Get Quiz Stats
router.get('/:id/stats', protect, async (req, res) => {
    // This would require aggregating attempts, implemented simply for now
    res.json({ message: "Statystyki quizu - do zaimplementowania w agregacji" });
});

module.exports = router;
