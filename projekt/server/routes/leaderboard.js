const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const User = require('../models/User');
const QuizAttempt = require('../models/QuizAttempt');

// Global Leaderboard (Top Users by Total Correct Answers or similar metric)
// Since we don't have a global "score" field on User, let's use totalCorrectAnswers
router.get('/global', async (req, res) => {
    try {
        const users = await User.find({})
            .sort({ 'stats.totalCorrectAnswers': -1 })
            .limit(10)
            .select('username stats.totalCorrectAnswers');
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Quiz Leaderboard (Top Attempts for a specific quiz - Best score per user)
router.get('/quiz/:quizId', async (req, res) => {
    try {
        const attempts = await QuizAttempt.aggregate([
            { $match: { quizId: new mongoose.Types.ObjectId(req.params.quizId) } },
            { $sort: { score: -1 } },
            {
                $group: {
                    _id: "$userId",
                    doc: { $first: "$$ROOT" }
                }
            },
            { $replaceRoot: { newRoot: "$doc" } },
            { $sort: { score: -1 } },
            { $limit: 10 },
            {
                $lookup: {
                    from: "users",
                    localField: "userId",
                    foreignField: "_id",
                    as: "userId"
                }
            },
            { $unwind: "$userId" },
            {
                $project: {
                    score: 1,
                    "userId.username": 1,
                    "userId._id": 1
                }
            }
        ]);
        res.json(attempts);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
