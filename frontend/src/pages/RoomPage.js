import React from "react";
import "./RoomPage.css"; // we’ll style it separately
import { Editor } from "@monaco-editor/react";

function RoomPage({ roomName, users, code, onCodeChange, onLeave }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      <header style={{ padding: "10px", background: "#222", color: "#fff" }}>
        <h2>{roomName}</h2>
        <p>Users: {users.join(", ")}</p>
        <button onClick={onLeave}>Leave Room</button>
      </header>

      <Editor
        height="100%"
        theme="vs-dark"
        defaultLanguage="javascript"
        value={code}
        onChange={(value) => onCodeChange(value || "")}
      />
    </div>
  );
}

export default RoomPage;