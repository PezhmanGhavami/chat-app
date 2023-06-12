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

import { SocketIOContext } from "./socket.io.context";

function getStreamTracks(stream: MediaStream) {
  const videoTracks = stream.getVideoTracks();
  const audioTracks = stream.getAudioTracks();

  return { videoTrack: videoTracks[0], audioTrack: audioTracks[0] };
}

const constraints: MediaStreamConstraints = {
  video: true,
  audio: true,
};

export interface IRemoteUser {
  id: string;
  displayName: string;
  stream: MediaStream | null;
}

interface ICallContext {
  peer: Peer.Instance | null;
  remoteUser: IRemoteUser;
  localStream: MediaStream | null;
  localCameraEnabled: boolean;
  localMicrophoneEnabled: boolean;
  callStarted: boolean;
  callIsConnecting: boolean;
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
  callIsConnecting: false,
  isRecivingCall: false,
  isCallInitiator: false,
  remoteUser: { displayName: "", id: "", stream: null },
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
  const [callIsConnecting, setCallIsConnecting] = useState(
    callContextInit.callIsConnecting,
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
  const [iceServers, setIceServers] = useState<RTCIceServer[]>();
  const [localSignals, setLocalSignals] = useState<Peer.SignalData[]>([]);

  const navigate = useNavigate();

  const { socket, isConnected } = useContext(SocketIOContext);

  // Getting the ICE servers
  useEffect(() => {
    if (!socket || !isConnected || iceServers) return;
    socket.emit("get-ice-servers");

    socket.on("ice-servers", ({ iceServers }) => {
      setIceServers(iceServers);
    });

    return () => {
      socket.off("ice-servers");
    };
  }, [socket, isConnected, iceServers]);

  // Incoming call and end call listeners
  useEffect(() => {
    if (!socket || !isConnected) return;

    socket.on(`incoming-call`, async ({ id, displayName }) => {
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

      setRemoteUser((prev) => ({ ...prev, id, displayName }));
      setIsRecivingCall(true);
      setIsCallInitiator(false);

      const currentStream =
        await globalThis.navigator.mediaDevices.getUserMedia(constraints);
      setLocalStream(currentStream);
    });

    socket.on("call-ended", () => {
      console.log("call end recived");
      cleanUp();
    });

    return () => {
      socket.off("call-ended");
      socket.off("incoming-call");
    };
  }, [socket, isConnected, callStarted, isCallInitiator, isRecivingCall]);

  // Signal emitter
  useEffect(() => {
    if (!callIsConnecting || !socket || !isConnected) return;

    socket.emit("send-signals", {
      signals: localSignals,
      recipientId: remoteUser.id,
    });
    console.log("signals emitted to send-signals.");
  }, [localSignals, socket, isConnected, callIsConnecting]);

  // Starting a call to a user
  const callUser = async (newRemoteUser: IRemoteUser) => {
    console.log("calling user...");

    // Setting up the local stream
    const newLocalStream = await globalThis.navigator.mediaDevices.getUserMedia(
      constraints,
    );
    setLocalStream(newLocalStream);

    // Setting the initial data of the remote user
    setRemoteUser({ ...newRemoteUser });
    setIsCallInitiator(true);

    // Starting the call
    socket?.emit("call-user", {
      recipientId: newRemoteUser.id,
    });
    console.log("call-user emitted");

    // Setting up the peer
    const newPeer = new Peer({
      initiator: true,
      trickle: true,
      stream: newLocalStream,
      config: { iceServers },
    });
    setPeer(newPeer);

    // Getting the local signals
    newPeer.on("signal", (signalData) => {
      setLocalSignals((prev) => [...prev, signalData]);

      console.log("new signal added to localSignals");
    });

    // Listening for the remote stream and setting it up
    newPeer.on("stream", (remoteStream) => {
      console.log("stream recived");
      setRemoteUser((prev) => ({ ...prev, stream: remoteStream }));
    });

    // Confirming the peers connection
    newPeer.on("connect", () => {
      console.log("connected.");
      setCallStarted(true);
      setCallIsConnecting(false);
    });

    // Error handling for the peer
    newPeer.on("error", (error) => {
      console.log("error in callUser peer.");
      console.log("Error name: ", error.name);
      console.log("Cause: ", error.cause);
      console.log("Message: ", error.message);
    });

    // Updating call state on call acceptance and emitting the local signals
    socket?.on("call-accepted", () => {
      console.log("call-accepted");
      setCallIsConnecting(true);
    });

    // Listening for remote signals and setting them up
    socket?.on(
      "incoming-signals",
      ({ signals }: { signals: Peer.SignalData[] }) => {
        console.log("new incoming signals");

        for (const signal of signals) {
          newPeer.signal(signal);
          console.log("peer.signal(signal) called.");
        }
      },
    );

    navigate("/call");
  };

  // Answering an incoming call
  const answerCall = async () => {
    console.log("answering call...");

    // Emitting the call acceptance
    socket?.emit("answer-call", {
      recipientId: remoteUser.id,
    });
    console.log("answer-call emitted");

    // Setting up the peer
    const newPeer = new Peer({
      initiator: false,
      trickle: true,
      stream: localStream!,
      config: { iceServers },
    });
    setPeer(newPeer);

    // Getting the local signals
    newPeer.on("signal", (signalData) => {
      setLocalSignals((prev) => [...prev, signalData]);

      console.log("new signal added to localSignals");
    });

    // Listening for the remote stream and setting it up
    newPeer.on("stream", (remoteStream) => {
      console.log("stream recived");
      setRemoteUser((prev) => ({ ...prev, stream: remoteStream }));
    });

    // Confirming the peers connection
    newPeer.on("connect", () => {
      console.log("connected.");
      setCallStarted(true);
      setCallIsConnecting(false);
    });

    // Error handling for the peer
    newPeer.on("error", (error) => {
      console.log("error in answerCall peer.");
      console.log("Error name: ", error.name);
      console.log("Cause: ", error.cause);
      console.log("Message: ", error.message);
    });

    // Listening for remote signals and setting them up
    socket?.on(
      "incoming-signals",
      ({ signals }: { signals: Peer.SignalData[] }) => {
        console.log("new incoming signals");

        for (const signal of signals) {
          newPeer.signal(signal);
          console.log("peer.signal(signal) called.");
        }

        // FIXME - this is not ideal, find a better workaround
        setTimeout(() => {
          setCallIsConnecting(true);
        }, 1000);
      },
    );
  };

  const cleanUp = () => {
    peer?.destroy();
    setPeer(null);
    setLocalSignals([]);
    setCallStarted(false);
    setCallIsConnecting(false);
    setIsRecivingCall(false);
    setIsCallInitiator(false);
    setRemoteUser({ ...callContextInit.remoteUser });
    socket?.off("call-accepted");
    socket?.off("incoming-signal");
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
    callIsConnecting,
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
