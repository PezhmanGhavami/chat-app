import { useEffect, useState, ChangeEvent } from "react";
import type { NextPage } from "next";
import io from "socket.io-client";

const socket = io("127.0.0.1:3000/api/socket");

const Home: NextPage = () => {
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
      <div>
        <p>Connected: {"" + isConnected}</p>
        <p>Last message: {lastMessage || "-"}</p>
        <button onClick={sendMessage}>Say hello!</button>
      </div>
    </div>
  );
};

export default Home;
