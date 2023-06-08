import {
  useState,
  useEffect,
  useContext,
  createContext,
  ReactNode,
} from "react";

import useUser from "../hooks/useUser";

import { SocketIOContext } from "./socket.io.context";

export interface IRemoteUserInfo {
  displayName: string;
  recipientId: string;
}

interface ICallContext {
  isRecivingCall: boolean;
  callStarted: boolean;
  isCallInitiator: boolean;
  remoteUserInfo: IRemoteUserInfo;
  updateCallStatus: (started: boolean) => void;
  endCall: () => void;
  updateRemoteUserInfo: (newState: IRemoteUserInfo) => void;
  updateIsCallInitiator: (state: boolean) => void;
}

const callerContextInit: ICallContext = {
  isRecivingCall: false,
  callStarted: false,
  isCallInitiator: false,
  remoteUserInfo: { displayName: "", recipientId: "" },
  updateCallStatus: (started) => {},
  endCall: () => {},
  updateRemoteUserInfo: (newState) => {},
  updateIsCallInitiator: (state) => {},
};

export const CallContext = createContext<ICallContext>(callerContextInit);

const CallProvider = ({ children }: { children: ReactNode }) => {
  const [isRecivingCall, setIsRecivingCall] = useState(
    callerContextInit.isRecivingCall,
  );
  const [callStarted, setCallStarted] = useState(callerContextInit.callStarted);
  const [remoteUserInfo, setRemoteUserInfo] = useState({
    ...callerContextInit.remoteUserInfo,
  });
  const [isCallInitiator, setIsCallInitiator] = useState(false);

  const { user: currentUser } = useUser();

  const { socket, isConnected } = useContext(SocketIOContext);

  useEffect(() => {
    if (!socket || !currentUser || !isConnected) return;

    socket.on(`incoming-call`, ({ callFrom, signalData }) => {
      // TODO - add some sort of reject
      if (callStarted || isCallInitiator) return;
      updateRemoteUserInfo({ ...callFrom });
      setIsRecivingCall(true);
      updateIsCallInitiator(false);
      // TODO - add a timer to auto reject after 60 sec and reset the state
    });

    return () => {
      socket.off("incoming-call");
    };
  }, [socket, currentUser, isConnected]);

  const updateCallStatus = (started: boolean) => {
    setCallStarted(started);
    if (!started) {
      setIsRecivingCall(false);
      updateRemoteUserInfo({ ...callerContextInit.remoteUserInfo });
    }
  };

  const updateIsCallInitiator = (state: boolean) => {
    setIsCallInitiator(state);
  };

  const updateRemoteUserInfo = (newState: IRemoteUserInfo) => {
    setRemoteUserInfo({ ...newState });
  };

  const endCall = () => {
    updateCallStatus(false);
  };

  const payload = {
    isRecivingCall,
    callStarted,
    isCallInitiator,
    remoteUserInfo,
    endCall,
    updateCallStatus,
    updateRemoteUserInfo,
    updateIsCallInitiator,
  };

  return (
    <CallContext.Provider value={payload}>{children}</CallContext.Provider>
  );
};

export default CallProvider;
