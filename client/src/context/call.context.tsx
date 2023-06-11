import {
  useState,
  useEffect,
  useContext,
  createContext,
  ReactNode,
  MouseEvent,
} from "react";
import Peer from "simple-peer";
import { useNavigate } from "react-router-dom";

import useUser from "../hooks/useUser";

import { SocketIOContext } from "./socket.io.context";

function getStreamTracks(stream: MediaStream) {
  const videoTracks = stream.getVideoTracks();
  const audioTracks = stream.getAudioTracks();

  return { videoTrack: videoTracks[0], audioTrack: audioTracks[0] };
}

export interface IRemoteUser {
  id: string;
  displayName: string;
  stream: MediaStream | null;
  signalData: Peer.SignalData | null;
}

interface ICallContext {
  peer: Peer.Instance | null;
  remoteUser: IRemoteUser;
  localStream: MediaStream | null;
  localCameraEnabled: boolean;
  localMicrophoneEnabled: boolean;
  callStarted: boolean;
  isConnecting: boolean;
  isRecivingCall: boolean;
  isCallInitiator: boolean;
  endCall: () => void;
  callUser: (remoteUser: IRemoteUser) => void;
  answerCall: () => void;
  toggleCamera: (event: MouseEvent) => void;
  toggleMicrophone: (event: MouseEvent) => void;
}

const callContextInit: ICallContext = {
  peer: null,
  localStream: null,
  localCameraEnabled: true,
  localMicrophoneEnabled: true,
  callStarted: false,
  isConnecting: false,
  isRecivingCall: false,
  isCallInitiator: false,
  remoteUser: { displayName: "", id: "", stream: null, signalData: null },
  endCall: () => {},
  callUser: (recipientId) => {},
  answerCall: () => {},
  toggleCamera: (event) => {},
  toggleMicrophone: (event) => {},
};

export const CallContext = createContext<ICallContext>(callContextInit);

const CallProvider = ({ children }: { children: ReactNode }) => {
  const [peer, setPeer] = useState(callContextInit.peer);
  const [remoteUser, setRemoteUser] = useState({
    ...callContextInit.remoteUser,
  });
  const [isConnecting, setIsConnecting] = useState(
    callContextInit.isConnecting,
  );
  const [isRecivingCall, setIsRecivingCall] = useState(
    callContextInit.isRecivingCall,
  );
  const [callStarted, setCallStarted] = useState(callContextInit.callStarted);
  const [isCallInitiator, setIsCallInitiator] = useState(
    callContextInit.isCallInitiator,
  );
  const [localCameraEnabled, setLocalCameraEnabled] = useState(
    callContextInit.localCameraEnabled,
  );
  const [localMicrophoneEnabled, setLocalMicrophoneEnabled] = useState(
    callContextInit.localMicrophoneEnabled,
  );
  const [localStream, setLocalStream] = useState(callContextInit.localStream);

  const { user: currentUser } = useUser();
  const navigate = useNavigate();

  const { socket, isConnected } = useContext(SocketIOContext);

  useEffect(() => {
    if (!socket || !currentUser || !isConnected) return;

    socket.on(
      `incoming-call`,
      async ({ callFrom }: { callFrom: IRemoteUser }) => {
        console.log("Incoming Call ran");
        // FIXME - fix the auto reject
        // if (callStarted || isCallInitiator || isRecivingCall) {
        //   console.log(`
        //   callStarted: ${callStarted}
        //   isCallInitiator: ${isCallInitiator}
        //   isRecivingCall: ${isRecivingCall}
        //   `);
        //   console.log("auto reject is in some sort of call.");
        //   return socket.emit("end-call", {
        //     recipientId: callFrom.id,
        //   });
        // }

        setRemoteUser({ ...callFrom });
        setIsRecivingCall(true);
        setIsCallInitiator(false);

        const currentStream =
          await globalThis.navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true,
          });
        setLocalStream(currentStream);
      },
    );

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

  const callUser = async (newRemoteUser: IRemoteUser) => {
    console.log("calling user...");

    const currentStream = await globalThis.navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });
    setLocalStream(currentStream);

    setRemoteUser({ ...newRemoteUser });
    setIsCallInitiator(true);

    const newPeer = new Peer({
      initiator: true,
      trickle: false,
      stream: currentStream,
    });

    setPeer(newPeer);

    newPeer.on("signal", (signalData) => {
      socket?.emit("call-user", {
        signalData,
        recipientId: newRemoteUser.id,
      });
      console.log("call-user emitted");
    });

    newPeer.on("stream", (remoteStream) => {
      console.log("stream recived");
      setRemoteUser((prev) => ({ ...prev, stream: remoteStream }));
    });

    newPeer.on("connect", () => {
      console.log("connected.");
      setCallStarted(true);
    });

    newPeer.on("error", (error) => {
      console.error("ERROR: ", error);
    });

    socket?.on("call-accepted", (signalData) => {
      console.log("call-accepted");
      setRemoteUser((prev) => ({ ...prev, signalData }));
      newPeer.signal(signalData);
    });

    navigate("/call");
  };

  const answerCall = async () => {
    console.log("answering call...");
    setIsConnecting(true);

    const newPeer = new Peer({
      initiator: false,
      trickle: false,
      stream: localStream!,
    });

    setPeer(newPeer);

    newPeer.on("signal", (signalData) => {
      socket?.emit("answer-call", {
        signalData,
        recipientId: remoteUser.id,
      });

      console.log("answer call signal emited");
    });

    newPeer.on("stream", (remoteStream) => {
      console.log("stream recived");
      setRemoteUser((prev) => ({ ...prev, stream: remoteStream }));
    });

    newPeer.on("connect", () => {
      console.log("connected.");
      setCallStarted(true);
      setIsConnecting(false);
    });

    newPeer.on("error", (error) => {
      console.error("ERROR");
      console.log(error);
    });

    newPeer.signal(remoteUser.signalData!);
  };

  const cleanUp = () => {
    peer?.destroy();
    setPeer(null);
    setCallStarted(false);
    setIsConnecting(false);
    setIsRecivingCall(false);
    setIsCallInitiator(false);
    setRemoteUser({ ...callContextInit.remoteUser });
    socket?.off("call-accepted");
    if (localStream) {
      localStream.getTracks().forEach((track) => {
        track.stop();
      });
    }
  };

  const endCall = () => {
    socket?.emit("end-call", {
      recipientId: remoteUser.id,
    });
    cleanUp();
  };

  const toggleCamera = (event: MouseEvent) => {
    event.stopPropagation();

    return setLocalCameraEnabled((prev) => {
      const { videoTrack } = getStreamTracks(localStream!);

      videoTrack.enabled = !prev;

      return !prev;
    });
  };

  const toggleMicrophone = (event: MouseEvent) => {
    event.stopPropagation();
    return setLocalMicrophoneEnabled((prev) => {
      const { audioTrack } = getStreamTracks(localStream!);

      audioTrack.enabled = !prev;

      return !prev;
    });
  };

  const payload = {
    peer,
    remoteUser,
    localStream,
    localCameraEnabled,
    localMicrophoneEnabled,
    callStarted,
    isConnecting,
    isRecivingCall,
    isCallInitiator,
    endCall,
    callUser,
    answerCall,
    toggleCamera,
    toggleMicrophone,
  };

  return (
    <CallContext.Provider value={payload}>{children}</CallContext.Provider>
  );
};

export default CallProvider;
