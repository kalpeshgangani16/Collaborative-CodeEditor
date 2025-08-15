// routes/roomRoutes.js
const express = require('express');
const Room = require('../models/Room');
const User = require('../models/User'); // add this
const auth = require('../middleware/auth');

module.exports = (io) => {
  const router = express.Router();

  // Create room
  router.post('/create', auth, async (req, res) => {
    const { name, roomId } = req.body;
    try {
      const newRoom = new Room({
        name,
        roomId,
        users: [req.user.username],
        code: "" // empty editor at start
      });
      await newRoom.save();
      res.status(201).json(newRoom);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  });

  // Join room
  router.post("/join", auth, async (req, res) => {
    try {
      const { roomId } = req.body;
      const loggedInUsername = req.user.username;

      // Check if user exists
      const userExists = await User.findOne({ username: loggedInUsername });
      if (!userExists) {
        return res.status(404).json({ message: "User not found" });
      }

      // Find room
      const room = await Room.findOne({ roomId });
      if (!room) {
        return res.status(404).json({ message: "Room not found" });
      }

      // Add user if not already in the list
      if (!room.users.includes(loggedInUsername)) {
        room.users.push(loggedInUsername);
        await room.save();

        // Emit to all users in that room via Socket.io
        io.to(roomId).emit("userJoined", {
          username: loggedInUsername,
          users: room.users
        });
      }

      // Respond with current room state
      res.json({
        roomId: room.roomId,
        users: room.users,
        code: room.code
      });

    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });

  return router;
};
