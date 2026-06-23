// backend/server.js

// Importing required modules
const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const http = require("http");
const socketIo = require("socket.io");
const jwt = require("jsonwebtoken");
const connectDB = require("./db");
const User = require("./models/User");
const Room = require("./models/Room");

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// Create HTTP server for socket.io to work
const server = http.createServer(app);

// Initialize socket.io
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// Middleware
app.use(cors());
app.use(express.json());

// ------------------- ROUTES -------------------
// User routes (register, login)
app.use("/api/users", require("./routes/userRoutes"));

// Room routes (create/join room)
const roomRoutes = require("./routes/roomRoutes")(io);
app.use("/api/rooms", roomRoutes);

// Code execution route (compiling code in backend)
app.use("/api/execute", require("./routes/executeRoutes"));


// ------------------- SOCKET.IO AUTHENTICATION -------------------
// This middleware checks token before socket connects
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error("Authentication error: Token required"));

    // Verify JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check if user exists
    const user = await User.findById(decoded.id);
    if (!user) return next(new Error("Authentication error: User not found"));

    // Attach user object to socket
    socket.user = user;
    next();
  } catch (err) {
    console.error("Socket Auth Error:", err.message);
    next(new Error("Authentication error"));
  }
});


// ------------------- SOCKET.IO MAIN EVENTS -------------------
// Stores which users are present in each room (in-memory)
const usersInRoom = {};

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // When a user joins a room
  socket.on("join-room", async ({ roomId, username, roomName }) => {
    socket.join(roomId);
    socket.roomId = roomId;

    // Track online users in memory
    if (!usersInRoom[roomId]) usersInRoom[roomId] = [];
    const existing = usersInRoom[roomId].find((u) => u.username === username);
    if (existing) existing.id = socket.id;
    else usersInRoom[roomId].push({ id: socket.id, username });

    // Create or update the room in database
    const room = await Room.findOneAndUpdate(
      { roomId },
      {
        $setOnInsert: { roomId, name: roomName || `Room ${roomId}` },
        $addToSet: { users: username },
        $set: { lastActive: new Date() },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    // Send currently active users to the new user
    socket.emit(
      "current-users",
      usersInRoom[roomId].map((u) => u.username)
    );

    // Notify others that a user joined
    socket.to(roomId).emit("user-joined", username);

    // Send latest code to new user
    socket.emit("code-update", room.code);

    // Send chat history
    socket.emit("chat-history", room.messages || []);
  });

  // When someone changes the code
  socket.on("code-change", async ({ roomId, code }) => {
    await Room.findOneAndUpdate(
      { roomId },
      { code, lastActive: new Date() }
    );

    // Broadcast updated code to other users
    socket.to(roomId).emit("code-update", code);
  });

  // Chat message inside a room
  socket.on("chat-message", async ({ roomId, sender, text }) => {
    const newMsg = { sender, text, timestamp: new Date() };

    // Save message to DB
    const room = await Room.findOneAndUpdate(
      { roomId },
      { $push: { messages: newMsg }, $set: { lastActive: new Date() } },
      { new: true }
    );

    // Broadcast chat message
    io.to(roomId).emit("chat-message", newMsg);
  });

  // User leaves room
  socket.on("leave-room", async ({ roomId, username }) => {
    socket.leave(roomId);

    if (!usersInRoom[roomId]) return;

    // Remove user from online list
    usersInRoom[roomId] = usersInRoom[roomId].filter(
      (u) => u.id !== socket.id
    );

    // Notify others
    socket.to(roomId).emit("user-left", username);

    // Update database
    await Room.findOneAndUpdate(
      { roomId },
      { $pull: { users: username }, $set: { lastActive: new Date() } }
    );
  });

  // When socket disconnects
  socket.on("disconnect", async () => {
    console.log("User disconnected:", socket.id);

    const roomId = socket.roomId;
    if (!roomId || !usersInRoom[roomId]) return;

    const idx = usersInRoom[roomId].findIndex((u) => u.id === socket.id);
    if (idx === -1) return;

    const [removedUser] = usersInRoom[roomId].splice(idx, 1);

    // Notify others
    socket.to(roomId).emit("user-left", removedUser.username);

    // Update DB
    await Room.findOneAndUpdate(
      { roomId },
      { $pull: { users: removedUser.username }, $set: { lastActive: new Date() } }
    );
  });
});

// ------------------- AUTO DELETE OLD ROOMS -------------------

// Function to delete rooms inactive for more than 7 days
async function cleanupInactiveRooms() {
  try {
    console.log("Running cleanup of inactive rooms...");

    const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const result = await Room.deleteMany({
      lastActive: { $lt: cutoff },
    });

    console.log(`Deleted ${result.deletedCount} inactive room(s).`);
  } catch (err) {
    console.error("Error during cleanup:", err.message);
  }
}

// Run once immediately when the server starts
cleanupInactiveRooms();

// Then run every 24 hours
setInterval(cleanupInactiveRooms, 24 * 60 * 60 * 1000);


// ------------------- START SERVER -------------------
const PORT = process.env.PORT || 5000;

// Start express + socket.io server
server.listen(PORT, () =>
  console.log(`Server running on port ${PORT}`)
);
