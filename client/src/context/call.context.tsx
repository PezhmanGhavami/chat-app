import {
  useState,
  useEffect,
  useContext,
  createContext,
  ReactNode,
} from "react";
import Peer from "simple-peer";

import useUser from "../hooks/useUser";

import { SocketIOContext } from "./socket.io.context";

export interface IRemoteUser {
  id: string;
  displayName: string;
  stream: MediaStream | null;
  signalData: Peer.SignalData | null;
}

interface ICallContext {
  peer: Peer.Instance | null;
  remoteUser: IRemoteUser;
  callStarted: boolean;
  isRecivingCall: boolean;
  isCallInitiator: boolean;
  endCall: () => void;
  callUser: (localStream: MediaStream) => void;
  answerCall: (localStream: MediaStream) => void;
  updateIsCallInitiator: (newState: boolean) => void;
  updateRemoteUser: (newState: IRemoteUser) => void;
}

const callContextInit: ICallContext = {
  peer: null,
  callStarted: false,
  isRecivingCall: false,
  isCallInitiator: false,
  remoteUser: { displayName: "", id: "", stream: null, signalData: null },
  endCall: () => {},
  callUser: (localStream) => {},
  answerCall: (localStream) => {},
  updateRemoteUser: (newState) => {},
  updateIsCallInitiator: (newState) => {},
};

export const CallContext = createContext<ICallContext>(callContextInit);

const CallProvider = ({ children }: { children: ReactNode }) => {
  const [peer, setPeer] = useState(callContextInit.peer);
  const [remoteUser, setRemoteUser] = useState({
    ...callContextInit.remoteUser,
  });
  const [isRecivingCall, setIsRecivingCall] = useState(
    callContextInit.isRecivingCall,
  );
  const [callStarted, setCallStarted] = useState(callContextInit.callStarted);
  const [isCallInitiator, setIsCallInitiator] = useState(false);

  const { user: currentUser } = useUser();

  const { socket, isConnected } = useContext(SocketIOContext);

  useEffect(() => {
    if (!socket || !currentUser || !isConnected) return;

    socket.on(`incoming-call`, ({ callFrom }: { callFrom: IRemoteUser }) => {
      console.log("Incoming Call ran");
      if (callStarted || isCallInitiator || isRecivingCall) {
        console.log(`
        callStarted: ${callStarted}
        isCallInitiator: ${isCallInitiator}
        isRecivingCall: ${isRecivingCall}
        `);
        console.log("auto reject is in some sort of call.");
        return socket.emit("end-call", {
          recipientId: callFrom.id,
        });
      }

      updateRemoteUser({ ...callFrom });
      setIsRecivingCall(true);
      updateIsCallInitiator(false);
    });

    socket.on("call-ended", () => {
      console.log("call end recived");
      cleanUp();
    });

    return () => {
      socket.off("call-ended");
      socket.off("incoming-call");
    };
  }, [
    socket,
    currentUser,
    isConnected,
    callStarted,
    isCallInitiator,
    isRecivingCall,
  ]);

  const callUser = (localStream: MediaStream) => {
    console.log("calling user...");
    const newPeer = new Peer({
      initiator: true,
      trickle: false,
      stream: localStream,
    });

    setPeer(newPeer);

    newPeer.on("signal", (signalData) => {
      socket?.emit("call-user", {
        signalData,
        recipientId: remoteUser.id,
      });
      console.log("call-user emitted");
    });

    newPeer.on("stream", (remoteStream) => {
      console.log("stream recived");
      setRemoteUser((prev) => ({ ...prev, stream: remoteStream }));
    });

    socket?.on("call-accepted", (signalData) => {
      console.log("call-accepted");
      newPeer.signal(signalData);
      setCallStarted(true);
      setRemoteUser((prev) => ({ ...prev, signalData }));
    });
  };

  const answerCall = (localStream: MediaStream) => {
    console.log("answering call...");
    setCallStarted(true);

    const newPeer = new Peer({
      initiator: false,
      trickle: false,
      stream: localStream,
    });

    setPeer(newPeer);

    newPeer.on("signal", (signalData) => {
      console.log(signalData);

      socket?.emit(
        "answer-call",
        {
          signalData,
          recipientId: remoteUser.id,
        },
        () => {
          console.log("signal emited");
        },
      );
    });

    newPeer.on("stream", (remoteStream) => {
      console.log("stream recived");
      setRemoteUser((prev) => ({ ...prev, stream: remoteStream }));
    });

    newPeer.signal(remoteUser.signalData!);
  };

  const cleanUp = () => {
    peer?.destroy();
    setPeer(null);
    setCallStarted(false);
    setIsRecivingCall(false);
    setIsCallInitiator(false);
    setRemoteUser({ ...callContextInit.remoteUser });
    socket?.off("call-accepted");
  };

  const endCall = () => {
    socket?.emit("end-call", {
      recipientId: remoteUser.id,
    });
    cleanUp();
  };

  const updateIsCallInitiator = (newState: boolean) => {
    setIsCallInitiator(newState);
  };

  const updateRemoteUser = (newState: IRemoteUser) => {
    setRemoteUser({ ...newState });
  };

  const payload = {
    peer,
    remoteUser,
    callStarted,
    isRecivingCall,
    isCallInitiator,
    endCall,
    callUser,
    answerCall,
    updateRemoteUser,
    updateIsCallInitiator,
  };

  return (
    <CallContext.Provider value={payload}>{children}</CallContext.Provider>
  );
};

export default CallProvider;
