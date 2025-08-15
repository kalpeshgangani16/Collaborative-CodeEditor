import React from "react";
import LoginForm from "../components/LoginForm/LoginForm";

function LoginPage({ onLogin }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        background: "linear-gradient(135deg, #74EBD5, #9FACE6)",
      }}
    >
      <LoginForm onLogin={onLogin} />
    </div>
  );
}

export default LoginPage;
