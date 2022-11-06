import {
  useState,
  useEffect,
  createContext,
  ReactNode,
} from "react";

interface IWebSocketContext {
  ws: WebSocket | null;
  isConnected: boolean;
}

export const WebSocketContext =
  createContext<IWebSocketContext>({
    ws: null,
    isConnected: false,
  });

const WebSocketProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!isConnected) {
      console.log("Connecting...");
      // const webSocket = new WebSocket(
      //   "ws://localhost:5000/"
      // );
      // setWs(webSocket);
      // console.log("Reconnecting in 5 seconds");
      setTimeout(() => {
        if (!isConnected) {
          console.log("Connecting...");
          const webSocket = new WebSocket(
            "ws://localhost:5000/"
          );
          setWs(webSocket);
        }
      }, 5000);
    }
  }, [isConnected]);

  useEffect(() => {
    if (ws) {
      ws.onopen = () => {
        console.log("Connected to socket");
        setIsConnected(true);

        ws.onmessage = (event) => {
          console.log(event);
        };
      };

      ws.onclose = (event) => {
        console.log("disconnected");
        setIsConnected(false);
      };

      ws.onerror = (event) => {
        console.error("error");
        setIsConnected(false);
      };

      return () => {
        ws.close();
      };
    }
  }, [ws]);

  const value = {
    ws,
    isConnected,
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
};

export default WebSocketProvider;
