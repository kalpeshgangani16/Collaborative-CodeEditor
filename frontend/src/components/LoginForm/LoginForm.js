import React, { useState } from "react";
import styles from "./LoginForm.module.css"; // CSS Modules

function LoginForm({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [roomId, setRoomId] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");   // ✅ new success state
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!username || !password || !roomId) {
      setError("Enter all fields: username, password, and room ID");
      return;
    }
    setError("");
    setSuccess(""); // clear old success

    const isConfirmed = window.confirm("Do you want to join this room?");
    if (!isConfirmed) return;

    setLoading(true);

    try {
      await onLogin({ username, password, roomId, setError, setSuccess });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.loginCard}>
      <h2>Join a Room</h2>

      <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Username" />
      <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" />
      <input type="text" value={roomId} onChange={(e) => setRoomId(e.target.value)} placeholder="Room ID" />

      <button onClick={handleSubmit} disabled={loading}>
        {loading && <div className={styles.spinner}></div>}
        {loading ? " Joining Room..." : "Join Room"}
      </button>

      {error && <div className={styles.errorMessage}>{error}</div>}
      {success && <div className={styles.successMessage}>{success}</div>}
    </div>
  );
}

export default LoginForm;
