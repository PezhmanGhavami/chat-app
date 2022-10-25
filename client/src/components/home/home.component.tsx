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
        <button onClick={sendMessage}>Say hello!</button>
        <p>
          Edit <code>src/App.js</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>
    </div>
  );
}

export default Home;
