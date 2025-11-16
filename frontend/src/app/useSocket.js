import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import axios from "axios";
import { BACKEND_URL } from "./constants";

export default function useSocket({
  token,
  inRoom,
  roomId,
  roomName,
  username,
}) {
  const socketRef = useRef(null);
  const skipNextUpdate = useRef(false);
  const typingTimeouts = useRef({});

  const [users, setUsers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);
  const [code, setCode] = useState("");

  useEffect(() => {
    if (!token || !inRoom) return;

    axios
      .get(`${BACKEND_URL}/api/rooms/${roomId}/code`)
      .then((res) => setCode(res.data.code || ""))
      .catch(() => setCode(""));

    const socket = io(BACKEND_URL, {
      auth: { token },
      autoConnect: true,
      reconnectionAttempts: 3,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("join-room", { roomId, username, roomName });
    });

    socket.on("chat-history", setMessages);

    socket.on("chat-message", (msg) =>
      setMessages((prev) => [...prev, msg])
    );

    socket.on("user-typing", (typingUser) => {
      if (typingUser === username) return;
      setTypingUsers((prev) =>
        prev.includes(typingUser) ? prev : [...prev, typingUser]
      );

      if (typingTimeouts.current[typingUser])
        clearTimeout(typingTimeouts.current[typingUser]);

      typingTimeouts.current[typingUser] = setTimeout(() => {
        setTypingUsers((prev) => prev.filter((u) => u !== typingUser));
      }, 1500);
    });

    socket.on("current-users", setUsers);

    socket.on("user-joined", (user) =>
      setUsers((prev) => [...new Set([...prev, user])])
    );

    socket.on("user-left", (leftUser) =>
      setUsers((prev) => prev.filter((u) => u !== leftUser))
    );

    socket.on("code-update", (newCode) => {
      if (!skipNextUpdate.current) setCode(newCode);
      else skipNextUpdate.current = false;
    });

    socket.on("connect_error", () => {});

    return () => {
      try {
        socket.disconnect();
      } catch {}
    };
  }, [token, inRoom, roomId, roomName, username]);

  return {
    socketRef,
    code,
    setCode,
    users,
    messages,
    typingUsers,
    skipNextUpdate,
  };
}
