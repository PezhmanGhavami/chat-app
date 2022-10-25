import { useState, useEffect } from "react";
import io from "socket.io-client";

const socket = io("http://127.0.0.1:5000");

function Home() {
  const [isConnected, setIsConnected] = useState(
    socket.connected
  );
  const [lastMessage, setLastMessage] = useState(null);

  useEffect(() => {
    socket.on("connect", () => {
      setIsConnected(true);
    });
    socket.on("disconnect", () => {
      setIsConnected(false);
    });
    socket.on("message", (data) => {
      setLastMessage(data);
    });
    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("message");
    };
  }, []);

  const sendMessage = () => {
    socket.emit("hello!");
  };

  return (
    <div className="App">
      <header className="App-header">
        <p>Connected: {"" + isConnected}</p>
        <p>Last message: {lastMessage || "-"}</p>
        <button
          className="p-4 bg-white hover:opacity-75 text-slate-900"
          onClick={sendMessage}
        >
          Say hello!
        </button>
      </header>
    </div>
  );
}

export default Home;
