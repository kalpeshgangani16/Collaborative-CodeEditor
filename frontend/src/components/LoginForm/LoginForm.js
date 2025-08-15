import React, { useState } from "react";
import styles from "./LoginForm.module.css"; // CSS Modules

function LoginForm({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [roomId, setRoomId] = useState("");
  const [roomName, setRoomName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!username || !password || !roomId || !roomName) {
      setError("Enter all fields: username, password, room ID, and room name");
      return;
    }
    setError("");

    // Step 1: Ask for confirmation first (if you have a popup or confirm)
    const isConfirmed = window.confirm("Do you want to join this room?");
    if (!isConfirmed) return;

    // Step 2: Start loading AFTER confirmation
    setLoading(true);

    try {
      await onLogin({ username, password, roomId, roomName, setError });
    } finally {
      setLoading(false);
    }
  };



  return (
    <div className={styles.loginCard}>
      <h2>Join a Room</h2>

      <input
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        placeholder="Username"
      />

      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
      />

      <input
        type="text"
        value={roomId}
        onChange={(e) => setRoomId(e.target.value)}
        placeholder="Room ID"
      />

      <input
        type="text"
        value={roomName}
        onChange={(e) => setRoomName(e.target.value)}
        placeholder="Room Name"
      />

      <button onClick={handleSubmit} disabled={loading}>
        {loading && <div className={styles.spinner}></div>}
        {loading ? " Joining Room..." : "Join Room"}
      </button>

      {error && (
        <div
          className={
            error.toLowerCase().includes("successful")
              ? styles.successMessage
              : styles.errorMessage
          }
        >
          {error}
        </div>
      )}
    </div>
  );
}

export default LoginForm;
