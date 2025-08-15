import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import { io } from "socket.io-client";

const BACKEND_URL = "http://localhost:5000";
const DEFAULT_ROOM_ID = "final";

function App() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [token, setToken] = useState("");
  const [code, setCode] = useState("");
  const [users, setUsers] = useState([]);
  const [error, setError] = useState("");
  const [loggedIn, setLoggedIn] = useState(false);
  const socketRef = useRef(null);
  const skipNextUpdate = useRef(false); // prevent loops when we send changes

  // Handle login/register and get JWT
  const handleLogin = async () => {
    if (!username || !password) {
      setError("Enter a username and password");
      return;
    }
    setError("");
    try {
      await axios.post(`${BACKEND_URL}/api/users/register`, { username, password }).catch(() => { });

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

    // Fetch initial code from server
    axios
      .get(`${BACKEND_URL}/api/rooms/${DEFAULT_ROOM_ID}/code`)
      .then(res => {
        setCode(res.data.code || "");
      })
      .catch(() => setCode(""));

    const socket = io(BACKEND_URL, { auth: { token } });
    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("join-room", {
        roomId: DEFAULT_ROOM_ID,
        username,
        roomName: "My Cool Room" // or any name you want
      });

    });

    socket.on("current-users", (userList) => {
      setUsers([...new Set(userList)]);
    });

    socket.on("user-joined", (user) => {
      setUsers((prev) => [...new Set([...prev, user])]);
    });

    socket.on("user-left", (leftUser) => {
      setUsers((prev) => prev.filter(u => u !== leftUser));
    });

    // Receive code changes from others
    socket.on("code-update", (newCode) => {
      if (!skipNextUpdate.current) {
        setCode(newCode);
      } else {
        skipNextUpdate.current = false; // reset after skipping self-update
      }
    });

    return () => socket.disconnect();
  }, [token, loggedIn, username]);

  // Send code changes
  const handleCodeChange = (e) => {
    const newCode = e.target.value;
    setCode(newCode);
    skipNextUpdate.current = true; // prevent own broadcast from coming back
    if (socketRef.current) {
      socketRef.current.emit("code-change", { roomId: DEFAULT_ROOM_ID, code: newCode });
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
