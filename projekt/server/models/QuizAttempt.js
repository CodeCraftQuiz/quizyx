const mongoose = require('mongoose');

const quizAttemptSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    quizId: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz' }, // Optional for Infinity mode
    mode: { type: String, required: true },
    difficulty: { type: String },
    score: { type: Number, default: 0 },
    correctCount: { type: Number, default: 0 },
    incorrectCount: { type: Number, default: 0 },
    timeTaken: { type: Number, default: 0 }, // in seconds
    answers: [{
        questionId: mongoose.Schema.Types.ObjectId,
        isCorrect: Boolean
    }],
    startedAt: { type: Date, default: Date.now },
    finishedAt: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('QuizAttempt', quizAttemptSchema);
