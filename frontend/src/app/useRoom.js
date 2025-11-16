import axios from "axios";
import { BACKEND_URL } from "./constants";
import { useState } from "react";

export default function useRoom(token) {
  const [inRoom, setInRoom] = useState(false);
  const [roomId, setRoomId] = useState("");
  const [roomName, setRoomName] = useState("");
  const [languageId, setLanguageId] = useState(63);

  const handleCreateRoom = async (roomNameInput, languageIdInput) => {
    try {
      const res = await axios.post(
        `${BACKEND_URL}/api/rooms/create`,
        { name: roomNameInput, languageId: languageIdInput },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setRoomId(res.data.roomId);
      setRoomName(res.data.name);
      setLanguageId(res.data.languageId);
      setInRoom(true);
    } catch (err) {
      alert(err.response?.data?.message || "Room creation failed");
    }
  };

  const handleJoinRoom = async (roomIdInput) => {
    try {
      const res = await axios.post(
        `${BACKEND_URL}/api/rooms/join`,
        { roomId: roomIdInput },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setRoomId(res.data.roomId);
      setRoomName(res.data.name);
      setLanguageId(res.data.languageId);
      setInRoom(true);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to join room");
    }
  };

  return {
    inRoom,
    roomId,
    roomName,
    languageId,
    setInRoom,
    handleCreateRoom,
    handleJoinRoom,
  };
}
