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
const io = new Server(server, {
  cors: { origin: "*" }
});

const SECRET_KEY = process.env.JWT_SECRET || 'dev_secret';
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/quizmaster';

console.log("------------------------------------------------");
console.log("Starting QuizMaster Backend...");
console.log("MONGO_URI:", MONGO_URI);
console.log("------------------------------------------------");

// Connect DB
mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ MongoDB Connected Successfully'))
  .catch(err => {
      console.error('❌ MongoDB Connection Error:', err);
      process.exit(1);
  });

// Middleware
const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token = authHeader.split(' ')[1];
    jwt.verify(token, SECRET_KEY, (err, user) => {
      if (err) return res.sendStatus(403);
      req.user = user;
      next();
    });
  } else {
    res.sendStatus(401);
  }
};

// --- AUTH ROUTES ---
app.post('/api/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
        return res.status(400).json({ message: 'Użytkownik o takim emailu lub nazwie już istnieje.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Auto-grant admin role for 'admin' username for demo purposes
    const role = username.toLowerCase() === 'admin' ? 'admin' : 'user';
    
    const user = new User({ username, email, password: hashedPassword, role });
    await user.save();
    
    // Auto login after register
    const token = jwt.sign({ id: user._id, role: user.role }, SECRET_KEY);
    res.status(201).json({ 
        token, 
        user: { 
            _id: user._id, 
            username: user.username, 
            role: user.role,
            avatarUrl: user.avatarUrl,
            winstreak: 0,
            history: [],
            friends: [],
            friendRequests: []
        } 
    });
  } catch(e) { 
      console.error(e);
      res.status(500).json({ error: e.message }); 
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).populate({
        path: 'history',
        populate: { path: 'quizId', select: 'title' }
    });
    
    if (user && await bcrypt.compare(password, user.password)) {
        const token = jwt.sign({ id: user._id, role: user.role }, SECRET_KEY);
        
        // Transform history
        const formattedHistory = user.history.map(h => ({
            ...h.toObject(),
            quizTitle: h.quizId ? h.quizId.title : 'Deleted Quiz',
            quizId: h.quizId ? h.quizId._id : null
        }));

        res.json({ token, user: { 
            _id: user._id, 
            username: user.username, 
            role: user.role,
            avatarUrl: user.avatarUrl,
            lastUsernameChange: user.lastUsernameChange,
            winstreak: user.winstreak || 0,
            maxWinstreak: user.maxWinstreak || 0,
            friends: user.friends,
            friendRequests: user.friendRequests,
            history: formattedHistory
        }});
    } else {
        res.status(401).json({ message: 'Nieprawidłowy email lub hasło' });
    }
  } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get('/api/auth/me', authenticateJWT, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).populate({
            path: 'history',
            populate: { path: 'quizId', select: 'title' }
        });
        
        if (!user) return res.sendStatus(404);

        const formattedHistory = user.history.map(h => ({
            ...h.toObject(),
            quizTitle: h.quizId ? h.quizId.title : 'Deleted Quiz',
            quizId: h.quizId ? h.quizId._id : null
        }));

        res.json({ 
            _id: user._id, 
            username: user.username, 
            role: user.role, 
            avatarUrl: user.avatarUrl,
            lastUsernameChange: user.lastUsernameChange,
            winstreak: user.winstreak || 0,
            maxWinstreak: user.maxWinstreak || 0,
            friends: user.friends,
            friendRequests: user.friendRequests,
            history: formattedHistory
        });
    } catch (e) {
        console.error(e);
        res.sendStatus(500);
    }
});

app.put('/api/user/profile', authenticateJWT, async (req, res) => {
    const { username, avatarUrl } = req.body;
    const user = await User.findById(req.user.id);
    
    if (username && username !== user.username) {
        if (user.lastUsernameChange) {
            const diffTime = Math.abs(new Date() - new Date(user.lastUsernameChange));
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
            if (diffDays < 7) {
                return res.status(400).json({ message: `Możesz zmienić nick raz na 7 dni. Spróbuj za ${7 - diffDays} dni.` });
            }
        }
        user.username = username;
        user.lastUsernameChange = new Date();
    }

    if (avatarUrl) {
        user.avatarUrl = avatarUrl;
    }

    await user.save();
    res.json({ message: 'Profil zaktualizowany', user });
});

