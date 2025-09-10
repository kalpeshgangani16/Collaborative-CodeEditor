// routes/roomRoutes.js
const express = require('express');
const Room = require('../models/Room');
const User = require('../models/User');
const auth = require('../middleware/auth');

module.exports = (io) => {
  const router = express.Router();

  // Get all rooms
  router.get('/', async (req, res) => {
    try {
      const rooms = await Room.find();
      res.json(rooms);
    } catch (err) {
      res.status(500).json({ message: 'Server error' });
    }
  });

  // Get code for a room
  router.get('/:roomId/code', async (req, res) => {
    try {
      const room = await Room.findOne({ roomId: req.params.roomId });
      if (!room) return res.status(404).json({ message: "Room not found" });

      res.json({ code: room.code });
    } catch (err) {
      res.status(500).json({ message: "Server error" });
    }
  });

  // Create room
  router.post('/create', auth, async (req, res) => {
    const { name } = req.body;
    try {
      const existingRoom = await Room.findOne({ name });
      if (existingRoom) {
        return res.status(400).json({ message: "Room name already taken" });
      }

      const roomId = Math.floor(100000 + Math.random() * 900000).toString();
      const newRoom = new Room({
        name,
        roomId,
        users: [req.user.username],
      });
      await newRoom.save();
      res.status(201).json({ roomId, name: newRoom.name });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  });

  // Join room
  router.post('/join', auth, async (req, res) => {
    try {
      const { roomId } = req.body;
      const loggedInUsername = req.user.username;

      const userExists = await User.findOne({ username: loggedInUsername });
      if (!userExists) return res.status(404).json({ message: "User not found" });

      const room = await Room.findOne({ roomId });
      if (!room) return res.status(404).json({ message: "Room not found" });

      if (!room.users.includes(loggedInUsername)) {
        room.users.push(loggedInUsername);
        await room.save();

        io.to(roomId).emit("user-joined", loggedInUsername);
      }

      res.json({
        roomId: room.roomId,
        name: room.name,
        users: room.users,
        code: room.code,
      });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });

  return router;
};
