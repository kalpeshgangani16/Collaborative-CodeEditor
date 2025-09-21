import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import { io } from "socket.io-client";
import LoginPage from "./pages/LoginPage";
import RoomPage from "./pages/RoomPage";
import HomePage from "./pages/HomePage"; // new page for Create/Join options

// Backend URL
const BACKEND_URL = "http://localhost:5000";

function App() {
  const [languageId, setLanguageId] = useState(63);
  const [token, setToken] = useState("");
  const [code, setCode] = useState("");
  const [users, setUsers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);

  const [loggedIn, setLoggedIn] = useState(false); // after Google login
  const [inRoom, setInRoom] = useState(false); // after Create/Join room

  const [username, setUsername] = useState("");
  const [roomId, setRoomId] = useState("");
  const [roomName, setRoomName] = useState("");

  const socketRef = useRef(null);
  const skipNextUpdate = useRef(false);
  const typingTimeouts = useRef({});

  useEffect(() => {
    const savedToken = localStorage.getItem("token");
    const savedUser = localStorage.getItem("user");

    if (savedToken && savedUser) {
      setToken(savedToken);
      const parsedUser = JSON.parse(savedUser);
      setUsername(parsedUser.username || "Guest");
      setLoggedIn(true);
    }
  }, []);

  // ---------------- GOOGLE LOGIN ----------------
  const handleGoogleLogin = (jwtToken, user) => {
    setToken(jwtToken);
    setUsername(user.username || "Guest");
    setLoggedIn(true);

    localStorage.setItem("token", jwtToken);
    localStorage.setItem("user", JSON.stringify(user));

  };

  // ---------------- LOGOUT ----------------
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken("");
    setUsername("");
    setLoggedIn(false);
    setInRoom(false);
    // 🚫 don't reset code
    setUsers([]);
    setMessages([]);
    setTypingUsers([]);
  };

  // ---------------- CREATE ROOM ----------------
  const handleCreateRoom = async (roomNameInput, languageIdInput) => {
    try {
      const res = await axios.post(
        `${BACKEND_URL}/api/rooms/create`,
        { name: roomNameInput, languageId: languageIdInput },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setRoomId(res.data.roomId);
      setRoomName(res.data.name);
      setLanguageId(res.data.languageId);
      setInRoom(true);
    } catch (err) {
      alert(err.response?.data?.message || "Room creation failed");
    }
  };

  // ---------------- JOIN ROOM ----------------
  const handleJoinRoom = async (roomIdInput) => {
    try {
      const res = await axios.post(
        `${BACKEND_URL}/api/rooms/join`,
        { roomId: roomIdInput },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setRoomId(res.data.roomId);
      setRoomName(res.data.name);
      setLanguageId(res.data.languageId);
      setInRoom(true);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to join room");
    }
  };

  // ---------------- SOCKET + ROOM HANDLERS ----------------
  useEffect(() => {
    if (!token || !inRoom) return;

    axios
      .get(`${BACKEND_URL}/api/rooms/${roomId}/code`)
      .then((res) => setCode(res.data.code || ""))
      .catch(() => setCode(""));

    const socket = io(BACKEND_URL, { auth: { token } });
    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("join-room", { roomId, username, roomName });
    });

    // Chat
    socket.on("chat-history", (history) => setMessages(history));
    socket.on("chat-message", (msg) => setMessages((prev) => [...prev, msg]));

    // Typing
    socket.on("user-typing", (typingUser) => {
      if (typingUser === username) return;
      setTypingUsers((prev) => (prev.includes(typingUser) ? prev : [...prev, typingUser]));
      if (typingTimeouts.current[typingUser]) clearTimeout(typingTimeouts.current[typingUser]);
      typingTimeouts.current[typingUser] = setTimeout(() => {
        setTypingUsers((prev) => prev.filter((u) => u !== typingUser));
        delete typingTimeouts.current[typingUser];
      }, 1500);
    });

    // Users
    socket.on("current-users", (userList) => setUsers(userList));
    socket.on("user-joined", (user) => setUsers((prev) => [...new Set([...prev, user])]));
    socket.on("user-left", (leftUser) => setUsers((prev) => prev.filter((u) => u !== leftUser)));

    // Code
    socket.on("code-update", (newCode) => {
      if (!skipNextUpdate.current) {
        setCode(newCode);
      } else {
        skipNextUpdate.current = false;
      }
    });

    return () => socket.disconnect();
  }, [token, inRoom, username, roomId, roomName]);

  // ---------------- HANDLERS ----------------
  const handleCodeChange = (newCode) => {
    setCode(newCode);
    skipNextUpdate.current = true;
    if (socketRef.current) {
      socketRef.current.emit("code-change", { roomId, code: newCode });
    }
  };

  const handleSendMessage = (text) => {
    if (socketRef.current) {
      socketRef.current.emit("chat-message", { roomId, sender: username, text });
    }
  };

  const handleTyping = () => {
    if (socketRef.current) {
      socketRef.current.emit("user-typing", username);
    }
  };

  // ---------------- RENDER ----------------
  return (
    <div className="app-container">
      {!loggedIn ? (
        <LoginPage onLogin={handleGoogleLogin} />
      ) : !inRoom ? (
        <HomePage username={username} setUsername={setUsername} setToken={setToken} onCreateRoom={handleCreateRoom} onJoinRoom={handleJoinRoom} onLogout={handleLogout} />
      ) : (
        <RoomPage
          roomId={roomId}
          roomName={roomName}
          users={users}
          code={code}
          languageId={languageId}
          messages={messages}
          typingUsers={typingUsers}
          currentUser={username}
          onCodeChange={handleCodeChange}
          onSendMessage={handleSendMessage}
          onTyping={handleTyping}
          onLeave={() => {
            if (socketRef.current) socketRef.current.disconnect();
            setInRoom(false);
            setCode("");
            setUsers([]);
            setMessages([]);
            setTypingUsers([]);
          }}
        />
      )}
    </div>
  );
}

export default App;