// --- SOCIAL ROUTES ---
app.get('/api/users/search', authenticateJWT, async (req, res) => {
    const { q } = req.query;
    if (!q) return res.json([]);
    const users = await User.find({ 
        username: { $regex: q, $options: 'i' }, 
        _id: { $ne: req.user.id } 
    }).select('_id username winstreak avatarUrl').limit(10);
    res.json(users);
});

app.post('/api/friends/request', authenticateJWT, async (req, res) => {
    const { targetUserId } = req.body;
    const targetUser = await User.findById(targetUserId);
    if (!targetUser) return res.status(404).json({ message: 'User not found' });
    
    if (targetUser.friendRequests.includes(req.user.id) || targetUser.friends.includes(req.user.id)) {
        return res.status(400).json({ message: 'Request already sent or already friends' });
    }
    
    targetUser.friendRequests.push(req.user.id);
    await targetUser.save();
    res.json({ message: 'Friend request sent' });
});

app.post('/api/friends/accept', authenticateJWT, async (req, res) => {
    const { requesterId } = req.body;
    const currentUser = await User.findById(req.user.id);
    const requester = await User.findById(requesterId);

    if (!currentUser.friends.includes(requesterId)) currentUser.friends.push(requesterId);
    currentUser.friendRequests = currentUser.friendRequests.filter(id => id.toString() !== requesterId);
    await currentUser.save();

    if (!requester.friends.includes(req.user.id)) requester.friends.push(req.user.id);
    await requester.save();

    res.json({ message: 'Friend accepted' });
});

app.get('/api/friends', authenticateJWT, async (req, res) => {
    const user = await User.findById(req.user.id)
        .populate('friends', 'username winstreak avatarUrl')
        .populate('friendRequests', 'username avatarUrl');
    
    res.json({
        friends: user.friends,
        requests: user.friendRequests
    });
});

// --- LEADERBOARD ---
app.get('/api/leaderboard', async (req, res) => {
    const results = await Result.find()
        .sort({ score: -1 })
        .limit(10)
        .populate('userId', 'username winstreak')
        .populate('quizId', 'title');
    
    const formatted = results.map(r => ({
        _id: r._id,
        username: r.userId ? r.userId.username : 'Unknown',
        userWinstreak: r.userId ? r.userId.winstreak : 0,
        quizTitle: r.quizId ? r.quizId.title : 'Deleted Quiz',
        score: r.score,
        date: r.date,
        quizType: r.quizType
    }));
    res.json(formatted);
});

// --- QUIZ ROUTES ---
app.get('/api/quizzes', async (req, res) => {
  const quizzes = await Quiz.find();
  res.json(quizzes);
});

app.post('/api/quizzes', authenticateJWT, async (req, res) => {
  if (req.user.role !== 'admin') return res.sendStatus(403);
  const quiz = new Quiz({ ...req.body, author: req.user.id });
  await quiz.save();
  res.json(quiz);
});

app.post('/api/quizzes/import', authenticateJWT, async (req, res) => {
    if (req.user.role !== 'admin') return res.sendStatus(403);
    const quizzes = req.body;
    if(!Array.isArray(quizzes)) return res.status(400).json({message: "Expected array of quizzes"});
    
    try {
        const created = await Quiz.insertMany(quizzes.map(q => ({...q, author: req.user.id})));
        res.json(created);
    } catch(e) { res.status(500).json({error: e.message}); }
});

app.put('/api/quizzes/:id', authenticateJWT, async (req, res) => {
  if (req.user.role !== 'admin') return res.sendStatus(403);
  const updatedQuiz = await Quiz.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(updatedQuiz);
});

app.delete('/api/quizzes/:id', authenticateJWT, async (req, res) => {
  if (req.user.role !== 'admin') return res.sendStatus(403);
  await Quiz.findByIdAndDelete(req.params.id);
  res.json({ message: 'Deleted' });
});

