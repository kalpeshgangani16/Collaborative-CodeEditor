// frontend/src/App.js
import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import { io } from "socket.io-client";
import LoginPage from "./pages/LoginPage";
import RoomPage from "./pages/RoomPage";

//url of backend
const BACKEND_URL = "http://localhost:5000";

function App() {
  const [languageId, setLanguageId] = useState(63);
  const [token, setToken] = useState("");
  const [code, setCode] = useState("");
  const [users, setUsers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);
  const [loggedIn, setLoggedIn] = useState(false);

  const [username, setUsername] = useState("");
  const [roomId, setRoomId] = useState("");
  const [roomName, setRoomName] = useState("");

  const socketRef = useRef(null);
  const skipNextUpdate = useRef(false);
  const typingTimeouts = useRef({});

  // ---------------- CREATE ROOM ----------------
  const handleCreate = async ({ username, password, roomName, languageId, setError, setSuccess }) => {
    try {
      let res;
      try {
        res = await axios.post(`${BACKEND_URL}/api/users/login`, { username, password });
      } catch (loginErr) {
        if (loginErr.response?.status === 404) {
          setError("");
          if (window.confirm("User not found. Do you want to register?")) {
            await axios.post(`${BACKEND_URL}/api/users/register`, { username, password });
            setSuccess("✅ Registration successful! Logging you in...");
            res = await axios.post(`${BACKEND_URL}/api/users/login`, { username, password });
          } else {
            return;
          }
        } else {
          setError(loginErr.response?.data?.message || "Login failed");
          return;
        }
      }

      if (!res) return;

      const roomRes = await axios.post(
        `${BACKEND_URL}/api/rooms/create`,
        { name: roomName, languageId },
        { headers: { Authorization: `Bearer ${res.data.token}` } }
      );

      setSuccess("Room created and logging you in!");
      setError("");

      setTimeout(() => {
        setToken(res.data.token);
        setLoggedIn(true);
        setUsername(username);
        setRoomId(roomRes.data.roomId);
        setRoomName(roomRes.data.name);
        setLanguageId(roomRes.data.languageId);
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Room creation failed");
    }
  };

  // ---------------- LOGIN + JOIN ROOM ----------------
  const handleLogin = async ({ username, password, roomId, roomName, setError, setSuccess }) => {
    try {
      let res;
      try {
        res = await axios.post(`${BACKEND_URL}/api/users/login`, { username, password });
      } catch (loginErr) {
        if (loginErr.response?.status === 404) {
          setError("");
          if (window.confirm("User not found. Do you want to register?")) {
            await axios.post(`${BACKEND_URL}/api/users/register`, { username, password });
            setSuccess("✅ Registration successful! Logging you in...");
            res = await axios.post(`${BACKEND_URL}/api/users/login`, { username, password });
          } else {
            return;
          }
        } else {
          setError(loginErr.response?.data?.message || "Login failed");
          return;
        }
      }

      if (!res) return;

      const token = res.data.token;
      const joinRes = await axios.post(
        `${BACKEND_URL}/api/rooms/join`,
        { roomId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSuccess("Successfully logged in and joined room!");
      setError("");
      setTimeout(() => {
        setToken(token);
        setLoggedIn(true);
        setUsername(username);
        setRoomId(joinRes.data.roomId);
        setLanguageId(joinRes.data.languageId);
        setRoomName(joinRes.data.name);
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Login failed");
    }
  };

  // ---------------- SOCKET SETUP ----------------
  useEffect(() => {
    if (!token || !loggedIn) return;

    axios
      .get(`${BACKEND_URL}/api/rooms/${roomId}/code`)
      .then((res) => setCode(res.data.code || ""))
      .catch(() => setCode(""));

    const socket = io(BACKEND_URL, { auth: { token } });
    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("join-room", { roomId, username, roomName });
    });

    // ✅ Chat
    socket.on("chat-history", (history) => setMessages(history));
    socket.on("chat-message", (msg) => setMessages((prev) => [...prev, msg]));

    // ✅ Typing
    socket.on("user-typing", (typingUser) => {
      if (typingUser === username) return;
      setTypingUsers((prev) => (prev.includes(typingUser) ? prev : [...prev, typingUser]));
      if (typingTimeouts.current[typingUser]) clearTimeout(typingTimeouts.current[typingUser]);
      typingTimeouts.current[typingUser] = setTimeout(() => {
        setTypingUsers((prev) => prev.filter((u) => u !== typingUser));
        delete typingTimeouts.current[typingUser];
      }, 1500);
    });

    // ✅ Users
    socket.on("current-users", (userList) => setUsers(userList)); // keep exactly what server sends);
    socket.on("user-joined", (user) => setUsers((prev) => [...new Set([...prev, user])]));
    socket.on("user-left", (leftUser) => setUsers((prev) => prev.filter((u) => u !== leftUser)));

    // ✅ Code
    socket.on("code-update", (newCode) => {
      if (!skipNextUpdate.current) {
        setCode(newCode);
      } else {
        skipNextUpdate.current = false;
      }
    });

    return () => socket.disconnect();
  }, [token, loggedIn, username, roomId, roomName]);

  // ---------------- CODE CHANGE ----------------
  const handleCodeChange = (newCode) => {
    setCode(newCode);
    skipNextUpdate.current = true;
    if (socketRef.current) {
      socketRef.current.emit("code-change", { roomId, code: newCode });
    }
  };

  // ---------------- SEND CHAT MESSAGE ----------------
  const handleSendMessage = (text) => {
    if (socketRef.current) {
      socketRef.current.emit("chat-message", { roomId, sender: username, text });
    }
  };

  // ---------------- TYPING EVENT ----------------
  const handleTyping = () => {
    if (socketRef.current) {
      socketRef.current.emit("user-typing", username);
    }
  };

  // ---------------- RENDER ----------------
  return (
    <div className="app-container">
      {!loggedIn ? (
        <LoginPage onLogin={handleLogin} onCreate={handleCreate} />
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
            setLoggedIn(false);
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
