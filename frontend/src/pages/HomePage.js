import React, { useState } from "react";
import axios from "axios";
import "./HomePage.css";

function HomePage({ username, setUsername, setToken, onCreateRoom, onJoinRoom, onLogout }) {
    const [roomName, setRoomName] = useState("");
    const [roomId, setRoomId] = useState("");
    const [languageId, setLanguageId] = useState("63");
    const [newUsername, setNewUsername] = useState("");

    const languages = [
        { id: 71, name: "Python" },
        { id: 62, name: "Java" },
        { id: 54, name: "C++" },
        { id: 50, name: "C" },
        { id: 63, name: "JavaScript" },
    ];

    const handleUsernameChange = async () => {
        if (!newUsername.trim()) return alert("Enter a new username!");
        try {
            const token = localStorage.getItem("token");
            const res = await axios.put(
                "http://localhost:5000/api/users/username",
                { newUsername },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            alert("Username updated to: " + res.data.user.username);
            localStorage.setItem("token", res.data.token);
            localStorage.setItem("user", JSON.stringify(res.data.user));
            setUsername(res.data.user.username);
            setToken(res.data.token);
            setNewUsername("");
        } catch (err) {
            alert(err.response?.data?.message || "Failed to update username");
        }
    };

    return (
        <div className="homepage-wrapper">
            {/* Sidebar */}
            <div className="homepage-sidebar">
                <h2 className="title">
                    Welcome, <span className="username">{username}</span>
                </h2>
                <p className="subtitle">Create or Join a collaborative coding room</p>

                <div className="form-section">
                    <input
                        type="text"
                        placeholder="Enter new username"
                        value={newUsername}
                        onChange={(e) => setNewUsername(e.target.value)}
                    />
                    <button className="btn btn-update" onClick={handleUsernameChange}>
                        ✏️ Change Username
                    </button>
                </div>

                <div className="form-section">
                    <input
                        type="text"
                        placeholder="Enter Room Name"
                        value={roomName}
                        onChange={(e) => setRoomName(e.target.value)}
                    />
                    <select value={languageId} onChange={(e) => setLanguageId(Number(e.target.value))}>
                        {languages.map((lang) => (
                            <option key={lang.id} value={lang.id}>
                                {lang.name}
                            </option>
                        ))}
                    </select>
                    <button
                        className="btn btn-create"
                        onClick={() => {
                            if (!roomName.trim()) return alert("Enter a room name!");
                            if (!languageId) return alert("Select a language!");
                            onCreateRoom(roomName, languageId);
                        }}
                    >
                        ➕ Create Room
                    </button>
                </div>

                <div className="divider"><span>OR</span></div>

                <div className="form-section">
                    <input
                        type="text"
                        placeholder="Enter Room ID"
                        value={roomId}
                        onChange={(e) => setRoomId(e.target.value)}
                    />
                    <button
                        className="btn btn-join"
                        onClick={() => {
                            if (!roomId.trim()) return alert("Enter a room ID!");
                            onJoinRoom(roomId);
                        }}
                    >
                        🔗 Join Room
                    </button>
                </div>

                <hr className="separator" />

                <button className="btn btn-logout" onClick={onLogout}>
                    🚪 Logout
                </button>
            </div>

            {/* Editor */}
            <div className="homepage-editor">
                <div className="editor-header">
                    <span className="dot red"></span>
                    <span className="dot yellow"></span>
                    <span className="dot green"></span>
                    <span className="file-name">index.js</span>
                </div>
                <pre className="editor-code">
{`function helloWorld() {
    console.log("Welcome to CodeCollab!");
}

helloWorld();`}
                </pre>

                {/* Output Section */}
                <div className="editor-output">
                    <div className="editor-output-title">Output</div>
                    Welcome to CodeCollab!
                </div>
            </div>
        </div>
    );
}

export default HomePage;
