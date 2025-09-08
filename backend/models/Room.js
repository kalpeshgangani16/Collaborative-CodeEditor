// backend/models/Room.js
const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  name: { type: String, required: true },
  roomId: { type: String, required: true, unique: true },
  users: { type: [String], default: [] }, // store usernames
  code: {
    type: String, 
    default: `// JavaScript (Node.js)
console.log("Hello World");` 
  },    
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Room', roomSchema);
