const mongoose = require('mongoose');

const duelSchema = new mongoose.Schema({
    quizId: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz' },
    playerOneName: { type: String, required: true },
    playerTwoName: { type: String, required: true },
    playerOneScore: { type: Number, default: 0 },
    playerTwoScore: { type: Number, default: 0 },
    winner: { type: String }, // Name of winner or 'DRAW'
    playedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Duel', duelSchema);
