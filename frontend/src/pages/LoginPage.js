// src/pages/LoginPage.js
import React from "react";
import { GoogleLogin } from "@react-oauth/google";
import axios from "axios";
import "./LoginPage.css";


function LoginPage({ onLogin }) {
  const handleSuccess = async (credentialResponse) => {
    try {
      const res = await axios.post("http://localhost:5000/api/users/google", {
        token: credentialResponse.credential,
      });

      const { token, user } = res.data;
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));

      onLogin(token, user);
    } catch (err) {
      console.error(
        "Google login error:",
        err.response ? err.response.data : err.message
      );
      alert("Login failed: " + (err.response?.data?.message || err.message));
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h1 className="app-title">CodeCollab</h1>
        <p className="app-tagline">Collaborate. Code. Chat. Download</p>

        <GoogleLogin
          text="continue_with"
          onSuccess={handleSuccess}
          onError={() => alert("Google Login Failed")}
          size="large"
          shape="pill"
          theme="outline"

        />
      </div>
    </div>
  );
}

export default LoginPage;
