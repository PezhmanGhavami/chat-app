import {
  useState,
  useEffect,
  createContext,
  ReactNode,
} from "react";
import io, { Socket } from "socket.io-client";

import useUser from "../hooks/useUser";

export const WebSocketContext =
  createContext<null | Socket>(null);

const WebSocketProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const { user } = useUser();

  useEffect(() => {
    const newSocekt = io("http://localhost:5001", {
      query: {
        id: user?.userID,
      },
    });
    setSocket(newSocekt);

    return () => {
      newSocekt.close();
    };
  }, [user]);

  return (
    <WebSocketContext.Provider value={socket}>
      {children}
    </WebSocketContext.Provider>
  );
};

export default WebSocketProvider;
