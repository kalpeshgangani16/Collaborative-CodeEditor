// backend/models/Room.js
const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: { type: String, required: true },
  text: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

const roomSchema = new mongoose.Schema({
  name: { type: String, required: true },
  roomId: { type: String, required: true, unique: true },
  users: { type: [String], default: [] },
  code: { type: String, default: "//write your code here" },
  languageId: { type: Number, default: 63 },
  messages: { type: [messageSchema], default: [] },
  createdAt: { type: Date, default: Date.now },

  // ✅ Track last activity
  lastActive: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Room', roomSchema);
