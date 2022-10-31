import { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import io from "socket.io-client";

import Navigation from "../navigation/navigation.component";

const socket = io("127.0.0.1:5000");

const Layout = () => {
  const [isConnected, setIsConnected] = useState(
    socket.connected
  );

  useEffect(() => {
    socket.on("connect", () => {
      setIsConnected(true);
    });
    socket.on("disconnect", () => {
      setIsConnected(false);
    });
    return () => {
      socket.off("connect");
      socket.off("disconnect");
    };
  }, []);

  return (
    <div className="w-screen min-h-screen grid grid-cols- sm:grid-cols-3">
      <div className="bg-neutral-800 p-3">
        <Navigation connected={isConnected} />
      </div>
      <main className="sm:col-span-2">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
