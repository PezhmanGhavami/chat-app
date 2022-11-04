import { useState, useEffect, createContext } from "react";
import { Outlet } from "react-router-dom";
import io from "socket.io-client";

import Navigation from "../navigation/navigation.component";

const socket = io("127.0.0.1:5000");
export const SocketContext = createContext({ socket });

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
    <SocketContext.Provider value={{ socket }}>
      <div className="w-screen h-screen flex">
        <div className="bg-neutral-800 w-full h-full sm:w-64 md:w-72 lg:w-80 xl:w-96 z-10">
          <Navigation connected={isConnected} />
        </div>
        <main className="fixed inset-0 translate-x-full sm:static sm:translate-x-0 sm:flex-1 sm-w-full">
          <Outlet />
        </main>
      </div>
    </SocketContext.Provider>
  );
};

export default Layout;
