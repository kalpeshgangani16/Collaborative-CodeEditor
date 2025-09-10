import React, { useState, useEffect, useRef } from "react";
import { Editor } from "@monaco-editor/react";
import io from "socket.io-client";
import axios from "axios";
import "./RoomPage.css";

// 🔹 Default templates for each language
import languageTemplates from "../utils/languageTemplates";


function RoomPage({ roomId,roomName, users, currentUser, code, onCodeChange, onLeave }) {
  const [output, setOutput] = useState("");
  const [typingUsers, setTypingUsers] = useState([]);
  const [languageId, setLanguageId] = useState(63); // default Node.js
  const socketRef = useRef(null);
  const editorRef = useRef(null);

  // ✅ Connect socket
  useEffect(() => {
    socketRef.current = io("http://localhost:5000");
    socketRef.current.emit("join-room", roomName, currentUser);

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

  // ✅ Typing event
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
  const runCode = async () => {
    try {
      const response = await axios.post("http://localhost:5000/api/execute", {
        language_id: languageId,
        source_code: code,
        stdin: ""
      });

      setOutput(
        response.data.stdout ||
        response.data.stderr ||
        "No output"
      );
    } catch (err) {
      console.error(err);
      setOutput("❌ Error running code");
    }
  };

  // ✅ Change language → always replace with default template
  // ✅ Change language → always replace with default template
  const handleLanguageChange = (e) => {
    const newLang = Number(e.target.value);
    setLanguageId(newLang);

    // 🔹 Always set the default template of the selected language
    onCodeChange(languageTemplates[newLang]);

    // 🔹 Reset output when language changes
    setOutput("");
  };


  return (
    <div className="room-container">
      {/* 🔹 Header */}
      <header className="room-header">
        <h2>{roomName}({roomId})</h2>

        {/* 🔹 Language selector at the top */}
        <select
          value={languageId}
          onChange={handleLanguageChange}
          className="lang-dropdown"
        >
          <option value={63}>JavaScript (Node.js)</option>
          <option value={71}>Python 3</option>
          <option value={62}>Java</option>
          <option value={54}>C++</option>
          <option value={50}>C</option>
        </select>

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

      {/* 🔹 Body */}
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

        {/* Editor + Run Panel */}
        <main className="editor-area">
          <div className="editor-wrapper">
            <Editor
              height="100%"
              theme="vs-dark"
              language={
                languageId === 71 ? "python" :
                  languageId === 62 ? "java" :
                    languageId === 54 ? "cpp" :
                      languageId === 50 ? "c" :
                        "javascript"
              }
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
