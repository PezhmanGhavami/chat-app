import { useState, useEffect, createContext, ReactNode } from "react";
import io, { Socket } from "socket.io-client";

import useUser from "../hooks/useUser";

interface IWebSocketContext {
  socket: null | Socket;
  isConnected: boolean;
  updateIsConnected: (newState: boolean) => void;
}

const WebSocketContextInit: IWebSocketContext = {
  socket: null,
  isConnected: false,
  updateIsConnected: (newState: boolean) => {},
};

export const WebSocketContext =
  createContext<IWebSocketContext>(WebSocketContextInit);

const WebSocketProvider = ({ children }: { children: ReactNode }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { user } = useUser();

  useEffect(() => {
    const newSocekt = io(import.meta.env.VITE_SOCKET_URL, {
      query: {
        id: user?.userID,
        sessionId: user?.sessionId,
      },
      path: "/ws",
    });
    setSocket(newSocekt);

    return () => {
      newSocekt.close();
    };
  }, [user]);

  const updateIsConnected = (newState: boolean) => {
    setIsConnected(newState);
  };

  const payload = {
    socket,
    isConnected,
    updateIsConnected,
  };

  return (
    <WebSocketContext.Provider value={payload}>
      {children}
    </WebSocketContext.Provider>
  );
};

export default WebSocketProvider;
