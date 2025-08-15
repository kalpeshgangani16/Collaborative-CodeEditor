import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import { io } from "socket.io-client";
import LoginPage from "./pages/LoginPage"; // No CSS imported here
import RoomPage from "./pages/RoomPage";
import { Editor } from "@monaco-editor/react";

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

  // const handleLogin = async ({ username, password, roomId, roomName, setError }) => {
  //   try {
  //     await axios.post(`${BACKEND_URL}/api/users/register`, { username, password }).catch(() => {});
  //     const res = await axios.post(`${BACKEND_URL}/api/users/login`, { username, password });

  //     setToken(res.data.token);
  //     setLoggedIn(true);
  //     setUsername(username);
  //     setRoomId(roomId);
  //     setRoomName(roomName);
  //   } catch (err) {
  //     setError("Login failed: " + (err.response?.data?.message || err.message));
  //   }
  // };

  // const handleLogin = async ({ username, password, roomId, roomName, setError }) => {
  //   try {
  //     let res;
  //     try {
  //       res = await axios.post(`${BACKEND_URL}/api/users/login`, { username, password });
  //     } catch (loginErr) {
  //       if (loginErr.response?.status === 404) {
  //         // Ask to register
  //         if (window.confirm("User not found. Do you want to register?")) {
  //           await axios.post(`${BACKEND_URL}/api/users/register`, { username, password });
  //           res = await axios.post(`${BACKEND_URL}/api/users/login`, { username, password });
  //         } else {
  //           return; // stop here
  //         }
  //       } else if (loginErr.response?.status === 401) {
  //         setError("Incorrect password");
  //         return; // stop here
  //       } else {
  //         throw loginErr; // other errors
  //       }
  //     }

  //     if (!res) return; // prevent using undefined

  //     setToken(res.data.token);
  //     setLoggedIn(true);
  //     setUsername(username);
  //     setRoomId(roomId);
  //     setRoomName(roomName);

  //   } catch (err) {
  //     setError("Login failed: " + (err.response?.data?.message || err.message));
  //   }
  // };

  

const handleLogin = async ({ username, password, roomId, roomName, setError }) => {
  try {
    let res;
    try {
      res = await axios.post(`${BACKEND_URL}/api/users/login`, { username, password });
    } catch (loginErr) {
      // If backend says user not found (404), ask to register
      if (loginErr.response?.status === 404) {
        setError(loginErr.response.data?.message || "User not found");
        if (window.confirm((loginErr.response.data?.message || "User not found") + " — Do you want to register?")) {
          await axios.post(`${BACKEND_URL}/api/users/register`, { username, password });
          setError("Registration successful! Logging you in...");
          res = await axios.post(`${BACKEND_URL}/api/users/login`, { username, password });
        } else {
          return;
        }
      } else {
        // Any other backend error (wrong password, etc.) → show message directly
        setError(loginErr.response?.data?.message || loginErr.message || "Login failed");
        return;
      }
    }

    if (!res) return; // Stop if login/registration failed

    setToken(res.data.token);
    setLoggedIn(true);
    setUsername(username);
    setRoomId(roomId);
    setRoomName(roomName);

  } catch (err) {
    setError(err.response?.data?.message || err.message || "Login failed");
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
        <RoomPage
          roomName={roomName}
          users={users}
          code={code}
          onCodeChange={(newCode) => {
            setCode(newCode);
            skipNextUpdate.current = true;
            if (socketRef.current) {
              socketRef.current.emit("code-change", { roomId, code: newCode });
            }
          }}
          onLeave={() => {
            if (socketRef.current) socketRef.current.disconnect();
            setLoggedIn(false);
            setCode("");
            setUsers([]);
          }}
        />

      )}
    </div>

  );
}

export default App;
