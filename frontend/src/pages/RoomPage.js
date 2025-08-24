import React, { useState, useEffect, useRef } from "react";
import { Editor } from "@monaco-editor/react";
import io from "socket.io-client";
import "./RoomPage.css";


function RoomPage({ roomName, users, currentUser, code, onCodeChange, onLeave }) {
  const [output, setOutput] = useState("");
  const [typingUsers, setTypingUsers] = useState([]);
  const socketRef = useRef(null);
  const editorRef = useRef(null);

  // ✅ Connect to socket + join room
  useEffect(() => {
    socketRef.current = io("http://localhost:5000");

    socketRef.current.emit("join-room", roomName, currentUser);

    // only listen for typing events now
    socketRef.current.on("user-typing", (username) => {
      setTypingUsers((prev) =>
        prev.includes(username) ? prev : [...prev, username]
      );
      setTimeout(() => {
        setTypingUsers((prev) => prev.filter((u) => u !== username));
      }, 1500);
    });

    return () => {
      socketRef.current.disconnect();
    };
  }, [roomName, currentUser]);

  // ✅ Handle typing events
  const handleEditorMount = (editor) => {
    editorRef.current = editor;

    editor.onDidChangeModelContent(() => {
      socketRef.current.emit("user-typing", {
        roomId: roomName,
        username: currentUser,
      });
    });
  };

  // ✅ Run Code
  const runCode = () => {
    try {
      let logs = [];

      const customConsole = {
        log: (...args) => logs.push(args.join(" ")),
        warn: (...args) => logs.push("⚠️ " + args.join(" ")),
        error: (...args) => logs.push("❌ " + args.join(" ")),
      };

      const sandbox = new Function("console", code);
      const result = sandbox(customConsole);

      if (logs.length > 0) {
        if (result !== undefined) {
          logs.push("Return: " + result);
        }
        setOutput(logs.join("\n"));
      } else {
        setOutput(
          result !== undefined ? String(result) : "✅ Code executed (no output)"
        );
      }
    } catch (err) {
      setOutput("Error: " + err.message);
    }
  };

  return (
    <div className="room-container">
      {/* Header */}
      <header className="room-header">
        <div>
          <h2>{roomName}</h2>
        </div>
        <button className="leave-btn" onClick={onLeave}>
          Leave Room
        </button>
      </header>

      {/* Typing Indicator */}
      {typingUsers.length > 0 && (
        <div className="typing-indicator">
          {typingUsers.join(", ")} {typingUsers.length > 1 ? "are" : "is"} typing...
        </div>
      )}

      {/* Body */}
      <div className="room-body">
        {/* User List */}
        <aside className="user-list">
          <h3>Users</h3>
          <ul>
            {users.map((user, index) => (
              <li key={index}>{user}</li>
            ))}
          </ul>
        </aside>

        {/* Editor Area */}
        <main className="editor-area">
          <div className="editor-wrapper">
            <Editor
              height="100%"
              theme="vs-dark"
              defaultLanguage="javascript"
              value={code}
              onChange={(value) => onCodeChange(value || "")}
              onMount={handleEditorMount}
            />
          </div>

          {/* Run + Output Panel */}
          <div className="run-panel">
            <button className="run-btn" onClick={runCode}>
              ▶ Run
            </button>
            <h3>Output:</h3>
            <pre className="output">{output}</pre>
          </div>
        </main>
      </div>
    </div>
  );
}

export default RoomPage;
