import React, { useState } from "react";
import LoginForm from "../components/LoginForm/LoginForm";
import CreateRoomForm from "../components/LoginForm/CreateRoomForm";

function LoginPage({ onLogin, onCreate }) {
  const [isCreate, setIsCreate] = useState(false);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        background: "linear-gradient(135deg, #74EBD5, #9FACE6)",
      }}
    >
      {isCreate ? (
        <CreateRoomForm onCreate={onCreate} />
      ) : (
        <LoginForm onLogin={onLogin} />
      )}

      <button
        style={{
          marginTop: "20px",
          padding: "10px 20px",
          backgroundColor: "#4a69bd",
          color: "#fff",
          border: "none",
          borderRadius: "8px",
          cursor: "pointer",
        }}
        onClick={() => setIsCreate(!isCreate)}
      >
        {isCreate ? "Switch to Join Room" : "Switch to Create Room"}
      </button>
    </div>
  );
}

export default LoginPage;
