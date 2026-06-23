import React from "react";
import LoginPage from "./pages/LoginPage";
import RoomPage from "./pages/RoomPage";
import HomePage from "./pages/HomePage";

import useAuth from "./app/useAuth";
import useRoom from "./app/useRoom";
import useSocket from "./app/useSocket";
import useCodeChatHandlers from "./app/useCodeChatHandlers";

function App() {
  const {
    token,
    setToken,
    loggedIn,
    username,
    setUsername,
    handleGoogleLogin,
    doLogout,
  } = useAuth();

  const {
    inRoom,
    roomId,
    roomName,
    languageId,
    setInRoom,
    handleCreateRoom,
    handleJoinRoom,
  } = useRoom(token);

  const {
    socketRef,
    code,
    setCode,
    users,
    messages,
    typingUsers,
    skipNextUpdate,
  } = useSocket({
    token,
    inRoom,
    roomId,
    roomName,
    username,
  });

  const { handleCodeChange, handleSendMessage, handleTyping } =
    useCodeChatHandlers({
      socketRef,
      roomId,
      username,
      skipNextUpdate,
      setCode,
    });

  return (
    <div className="app-container">
      {!loggedIn ? (
        <LoginPage onLogin={handleGoogleLogin} />
      ) : !inRoom ? (
        <HomePage
          username={username}
          setUsername={setUsername}
          setToken={setToken}
          onCreateRoom={handleCreateRoom}
          onJoinRoom={handleJoinRoom}
          onLogout={doLogout}
        />
      ) : (
        <RoomPage
          roomId={roomId}
          roomName={roomName}
          users={users}
          code={code}
          languageId={languageId}
          messages={messages}
          typingUsers={typingUsers}
          currentUser={username}
          onCodeChange={handleCodeChange}
          onSendMessage={handleSendMessage}
          onTyping={handleTyping}
          onLeave={() => {
            if (socketRef.current) socketRef.current.disconnect();
            setInRoom(false);
            setCode("");
          }}
        />
      )}
    </div>
  );
}

export default App;
