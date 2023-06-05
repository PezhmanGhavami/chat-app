import { useState, useEffect, createContext, ReactNode } from "react";
import io, { Socket } from "socket.io-client";

import useUser from "../hooks/useUser";

interface ISocketIOContext {
  socket: null | Socket;
  isConnected: boolean;
  updateIsConnected: (newState: boolean) => void;
}

const socketIOContextInit: ISocketIOContext = {
  socket: null,
  isConnected: false,
  updateIsConnected: (newState: boolean) => {},
};

export const SocketIOContext =
  createContext<ISocketIOContext>(socketIOContextInit);

const SocketIOProvider = ({ children }: { children: ReactNode }) => {
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
    <SocketIOContext.Provider value={payload}>
      {children}
    </SocketIOContext.Provider>
  );
};

export default SocketIOProvider;
