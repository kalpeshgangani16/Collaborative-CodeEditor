import React, { useState } from "react";
import styles from "./LoginForm.module.css";

function CreateRoomForm({ onCreate }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [roomName, setRoomName] = useState("");
  const [roomId, setRoomId] = useState(null);
  const [languageId, setLanguageId] = useState(63); // Default: JavaScript (Node.js)
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");   // ✅ success state
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!username || !password || !roomName) {
      setError("Enter all fields: username, password, room name");
      return;
    }
    setError("");
    setSuccess("");

    const isConfirmed = window.confirm("Do you want to create new room?");
    if (!isConfirmed) return;

    setLoading(true);

    try {
      await onCreate({ username, password, roomName, languageId, setError, setSuccess })
        .then((res) => {
          if (res?.roomId) {
            setRoomId(res.roomId);
            setSuccess("🎉 Room created successfully! Share the ID below.");
          }
        });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.loginCard}>
      <h2>Create a Room</h2>

      <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Username" />
      <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" />
      <input type="text" value={roomName} onChange={(e) => setRoomName(e.target.value)} placeholder="Room Name" />
      {/* 🔽 Language Selector Dropdown */}
      <select
        value={languageId}
        onChange={(e) => setLanguageId(Number(e.target.value))}
        className={styles.dropdown}
      >
        <option value={63}>JavaScript (Node.js)</option>
        <option value={71}>Python 3</option>
        <option value={62}>Java</option>
        <option value={54}>C++</option>
        <option value={50}>C</option>
      </select>

      <button onClick={handleSubmit} disabled={loading}>
        {loading && <div className={styles.spinner}></div>}
        {loading ? " Creating..." : "Create Room"}
      </button>


      {error && <div className={styles.errorMessage}>{error}</div>}
      {success && <div className={styles.successMessage}>{success}</div>}  {/* ✅ success shown here */}

      {roomId && (
        <div className={styles.successMessage}>
          ✅ Room ID: <b>{roomId}</b>
        </div>
      )}
    </div>
  );
}

export default CreateRoomForm;