// --- RESULTS (NEW) ---
app.post('/api/results', authenticateJWT, async (req, res) => {
    try {
        const resultData = req.body;
        // Verify user ID matches token just in case
        if (resultData.userId !== req.user.id) {
            return res.status(403).json({ message: "User mismatch" });
        }

        const result = new Result({ ...resultData, userId: req.user.id });
        await result.save();

        // Update User History logic
        const user = await User.findById(req.user.id);
        user.history.push(result._id);
        
        // Simple Winstreak Update for duel
        if (result.quizType === 'duel') {
            if (result.score >= (result.maxScore * 0.5)) {
                user.winstreak = (user.winstreak || 0) + 1;
                if (user.winstreak > (user.maxWinstreak || 0)) {
                    user.maxWinstreak = user.winstreak;
                }
            } else {
                user.winstreak = 0;
            }
        }
        await user.save();
        
        res.status(201).json({ message: 'Result saved' });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: e.message });
    }
});

// --- AD ROUTES ---
app.get('/api/ads', async (req, res) => {
    const ads = await Advertisement.find();
    res.json(ads);
});
app.get('/api/ads/active', async (req, res) => {
    const ads = await Advertisement.find({ active: true });
    res.json(ads);
});
app.post('/api/ads', authenticateJWT, async (req, res) => {
    if (req.user.role !== 'admin') return res.sendStatus(403);
    const ad = new Advertisement(req.body);
    await ad.save();
    res.json(ad);
});
app.put('/api/ads/:id', authenticateJWT, async (req, res) => {
    if (req.user.role !== 'admin') return res.sendStatus(403);
    const updatedAd = await Advertisement.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updatedAd);
});
app.delete('/api/ads/:id', authenticateJWT, async (req, res) => {
    if (req.user.role !== 'admin') return res.sendStatus(403);
    await Advertisement.findByIdAndDelete(req.params.id);
    res.json({ message: 'Ad deleted' });
});

// --- SOCKET.IO 1v1 MATCHMAKING (REAL) ---
const waitingQueue = []; 

io.on('connection', (socket) => {
    console.log('🔗 User connected to socket:', socket.id);

    // Join Matchmaking Queue
    socket.on('join_duel', ({ userId, username, avatarUrl, quizId }) => {
        console.log(`👤 User ${username} joined queue for quiz ${quizId}`);
        
        // Check if anyone else is waiting for this quiz
        const opponentIndex = waitingQueue.findIndex(p => p.quizId === quizId && p.socketId !== socket.id);

        if (opponentIndex > -1) {
            // Match found!
            const opponent = waitingQueue.splice(opponentIndex, 1)[0];
            const roomId = `duel_${socket.id}_${opponent.socketId}`;

            console.log(`⚔️ Match found! ${username} vs ${opponent.username} in room ${roomId}`);

            socket.join(roomId);
            const opponentSocket = io.sockets.sockets.get(opponent.socketId);
            if (opponentSocket) {
                opponentSocket.join(roomId);
            
                // Notify both players
                // Tell Current User about Opponent
                socket.emit('match_found', { 
                    roomId, 
                    opponentName: opponent.username, 
                    opponentAvatar: opponent.avatarUrl 
                });

                // Tell Opponent about Current User
                io.to(opponent.socketId).emit('match_found', { 
                    roomId, 
                    opponentName: username, 
                    opponentAvatar: avatarUrl 
                });
            } else {
                // Opponent disconnected while waiting? Put user back in queue logic (simplified here)
                waitingQueue.push({ socketId: socket.id, userId, username, avatarUrl, quizId });
            }

        } else {
            // No match yet, add to queue
            waitingQueue.push({ socketId: socket.id, userId, username, avatarUrl, quizId });
        }
    });

    // Handle Progress Updates during game
    socket.on('send_progress', ({ roomId, score, progress }) => {
        // Broadcast to everyone in room EXCEPT sender
        socket.to(roomId).emit('opponent_update', { score, progress });
    });

    socket.on('disconnect', () => {
        // Remove from queue if waiting
        const idx = waitingQueue.findIndex(p => p.socketId === socket.id);
        if(idx > -1) {
            waitingQueue.splice(idx, 1);
            console.log('User removed from queue');
        }
    });
});


const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));