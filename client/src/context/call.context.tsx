import {
  useState,
  useEffect,
  useContext,
  createContext,
  ReactNode,
  MouseEvent,
} from "react";
import Peer from "simple-peer";
import { toast } from "react-toastify";
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

interface ISignalTracker {
  status: "sent" | "pending";
  signal: Peer.SignalData;
}

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
  const [signalTracker, setSignalTracker] = useState<ISignalTracker[]>([]);

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
      toast.info("call end recived.");
      cleanUp();
    });

    return () => {
      socket.off("call-ended");
      socket.off("incoming-call");
    };
  }, [socket, isConnected, callStarted, isCallInitiator, isRecivingCall]);

  // Signal emitter
  useEffect(() => {
    if ((!callIsConnecting && !callStarted) || !socket || !isConnected) return;

    for (let index = 0; index < signalTracker.length; index++) {
      if (signalTracker[index].status === "pending") {
        socket.emit("send-signal", {
          signal: signalTracker[index].signal,
          recipientId: remoteUser.id,
        });

        const newSignalTracker = [...signalTracker];
        newSignalTracker[index].status = "sent";

        setSignalTracker([...newSignalTracker]);
      }
    }
    console.log("signals emited");
  }, [
    socket,
    isConnected,
    callStarted,
    signalTracker,
    remoteUser.id,
    callIsConnecting,
  ]);

  // Starting a call to a user
  const callUser = async (newRemoteUser: IRemoteUser) => {
    if (!socket) {
      cleanUp();
      return console.log("Connection interrupted, please try again.");
    }

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
    socket.emit("call-user", {
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
      setSignalTracker((prev) => [
        ...prev,
        { status: "pending", signal: signalData },
      ]);

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
      console.log(error);
      toast.error("Connection failed.");
      toast.info(
        "This project uses a free TURN server, and this error might have been caused because my TURN server is temporarily unavailable.",
      );
      toast.info(
        "If you want to see how the video call works, try again using two devices that are connected to the same network (e.g., the same wifi).",
      );
      endCall();
    });

    // Updating call state on call acceptance and emitting the local signals
    socket.on("call-accepted", () => {
      console.log("call-accepted");

      setTimeout(() => {
        setCallIsConnecting(true);
      }, 1000);
    });

    // Listening for remote signals and setting them up
    socket.on("incoming-signal", ({ signal }) => {
      console.log("new incoming signal");
      newPeer.signal(signal);
      console.log("peer.signal(signal) called.");
    });

    navigate("/call");
  };

  // Answering an incoming call
  const answerCall = async () => {
    if (!socket) {
      endCall();
      return console.log("Connection interrupted, please try again.");
    }

    console.log("answering call...");
    setCallIsConnecting(true);

    // Emitting the call acceptance
    socket.emit("answer-call", {
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
      setSignalTracker((prev) => [
        ...prev,
        { status: "pending", signal: signalData },
      ]);

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
      console.log(error);
      toast.error("Connection failed.");
      toast.info(
        "This project uses a free TURN server, and this error might have been caused because my TURN server is temporarily unavailable.",
      );
      toast.info(
        "If you want to see how the video call works, try again using two devices that are connected to the same network (e.g., the same wifi).",
      );
    });

    // Listening for remote signals and setting them up
    socket.on("incoming-signal", ({ signal }) => {
      console.log("new incoming signal");
      newPeer.signal(signal);
      console.log("peer.signal(signal) called.");
    });
  };

  const cleanUp = () => {
    peer?.destroy();
    setPeer(null);
    setSignalTracker([]);
    setCallStarted(false);
    setIsRecivingCall(false);
    setIsCallInitiator(false);
    setCallIsConnecting(false);
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
