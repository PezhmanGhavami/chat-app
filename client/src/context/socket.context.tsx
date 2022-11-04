import {
  useState,
  useEffect,
  ReactNode,
  createContext,
} from "react";

import io from "socket.io-client";

const socket = io("127.0.0.1:5000");
export const SocketContext = createContext({
  socket,
  isConnected: false,
});

const SocketProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    socket.on("connect", () => {
      setIsConnected(true);
    });
    socket.on("disconnect", () => {
      setIsConnected(false);
    });
    socket.on("error", (error) => {
      console.log(error);
    });
    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("error");
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};

export default SocketProvider;
