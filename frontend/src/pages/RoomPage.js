import React, { useState, useEffect, useRef } from "react";
import { Editor } from "@monaco-editor/react";
import axios from "axios";
import "./RoomPage.css";

function RoomPage({
  roomId, roomName, users, currentUser, code,
  messages, typingUsers, onCodeChange,
  onSendMessage, onTyping, onLeave, languageId
}) {
  const [output, setOutput] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [panelHeight, setPanelHeight] = useState(200);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const chatEndRef = useRef(null);
  const isResizing = useRef(false);  


  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = () => {
    if (newMessage.trim()) {
      onSendMessage(newMessage);
      setNewMessage("");
    }
  };

  const runCode = async () => {
    try {
      const response = await axios.post("http://localhost:5000/api/execute", {
        language_id: languageId,
        source_code: code,
        stdin: ""
      });
      setOutput(response.data.stdout || response.data.stderr || "No output");
    } catch {
      setOutput("Error running code");
    }
  };

  const getMonacoLanguage = () => {
    switch (languageId) {
      case 71: return "python";
      case 62: return "java";
      case 54: return "cpp";
      case 50: return "c";
      case 63:
      default: return "javascript";
    }
  };

  const getFileExtension = () => {
    switch (languageId) {
      case 71: return "py";   // Python
      case 62: return "java"; // Java
      case 54: return "cpp";  // C++
      case 50: return "c";    // C
      case 63:
      default: return "js";   // JavaScript
    }
  };

  const handleDownload = () => {
    const extension = getFileExtension();
    const blob = new Blob([code], { type: "text/plain" });
    const url = window.URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `${roomName || "code"}.${extension}`;
    link.click();

    window.URL.revokeObjectURL(url);
  };


  const languageTemplates = {
    63: { name: "JavaScript" },
    71: { name: "Python" },
    62: { name: "Java" },
    54: { name: "C++" },
    50: { name: "C" },
  };

  // ✅ Resize handlers
  const handleMouseDown = (e) => {
    isResizing.current = true;
    e.preventDefault();
  };

  const handleMouseMove = (e) => {
    if (!isResizing.current) return;
    const newHeight = window.innerHeight - e.clientY; // distance from bottom
    if (newHeight > 40 && newHeight < window.innerHeight * 0.7) {
      setPanelHeight(newHeight);
    }
  };

  const handleMouseUp = () => {
    isResizing.current = false;
  };

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);


  return (
    <div className={`room-container ${isDarkMode ? "dark" : "light"}`}> {/* ✅ theme class */}
      <header className="room-header">
        <h2>{roomName} ({roomId})</h2>
        <div className="language-name">
          Language: <strong>{languageTemplates[languageId]?.name}</strong>
        </div>
        <div className="header-actions">
          <button
            className="theme-toggle-btn"
            onClick={() => setIsDarkMode(!isDarkMode)}
          >
            {isDarkMode ? "🌞 Light" : "🌙 Dark"}
          </button>
          <button className="chat-btn" onClick={() => setIsChatOpen(true)}>💬 Chat</button>
          <button className="download-btn" onClick={handleDownload}>⬇ Download</button>
          <button className="leave-btn" onClick={onLeave}>Leave Room</button>
        </div>
      </header>

      {typingUsers.length > 0 && (
        <div className="typing-indicator">
          {typingUsers.join(", ")} {typingUsers.length > 1 ? "are" : "is"} typing...
        </div>
      )}

      <div className="room-body">
        {/* User list */}
        <aside className="user-list">
          <h3>Users</h3>
          <ul>{users.map((user, i) => (<li key={i}>{user}</li>))}</ul>
        </aside>

        {/* Code Editor */}
        <main className="editor-area">
          <div className="editor-wrapper">
            <Editor
              height="100%"
              theme={isDarkMode ? "vs-dark" : "light"} // ✅ theme toggle
              language={getMonacoLanguage()}
              value={code}
              onChange={(value) => onCodeChange(value || "")}
              onMount={(editor) => editor.onDidChangeModelContent(onTyping)}
              options={{
                fontFamily: "Consolas, 'Courier New', monospace", // ✅ monospace only for editor
                fontSize: 14,
              }}
            />
          </div>

          {/* ✅ Resizable Run Panel */}
          <div className="run-panel" style={{ height: `${panelHeight}px` }}>
            <div className="resize-handle" onMouseDown={handleMouseDown}></div>
            <div className="run-panel-actions">
              <button className="run-btn" onClick={runCode}>▶ Run</button>
              <button className="clear-btn" onClick={() => setOutput("")}>Clear</button>
            </div>
            <h3>Output:</h3>
            <pre className="output">{output}</pre>
          </div>
        </main>
      </div>

      {/* ✅ Fullscreen Chat Modal */}
      {isChatOpen && (
        <div className="chat-overlay">
          <div className="chat-box">
            <header className="chat-header">
              <h3>Group Chat</h3>
              <button className="close-btn" onClick={() => setIsChatOpen(false)}>✖</button>
            </header>
            <div className="chat-messages">
              {messages.map((msg, i) => {
                const time = new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
                return (
                  <div key={i} className={`chat-message ${msg.sender === currentUser ? "own" : "other"}`}>
                    {msg.sender !== currentUser && (
                      <div className="chat-username">{msg.sender}</div>
                    )}
                    <div className="chat-bubble">
                      {msg.text}
                      <span className="chat-time">{time}</span>
                    </div>
                  </div>
                );
              })}
              <div ref={chatEndRef}></div>
            </div>
            <div className="chat-input">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              />
              <button onClick={sendMessage}>Send</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default RoomPage;
