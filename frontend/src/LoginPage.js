import React, { useState } from "react";
// import "./LoginForm.css"; // Only here, so CSS is scoped to login screen

function LoginPage({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [roomId, setRoomId] = useState("");
  const [roomName, setRoomName] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = () => {
    if (!username || !password || !roomId || !roomName) {
      setError("Enter all fields: username, password, room ID, and room name");
      return;
    }
    setError("");
    onLogin({ username, password, roomId, roomName, setError });
  };

  return (
    <div className="login-card">
      <h2>Join a Room</h2>

      <input
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        placeholder="Username"
        className="input-field"
      />

      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        className="input-field"
      />

      <input
        type="text"
        value={roomId}
        onChange={(e) => setRoomId(e.target.value)}
        placeholder="Room ID"
        className="input-field"
      />

      <input
        type="text"
        value={roomName}
        onChange={(e) => setRoomName(e.target.value)}
        placeholder="Room Name"
        className="input-field"
      />

      <button onClick={handleSubmit} className="btn-primary">
        Join Room
      </button>

      {error && <div className="error-text">{error}</div>}
    </div>
  );
}

export default LoginPage;
