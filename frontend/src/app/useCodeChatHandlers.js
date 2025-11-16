export default function useCodeChatHandlers({
  socketRef,
  roomId,
  username,
  skipNextUpdate,
  setCode,
}) {
  const handleCodeChange = (newCode) => {
    setCode(newCode);
    skipNextUpdate.current = true;

    if (socketRef.current)
      socketRef.current.emit("code-change", { roomId, code: newCode });
  };

  const handleSendMessage = (text) => {
    if (socketRef.current)
      socketRef.current.emit("chat-message", {
        roomId,
        sender: username,
        text,
      });
  };

  const handleTyping = () => {
    if (socketRef.current)
      socketRef.current.emit("user-typing", username);
  };

  return { handleCodeChange, handleSendMessage, handleTyping };
}
