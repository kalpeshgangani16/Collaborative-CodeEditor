import { useEffect, useRef, useState } from "react";

export default function useAuth() {
  const [token, setToken] = useState("");
  const [loggedIn, setLoggedIn] = useState(false);
  const [username, setUsername] = useState("");

  const bcRef = useRef(null);

  // Initial login load
  useEffect(() => {
    const savedToken = localStorage.getItem("token");
    const savedUser = localStorage.getItem("user");

    if (savedToken && savedUser) {
      setToken(savedToken);
      const parsed = JSON.parse(savedUser);
      setUsername(parsed.username || "Guest");
      setLoggedIn(true);
    }
  }, []);

  // BroadcastChannel + storage listener
  useEffect(() => {
    if ("BroadcastChannel" in window) {
      bcRef.current = new BroadcastChannel("auth");
      bcRef.current.onmessage = (ev) => {
        const { type, token: newToken, user } = ev.data || {};
        if (type === "logout") doLogout(false);
        else if (type === "login" && newToken && user) {
          localStorage.setItem("token", newToken);
          localStorage.setItem("user", JSON.stringify(user));
          setToken(newToken);
          setUsername(user.username || "Guest");
          setLoggedIn(true);
        }
      };
    }

    const onStorage = () => {
      const newToken = localStorage.getItem("token");
      const newUserStr = localStorage.getItem("user");

      if (!newToken || !newUserStr) doLogout(false);
      else {
        const parsed = JSON.parse(newUserStr);
        setToken(newToken);
        setUsername(parsed.username || "Guest");
        setLoggedIn(true);
      }
    };

    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("storage", onStorage);
      if (bcRef.current) bcRef.current.close();
    };
  }, []);

  useEffect(() => {
    setLoggedIn(Boolean(token));
  }, [token]);

  const doLogout = (broadcast = true) => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    setToken("");
    setUsername("");
    setLoggedIn(false);

    if (broadcast) {
      if (bcRef.current) bcRef.current.postMessage({ type: "logout" });
      else localStorage.setItem("__auth_broadcast", Date.now().toString());
    }
  };

  const handleGoogleLogin = (jwtToken, user) => {
    localStorage.setItem("token", jwtToken);
    localStorage.setItem("user", JSON.stringify(user));
    localStorage.setItem("loginTime", Date.now());

    setToken(jwtToken);
    setUsername(user.username || "Guest");
    setLoggedIn(true);

    if (bcRef.current)
      bcRef.current.postMessage({ type: "login", token: jwtToken, user });
  };

  // Auto logout after 1 hour
  useEffect(() => {
    if (!token) return;

    const loginTime = localStorage.getItem("loginTime");
    if (!loginTime) return;

    const now = Date.now();
    const duration = 1 * 60 * 60 * 1000;
    const timeLeft = duration - (now - parseInt(loginTime));

    if (timeLeft <= 0) doLogout(true);
    else {
      const timer = setTimeout(() => doLogout(true), timeLeft);
      return () => clearTimeout(timer);
    }
  }, [token]);

  return { token, loggedIn, username, setUsername, handleGoogleLogin, doLogout };
}
