// backend/server.js
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
const connectDB = require('./db');
const User = require('./models/User');
const Room = require('./models/Room');

dotenv.config();
connectDB();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/rooms', require('./routes/roomRoutes'));

// ------------------- SOCKET.IO AUTH -------------------
io.use(async (socket, next) => {
    try {
        const token = socket.handshake.auth?.token; // token sent from frontend
        if (!token) {
            return next(new Error("Authentication error: Token required"));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id);
        if (!user) {
            return next(new Error("Authentication error: User not found"));
        }

        socket.user = user; // store user in socket object
        next();
    } catch (err) {
        console.error("Socket Auth Error:", err.message);
        next(new Error("Authentication error"));
    }
});

// ------------------- SOCKET.IO EVENTS -------------------

const usersInRoom = {};

io.on('connection', (socket) => {
    socket.on('join-room', async ({ roomId, username }) => {
        socket.join(roomId);

        // Track users in room
        if (!usersInRoom[roomId]) usersInRoom[roomId] = [];
        usersInRoom[roomId].push({ id: socket.id, username });

        // Send current users to the joining user
        const currentUsers = usersInRoom[roomId].map(u => u.username);
        socket.emit('current-users', currentUsers);

        // Notify others
        socket.to(roomId).emit('user-joined', username);
    });

    socket.on('disconnect', () => {
        for (const roomId in usersInRoom) {
            const userIndex = usersInRoom[roomId].findIndex(u => u.id === socket.id);
            if (userIndex !== -1) {
                const [removedUser] = usersInRoom[roomId].splice(userIndex, 1);
                // Notify others in the room
                socket.to(roomId).emit('user-left', removedUser.username);
            }
        }
    });
});

// ------------------- START SERVER -------------------
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
