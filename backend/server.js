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
// app.use('/api/rooms', require('./routes/roomRoutes'));

//for socket.io
const roomRoutes = require('./routes/roomRoutes')(io);
app.use('/api/rooms', roomRoutes);

app.use("/api/execute", require("./routes/executeRoutes"));


// // helper to read the schema default for Room.code
// const getDefaultRoomCode = () => {
//   const path = Room.schema.path('code');
//   return typeof path.defaultValue === 'function'
//     ? path.defaultValue()
//     : path.defaultValue;
// };


// ------------------- SOCKET.IO AUTH -------------------
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) {
      return next(new Error("Authentication error: Token required"));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) {
      return next(new Error("Authentication error: User not found"));
    }

    socket.user = user;
    next();
  } catch (err) {
    console.error("Socket Auth Error:", err.message);
    next(new Error("Authentication error"));
  }
});

// ------------------- SOCKET.IO EVENTS -------------------
const usersInRoom = {};

// io.on('connection', (socket) => {
//     socket.on('join-room', async ({ roomId, username }) => {
//         socket.join(roomId);

//         if (!usersInRoom[roomId]) usersInRoom[roomId] = [];
//         const existingUser = usersInRoom[roomId].find(u => u.username === username);

//         if (!existingUser) {
//             usersInRoom[roomId].push({ id: socket.id, username });
//         } else {
//             existingUser.id = socket.id; // update socket id if reconnected
//         }

//         // Update MongoDB to include user in the room
//         await Room.findOneAndUpdate(
//             { roomId },
//             { $addToSet: { users: username } }, // add only if not exists
//             { new: true, upsert: true },
//         );

//         // Send current users list to the joining user
//         const currentUsers = usersInRoom[roomId].map(u => u.username);
//         socket.emit('current-users', currentUsers);

//         // Notify others in room
//         socket.to(roomId).emit('user-joined', username);

//         // Fetch room code
//         let room = await Room.findOne({ roomId });
//         if (!room) {
//             room = new Room({
//                 name: "Default Room",
//                 roomId
//             });
//             await room.save();
//         }

//         socket.emit('code-update', room.code || "hello");

//         socket.on('code-change', async ({ roomId, code }) => {
//             await Room.findOneAndUpdate({ roomId }, { code });
//             socket.to(roomId).emit('code-update', code);
//         });
//     });

//     socket.on('disconnect', async () => {
//         for (const roomId in usersInRoom) {
//             const idx = usersInRoom[roomId].findIndex(u => u.id === socket.id);
//             if (idx !== -1) {
//                 const [removedUser] = usersInRoom[roomId].splice(idx, 1);

//                 // Notify others
//                 socket.to(roomId).emit('user-left', removedUser.username);

//                 // Remove from DB as well
//                 await Room.findOneAndUpdate(
//                     { roomId },
//                     { $pull: { users: removedUser.username } }
//                 );

//                 // Reset code if empty
//                 if (usersInRoom[roomId].length === 0) {
//                     await Room.findOneAndUpdate({ roomId }, { code: "hello" });
//                 }
//             }
//         }
//     });
// });


io.on("connection", (socket) => {
  socket.on("join-room", async ({ roomId, username, roomName }) => {
    socket.join(roomId);
    socket.roomId = roomId;

    // in-memory presence
    if (!usersInRoom[roomId]) usersInRoom[roomId] = [];
    const existing = usersInRoom[roomId].find(u => u.username === username);
    if (existing) existing.id = socket.id;
    else usersInRoom[roomId].push({ id: socket.id, username });

    // ⬇️ Single upsert: set name only on insert, add user, apply schema defaults
    const room = await Room.findOneAndUpdate(
      { roomId },
      {
        $setOnInsert: {roomId, name: roomName || `Room ${roomId}` },
        $addToSet: { users: username }
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    // presence to this user + others
    socket.emit("current-users", usersInRoom[roomId].map(u => u.username));
    socket.to(roomId).emit("user-joined", username);

    // send latest code (schema default already applied on first insert)
    // socket.emit("code-update", room.code ?? getDefaultRoomCode());  //if default wewant
    socket.emit("code-update", room.code);

    // also update others so everyone sees the same
    //******************************** */
    socket.to(roomId).emit("code-update", room.code);  //remove if error
    //********************************* */

    
    // code editing
    socket.on("code-change", async ({ roomId, code }) => {
      await Room.findOneAndUpdate({ roomId }, { code });
      socket.to(roomId).emit("code-update", code);
    });
  });

  socket.on("disconnect", async () => {
    const roomId = socket.roomId;
    if (!roomId || !usersInRoom[roomId]) return;

    const idx = usersInRoom[roomId].findIndex(u => u.id === socket.id);
    if (idx === -1) return;

    const [removedUser] = usersInRoom[roomId].splice(idx, 1);
    socket.to(roomId).emit("user-left", removedUser.username);

    // keep DB in sync
    await Room.findOneAndUpdate(
      { roomId },
      { $pull: { users: removedUser.username } }
    );

    // if empty room, reset code to schema default
    if (usersInRoom[roomId].length === 0) {
      // if you want to use the same default as schema:
      await Room.findOneAndUpdate(
        { roomId },
        // { $set: { code: getDefaultRoomCode() } },// clears it; by default code 
        { $set: { code: "//write your code here" } },// clears it; reading will use the stored value
        { new: true }
      );
    }
  });
});


// ------------------- START SERVER -------------------
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
