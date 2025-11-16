// routes/roomRoutes.js
const express = require('express');
const Room = require('../models/Room');
const User = require('../models/User');
const auth = require('../middleware/auth');

module.exports = (io) => {
  const router = express.Router();

  //language template
  const languageTemplates = {
    63: `// JavaScript (Node.js)
console.log("Hello World");`,
    71: `# Python 3
print("Hello World")`,
    62: `// Java
public class Main {
    public static void main(String[] args) {
        System.out.println("Hello World");
    }
}`,
    54: `// C++
#include <iostream>
using namespace std;
int main() {
    cout << "Hello World" << endl;
    return 0;
}`,
    50: `// C
#include <stdio.h>
int main() {
    printf("Hello World\\n");
    return 0;
}`
  };

  //get all room
  router.get('/', async (req, res) => {
    try {
      const rooms = await Room.find();
      res.json(rooms);
    } catch (err) {
      res.status(500).json({ message: 'Server error' });
    }
  });

  //get room by id
  router.get('/:roomId', async (req, res) => {
    try {
      const room = await Room.findOne({ roomId: req.params.roomId });
      if (!room) return res.status(404).json({ message: "Room not found" });

      res.json({
        roomId: room.roomId,
        name: room.name,
        users: room.users,
        code: room.code,
        languageId: room.languageId,
        messages: room.messages || []
      });

      //update last active
      room.lastActive = new Date();
      await room.save();
    } catch (err) {
      res.status(500).json({ message: "Server error" });
    }
  });

  //get code
  router.get('/:roomId/code', async (req, res) => {
    try {
      const room = await Room.findOne({ roomId: req.params.roomId });
      if (!room) return res.status(404).json({ message: "Room not found" });

      res.json({ code: room.code || "//write your code here" });
    } catch (err) {
      res.status(500).json({ message: "Server error" });
    }
  });

  //save
  router.post('/:roomId/save-code', auth, async (req, res) => {
    try {
      const { code } = req.body;
      const room = await Room.findOneAndUpdate(
        { roomId: req.params.roomId },
        { code, lastActive: new Date() },
        { new: true }
      );
      if (!room) return res.status(404).json({ message: "Room not found" });

      res.json({ message: "Code saved", code: room.code });
    } catch (err) {
      res.status(500).json({ message: "Server error" });
    }
  });

  //get chat
  router.get('/:roomId/messages', async (req, res) => {
    try {
      const room = await Room.findOne({ roomId: req.params.roomId });
      if (!room) return res.status(404).json({ message: "Room not found" });

      res.json(room.messages || []);
    } catch (err) {
      res.status(500).json({ message: "Server error" });
    }
  });

  //create room
  router.post('/create', auth, async (req, res) => {
    const { name, languageId } = req.body;
    try {
      const existingRoom = await Room.findOne({ name });
      if (existingRoom) {
        return res.status(409).json({ message: "Room name already exists" });
      }

      const roomId = Math.floor(100000 + Math.random() * 900000).toString();
      const chosenLang = languageId || 63;

      const newRoom = new Room({
        name,
        roomId,
        users: [req.user.username],
        languageId: chosenLang,
        code: languageTemplates[chosenLang] || "//write your code here",
        messages: []
      });

      await newRoom.save();
      res.status(201).json({
        roomId,
        name: newRoom.name,
        languageId: newRoom.languageId,
        code: newRoom.code
      });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  });

  //join
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
        languageId: room.languageId,
        messages: room.messages || []
      });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });

  return router;
};
