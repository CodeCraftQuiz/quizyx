// @ts-nocheck
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  // Changed default to an online generator so it works without local files
  avatarUrl: { type: String, default: 'https://api.dicebear.com/7.x/avataaars/svg?seed=NewUser' },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  lastUsernameChange: { type: Date },
  history: [{ type: Schema.Types.ObjectId, ref: 'Result' }],
  winstreak: { type: Number, default: 0 },
  maxWinstreak: { type: Number, default: 0 },
  friends: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  friendRequests: [{ type: Schema.Types.ObjectId, ref: 'User' }]
});

const QuestionSchema = new Schema({
  content: { type: String, required: true },
  answers: [{ type: String, required: true }],
  correctAnswers: [{ type: Number, required: true }],
  type: { type: String, enum: ['single', 'multi'], default: 'single' }
});

const QuizSchema = new Schema({
  title: { type: String, required: true },
  description: String,
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
  type: { type: String, enum: ['standard', 'exam', 'infinity', 'duel', 'millionaire'], default: 'standard' },
  questions: [QuestionSchema],
  author: { type: Schema.Types.ObjectId, ref: 'User' },
  timeLimit: Number
});

const ResultSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  quizId: { type: Schema.Types.ObjectId, ref: 'Quiz', required: true },
  quizType: { type: String, enum: ['standard', 'exam', 'infinity', 'duel', 'millionaire'] },
  score: { type: Number, required: true },
  maxScore: Number,
  timeSpent: Number,
  date: { type: Date, default: Date.now },
  userWinstreak: Number 
});

const AdSchema = new Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  location: { type: String, enum: ['home_top', 'quiz_sidebar', 'popup', 'fullscreen'], required: true },
  triggerType: { 
      type: String, 
      enum: ['onLogin', 'onQuizStart', 'onQuizEnd', 'onProfileView', 'onSocialView'], 
      required: true 
  },
  triggerValue: Number,
  priority: { type: Number, default: 1 },
  active: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = {
  User: mongoose.model('User', UserSchema),
  Quiz: mongoose.model('Quiz', QuizSchema),
  Result: mongoose.model('Result', ResultSchema),
  Advertisement: mongoose.model('Advertisement', AdSchema)
};