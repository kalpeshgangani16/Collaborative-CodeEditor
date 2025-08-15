import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import { io } from "socket.io-client";

const BACKEND_URL = "http://localhost:5000";
const DEFAULT_ROOM_ID = "myRoom123";

function App() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [token, setToken] = useState("");
  const [code, setCode] = useState("");
  const [users, setUsers] = useState([]);
  const [error, setError] = useState("");
  const [loggedIn, setLoggedIn] = useState(false);
  const socketRef = useRef(null);

  // Handle login/register and get JWT
  const handleLogin = async () => {
    if (!username || !password) {
      setError("Enter a username and password");
      return;
    }
    setError("");
    try {
      await axios.post(`${BACKEND_URL}/api/users/register`, { username, password });
    } catch {}
    try {
      const res = await axios.post(`${BACKEND_URL}/api/users/login`, { username, password });
      setToken(res.data.token);
      setLoggedIn(true);
    } catch (err) {
      setError("Login failed: " + (err.response?.data?.message || err.message));
    }
  };

  // Connect to socket.io after login
  useEffect(() => {
    if (!token || !loggedIn) return;
    const socket = io(BACKEND_URL, { auth: { token } });
    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("join-room", { roomId: DEFAULT_ROOM_ID, username });
    });

    socket.on("user-joined", (user) => {
      setUsers((prev) => [...new Set([...prev, user])]);
    });

    socket.on("current-users", (userList) => {
      setUsers(userList);
    });

    socket.on("user-left", (username) => {
      setUsers((prev) => prev.filter(u => u !== username));
    });

    socket.on("code-update", (newCode) => {
      setCode(newCode);
    });

    return () => socket.disconnect();
  }, [token, loggedIn, username]);

  // Send code changes
  const handleCodeChange = (e) => {
    setCode(e.target.value);
    if (socketRef.current) {
      socketRef.current.emit("code-change", { roomId: DEFAULT_ROOM_ID, code: e.target.value });
    }
  };

  return (
    <div style={{ padding: 32 }}>
      {!loggedIn ? (
        <div>
          <h2>Login</h2>
          <input
            value={username}
            onChange={e => setUsername(e.target.value)}
            placeholder="Username"
            style={{ marginRight: 8 }}
          />
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Password"
            style={{ marginRight: 8 }}
          />
          <button onClick={handleLogin}>Login</button>
          {error && <div style={{ color: "red", marginTop: 8 }}>{error}</div>}
        </div>
      ) : (
        <div>
          <h2>Collaborative Code Editor</h2>
          <div>
            <strong>Users in room:</strong> {users.join(", ")}
          </div>
          <textarea
            value={code}
            onChange={handleCodeChange}
            rows={15}
            cols={70}
            style={{ marginTop: 16 }}
          />
        </div>
      )}
    </div>
  );
}

export default App;