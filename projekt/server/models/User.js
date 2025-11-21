const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['USER', 'ADMIN'], default: 'USER' },
    stats: {
        totalQuizzesPlayed: { type: Number, default: 0 },
        totalCorrectAnswers: { type: Number, default: 0 },
        bestStreak: { type: Number, default: 0 },
        currentStreak: { type: Number, default: 0 }
    },
    lastUsernameChangeAt: { type: Date, default: null }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
