  import React, { useState, useRef, useEffect } from "react";
  import axios from "axios";
  import { io } from "socket.io-client";
  import LoginPage from "./LoginPage"; // No CSS imported here

  const BACKEND_URL = "http://localhost:5000";

  function App() {
    const [token, setToken] = useState("");
    const [code, setCode] = useState("");
    const [users, setUsers] = useState([]);
    const [loggedIn, setLoggedIn] = useState(false);

    const [username, setUsername] = useState("");
    const [roomId, setRoomId] = useState("");
    const [roomName, setRoomName] = useState("");

    const socketRef = useRef(null);
    const skipNextUpdate = useRef(false);

    const handleLogin = async ({ username, password, roomId, roomName, setError }) => {
      try {
        await axios.post(`${BACKEND_URL}/api/users/register`, { username, password }).catch(() => {});
        const res = await axios.post(`${BACKEND_URL}/api/users/login`, { username, password });

        setToken(res.data.token);
        setLoggedIn(true);
        setUsername(username);
        setRoomId(roomId);
        setRoomName(roomName);
      } catch (err) {
        setError("Login failed: " + (err.response?.data?.message || err.message));
      }
    };

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

      socket.on("current-users", (userList) => {
        setUsers([...new Set(userList)]);
      });

      socket.on("user-joined", (user) => {
        setUsers((prev) => [...new Set([...prev, user])]);
      });

      socket.on("user-left", (leftUser) => {
        setUsers((prev) => prev.filter((u) => u !== leftUser));
      });

      socket.on("code-update", (newCode) => {
        if (!skipNextUpdate.current) {
          setCode(newCode);
        } else {
          skipNextUpdate.current = false;
        }
      });

      return () => socket.disconnect();
    }, [token, loggedIn, username, roomId, roomName]);

    const handleCodeChange = (e) => {
      const newCode = e.target.value;
      setCode(newCode);
      skipNextUpdate.current = true;
      if (socketRef.current) {
        socketRef.current.emit("code-change", { roomId, code: newCode });
      }
    };

    return (
      <div className="app-container">
        {!loggedIn ? (
          <LoginPage onLogin={handleLogin} />
        ) : (
          <div className="editor-container">
            <h2>{roomName} - Collaborative Code Editor</h2>
            <div className="user-list">
              <strong>Users:</strong> {users.join(", ")}
            </div>
            <textarea
              value={code}
              onChange={handleCodeChange}
              rows={15}
              cols={70}
              className="code-editor"
            />
          </div>
        )}
      </div>
    );
  }

  export default App;
