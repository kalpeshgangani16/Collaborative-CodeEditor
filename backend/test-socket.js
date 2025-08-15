const { io } = require("socket.io-client");
const axios = require("axios");

// CONFIGURE THESE:
const username = process.argv[2] || "TestUser";
const password = "testpass";
const roomId = "myRoom123";

// 1. Register or login to get JWT token
async function getToken() {
    try {
        // Try register
        await axios.post("http://localhost:5000/api/users/register", { username, password });
    } catch (e) {
        // Ignore if already registered
    }
    // Login
    const res = await axios.post("http://localhost:5000/api/users/login", { username, password });
    return res.data.token;
}

async function main() {
    const token = await getToken();

    // 2. Connect to socket.io with token
    const socket = io("http://localhost:5000", {
        auth: { token }
    });

    socket.on("connect", () => {
        console.log(`✅ Connected as ${username} (${socket.id})`);
        // 3. Join a room
        socket.emit("join-room", { roomId });
    });

    socket.on("user-joined", (user) => {
        console.log(`👤 ${user} joined the room`);
    });

    socket.on("code-update", (code) => {
        console.log(`💻 Code updated: ${code}`);
    });

    socket.on("error-message", (msg) => {
        console.log(`❗ Error: ${msg}`);
    });

    // Send a code change after joining
    setTimeout(() => {
        socket.emit("code-change", { roomId, code: `// Hello from ${username}` });
    }, 2000);
}

main();