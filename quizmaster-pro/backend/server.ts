
// @ts-nocheck
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const http = require('http');
const { Server } = require('socket.io');
const { User, Quiz, Result, Advertisement } = require('./models');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

const SECRET_KEY = process.env.JWT_SECRET || 'dev_secret';
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/quizmaster';

mongoose.connect(MONGO_URI).then(() => console.log('✅ MongoDB Connected'));

const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token = authHeader.split(' ')[1];
    jwt.verify(token, SECRET_KEY, (err, user) => {
      if (err) return res.sendStatus(403);
      req.user = user;
      next();
    });
  } else res.sendStatus(401);
};

const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') next();
  else res.status(403).json({ message: 'Brak uprawnień admina' });
};

// --- AUTH ---
app.post('/api/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ 
      username, 
      email, 
      password: hashedPassword, 
      role: username.includes('admin') ? 'admin' : 'user',
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + username
    });
    await user.save();
    const token = jwt.sign({ id: user._id, role: user.role }, SECRET_KEY);
    res.status(201).json({ token, user });
  } catch(e) { res.status(400).json({ message: e.message }); }
});

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (user && await bcrypt.compare(password, user.password)) {
    const token = jwt.sign({ id: user._id, role: user.role }, SECRET_KEY);
    res.json({ token, user });
  } else res.status(401).json({ message: 'Błąd logowania' });
});

app.get('/api/auth/me', authenticateJWT, async (req, res) => {
    // KLUCZOWE: Populujemy historię oraz zagnieżdżony quizId aby mieć dostęp do tytułu
    const user = await User.findById(req.user.id).populate({
        path: 'history',
        populate: { path: 'quizId', select: 'title' }
    });
    res.json(user);
});

app.put('/api/user/profile', authenticateJWT, async (req, res) => {
    const { username, avatarUrl } = req.body;
    const user = await User.findById(req.user.id);
    if (username) user.username = username;
    if (avatarUrl) user.avatarUrl = avatarUrl;
    await user.save();
    res.json({ user });
});

// --- QUIZZES ---
app.get('/api/quizzes', async (req, res) => res.json(await Quiz.find()));

app.get('/api/quizzes/:id', async (req, res) => {
    const quiz = await Quiz.findById(req.params.id);
    if(!quiz) return res.status(404).json({message: "Not found"});
    res.json(quiz);
});

app.post('/api/quizzes', authenticateJWT, isAdmin, async (req, res) => {
    try {
        const quiz = new Quiz({ ...req.body, author: req.user.id });
        await quiz.save();
        res.status(201).json(quiz);
    } catch(e) { 
        console.error("Quiz creation error:", e);
        res.status(400).json({ message: "Błąd walidacji: " + e.message }); 
    }
});

app.put('/api/quizzes/:id', authenticateJWT, isAdmin, async (req, res) => {
    try {
        const updated = await Quiz.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(updated);
    } catch(e) {
        res.status(400).json({ message: "Błąd aktualizacji: " + e.message });
    }
});

app.post('/api/quizzes/import', authenticateJWT, isAdmin, async (req, res) => {
    try {
        const quizzes = req.body;
        const formatted = quizzes.map(q => ({
            ...q,
            author: req.user.id,
            _id: new mongoose.Types.ObjectId()
        }));
        const created = await Quiz.insertMany(formatted);
        res.status(201).json(created);
    } catch(e) { res.status(400).json({ message: e.message }); }
});

app.delete('/api/quizzes/:id', authenticateJWT, isAdmin, async (req, res) => {
    await Quiz.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
});

// --- SOCIAL ---
app.get('/api/users/search', authenticateJWT, async (req, res) => {
    const { q } = req.query;
    const users = await User.find({ 
        username: { $regex: q || "", $options: 'i' },
        _id: { $ne: req.user.id }
    }).select('username avatarUrl winstreak _id');
    res.json(users);
});

app.get('/api/friends', authenticateJWT, async (req, res) => {
    const user = await User.findById(req.user.id)
        .populate('friends', 'username winstreak avatarUrl')
        .populate('friendRequests', 'username avatarUrl');
    res.json({ friends: user.friends || [], requests: user.friendRequests || [] });
});

app.post('/api/friends/request', authenticateJWT, async (req, res) => {
    const { targetUserId } = req.body;
    await User.findByIdAndUpdate(targetUserId, { $addToSet: { friendRequests: req.user.id } });
    res.json({ message: 'Sent' });
});

