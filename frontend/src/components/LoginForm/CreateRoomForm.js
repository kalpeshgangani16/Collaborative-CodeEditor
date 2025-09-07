import React, { useState } from "react";
import styles from "./LoginForm.module.css"; // CSS Modules

function CreateRoomForm({ onCreate }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [roomName, setRoomName] = useState("");
  const [roomId, setRoomId] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!username || !password || !roomName) {
      setError("Enter all fields: username, password, and room name");
      return;
    }
    setError("");

    const isConfirmed = window.confirm("Do you want to create this room?");
    if (!isConfirmed) return;

    setLoading(true);

    try {
      const res = await onCreate({ username, password, roomName, setError });

      if (res?.roomId) {
        setRoomId(res.roomId);
      } else if (error.toLowerCase().includes("user not found")) {
        const registerConfirm = window.confirm(
          "User not found — Do you want to register?"
        );
        if (registerConfirm) {
          console.log("Proceed with registration for:", username);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.loginCard}>
      <h2>Create a Room</h2>

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
        value={roomName}
        onChange={(e) => setRoomName(e.target.value)}
        placeholder="Room Name"
      />

      <button onClick={handleSubmit} disabled={loading}>
        {loading && <div className={styles.spinner}></div>}
        {loading ? " Creating Room..." : "Create Room"}
      </button>

      {error && (
        <div
          className={
            error.toLowerCase().includes("success")
              ? styles.successMessage
              : styles.errorMessage
          }
        >
          {error}
        </div>
      )}

      {roomId && (
        <div className={styles.successMessage}>
          🎉 Room created! Share this ID: <b>{roomId}</b>
        </div>
      )}
    </div>
  );
}

export default CreateRoomForm;
