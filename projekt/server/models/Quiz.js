const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
    text: { type: String, required: true },
    answers: [{
        text: { type: String, required: true },
        isCorrect: { type: Boolean, default: false }
    }],
    points: { type: Number, default: 1 }
});

const quizSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String },
    category: { type: String, default: 'General' },
    mode: { 
        type: String, 
        enum: ['STANDARD', 'RANKED', 'EXAM', 'MILLIONAIRE', 'INFINITY'], 
        default: 'STANDARD' 
    },
    difficulty: { 
        type: String, 
        enum: ['EASY', 'MEDIUM', 'HARD'], 
        default: 'MEDIUM' 
    },
    questions: [questionSchema],
    isActive: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('Quiz', quizSchema);
