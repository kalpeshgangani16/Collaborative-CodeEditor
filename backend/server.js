// backend/server.js
const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const http = require("http");
const socketIo = require("socket.io");
const jwt = require("jsonwebtoken");
const connectDB = require("./db");
const User = require("./models/User");
const Room = require("./models/Room");

dotenv.config();
connectDB();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

app.use(cors());
app.use(express.json());

// ------------------- ROUTES -------------------
app.use("/api/users", require("./routes/userRoutes"));
const roomRoutes = require("./routes/roomRoutes")(io);
app.use("/api/rooms", roomRoutes);
app.use("/api/execute", require("./routes/executeRoutes"));

// ------------------- SOCKET.IO AUTH -------------------
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error("Authentication error: Token required"));

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) return next(new Error("Authentication error: User not found"));

    socket.user = user;
    next();
  } catch (err) {
    console.error("Socket Auth Error:", err.message);
    next(new Error("Authentication error"));
  }
});

// ------------------- SOCKET.IO EVENTS -------------------
const usersInRoom = {};

io.on("connection", (socket) => {
  console.log("✅ User connected:", socket.id);

  // Join a room
  socket.on("join-room", async ({ roomId, username, roomName }) => {
    socket.join(roomId);
    socket.roomId = roomId;

    // Track presence in-memory
    if (!usersInRoom[roomId]) usersInRoom[roomId] = [];
    const existing = usersInRoom[roomId].find((u) => u.username === username);
    if (existing) existing.id = socket.id;
    else usersInRoom[roomId].push({ id: socket.id, username });

    // Ensure room exists in DB (create if not found)
    const room = await Room.findOneAndUpdate(
      { roomId },
      {
        $setOnInsert: { roomId, name: roomName || `Room ${roomId}` },
        $addToSet: { users: username },
        $set: { lastActive: new Date() },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    // Send current presence list
    socket.emit(
      "current-users",
      usersInRoom[roomId].map((u) => u.username)
    );
    socket.to(roomId).emit("user-joined", username);

    // Send latest code
    socket.emit("code-update", room.code);

    // Also send chat history
    socket.emit("chat-history", room.messages || []);
  });

  // Code editing
  socket.on("code-change", async ({ roomId, code }) => {
    await Room.findOneAndUpdate(
      { roomId },
      { code, lastActive: new Date() }
    );
    socket.to(roomId).emit("code-update", code);
  });

  // Chat system
  socket.on("chat-message", async ({ roomId, sender, text }) => {
    const newMsg = { sender, text, timestamp: new Date() };
    const room = await Room.findOneAndUpdate(
      { roomId },
      { $push: { messages: newMsg }, $set: { lastActive: new Date() } },
      { new: true }
    );

    io.to(roomId).emit("chat-message", newMsg);
  });

  // Handle leaving
  socket.on("leave-room", async ({ roomId, username }) => {
    socket.leave(roomId);

    if (!usersInRoom[roomId]) return;
    usersInRoom[roomId] = usersInRoom[roomId].filter(
      (u) => u.id !== socket.id
    );

    socket.to(roomId).emit("user-left", username);

    await Room.findOneAndUpdate(
      { roomId },
      { $pull: { users: username }, $set: { lastActive: new Date() } }
    );
  });

  // Handle disconnect
  socket.on("disconnect", async () => {
    console.log("❌ User disconnected:", socket.id);

    const roomId = socket.roomId;
    if (!roomId || !usersInRoom[roomId]) return;

    const idx = usersInRoom[roomId].findIndex((u) => u.id === socket.id);
    if (idx === -1) return;

    const [removedUser] = usersInRoom[roomId].splice(idx, 1);
    socket.to(roomId).emit("user-left", removedUser.username);

    await Room.findOneAndUpdate(
      { roomId },
      { $pull: { users: removedUser.username }, $set: { lastActive: new Date() } }
    );
  });
});

// ------------------- CLEANUP OLD ROOMS -------------------
// Every 24h, delete rooms inactive for 7 days
setInterval(async () => {
  try {
    console.log("🧹 Running cleanup of inactive rooms...");
    const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 days
    const result = await Room.deleteMany({ lastActive: { $lt: cutoff } });

    if (result.deletedCount > 0) {
      console.log(`🗑️ Deleted ${result.deletedCount} inactive rooms`);
    }
  } catch (err) {
    console.error("❌ Error during cleanup:", err.message);
  }
}, 24 * 60 * 60 * 1000);

// ------------------- START SERVER -------------------
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