app.post('/api/friends/accept', authenticateJWT, async (req, res) => {
    const { requesterId } = req.body;
    await User.findByIdAndUpdate(req.user.id, { 
        $addToSet: { friends: requesterId },
        $pull: { friendRequests: requesterId }
    });
    await User.findByIdAndUpdate(requesterId, { $addToSet: { friends: req.user.id } });
    res.json({ message: 'Accepted' });
});

// --- ADS ---
app.get('/api/ads', authenticateJWT, isAdmin, async (req, res) => res.json(await Advertisement.find()));
app.get('/api/ads/active', async (req, res) => res.json(await Advertisement.find({ active: true })));

app.post('/api/ads', authenticateJWT, isAdmin, async (req, res) => {
    try {
        const ad = new Advertisement(req.body);
        await ad.save();
        res.status(201).json(ad);
    } catch(e) {
        res.status(400).json({ message: e.message });
    }
});

app.put('/api/ads/:id', authenticateJWT, isAdmin, async (req, res) => {
    try {
        const updated = await Advertisement.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(updated);
    } catch(e) {
        res.status(400).json({ message: e.message });
    }
});

app.delete('/api/ads/:id', authenticateJWT, isAdmin, async (req, res) => {
    await Advertisement.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
});

// --- RESULTS ---
app.get('/api/leaderboard', async (req, res) => {
    const results = await Result.find()
        .sort({ score: -1 })
        .limit(50)
        .populate('userId', 'username winstreak avatarUrl')
        .populate('quizId', 'title');
    res.json(results);
});

app.post('/api/results', authenticateJWT, async (req, res) => {
    try {
        const result = new Result({ ...req.body, userId: req.user.id });
        await result.save();
        const user = await User.findById(req.user.id);
        user.history.push(result._id);
        if (req.body.quizType === 'duel' && req.body.won) user.winstreak++;
        else if (req.body.quizType === 'duel') user.winstreak = 0;
        await user.save();
        res.json({ message: 'Saved' });
    } catch(e) { res.status(400).json({ error: e.message }); }
});

// --- SOCKET.IO ---
const activeUsers = new Map(); // userId -> socketId
const waitingQueue = []; 

io.on('connection', (socket) => {
    socket.on('register_user', (userId) => {
        activeUsers.set(userId, socket.id);
    });

    socket.on('challenge_friend', ({ friendId, quizId, challengerName, challengerAvatar }) => {
        const friendSocketId = activeUsers.get(friendId);
        if (friendSocketId) {
            io.to(friendSocketId).emit('incoming_challenge', {
                challengerUserId: [...activeUsers.entries()].find(([k,v]) => v === socket.id)?.[0],
                challengerName, challengerAvatar, quizId
            });
        }
    });

    socket.on('accept_challenge', ({ challengerUserId, quizId }) => {
        const challengerSocketId = activeUsers.get(challengerUserId);
        const roomId = `room_${Date.now()}`;
        if (challengerSocketId) {
            socket.join(roomId);
            io.to(challengerSocketId).socketsJoin(roomId);
            io.to(roomId).emit('match_found', { roomId, quizId });
        }
    });

    socket.on('join_duel', ({ userId, username, avatarUrl, quizId }) => {
        const opponentIndex = waitingQueue.findIndex(p => p.quizId === quizId && p.userId !== userId);
        if (opponentIndex > -1) {
            const opponent = waitingQueue.splice(opponentIndex, 1)[0];
            const roomId = `duel_${userId}_${opponent.userId}`;
            socket.join(roomId);
            const opponentSocket = io.sockets.sockets.get(opponent.socketId);
            if (opponentSocket) opponentSocket.join(roomId);
            
            io.to(roomId).emit('match_found', { 
                roomId, quizId,
                players: [
                    { userId, username, avatarUrl },
                    { userId: opponent.userId, username: opponent.username, avatarUrl: opponent.avatarUrl }
                ]
            });
        } else {
            waitingQueue.push({ socketId: socket.id, userId, username, avatarUrl, quizId });
        }
    });

    socket.on('send_progress', ({ roomId, score, progress }) => {
        socket.to(roomId).emit('opponent_update', { score, progress });
    });

    socket.on('finish_duel', ({ roomId, score }) => {
        socket.to(roomId).emit('opponent_finished', { score });
    });

    socket.on('disconnect', () => {
        activeUsers.forEach((v, k) => { if(v === socket.id) activeUsers.delete(k); });
        const idx = waitingQueue.findIndex(p => p.socketId === socket.id);
        if(idx > -1) waitingQueue.splice(idx, 1);
    });
});

server.listen(5000, () => console.log('🚀 Server Quizyx Red Edition on 5000'));
