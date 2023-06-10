// TODO - Protect this route
import {
  useState,
  useEffect,
  useRef,
  useContext,
  MouseEvent,
  ButtonHTMLAttributes,
  HTMLAttributes,
} from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import {
  BiCameraOff,
  BiMicrophoneOff,
  BiPhone,
  BiPhoneOff,
} from "react-icons/bi";

import { CallContext } from "../../context/call.context";

function SelfCam({
  localStream,
  microphoneMuted,
}: {
  localStream: MediaStream | undefined;
  microphoneMuted: boolean;
}) {
  const localVideoRef = useRef<null | HTMLVideoElement>(null);

  useEffect(() => {
    if (!localStream || !localVideoRef.current) return;

    localVideoRef.current.srcObject = localStream;
  }, [localStream]);

  return (
    <video
      autoPlay
      muted={microphoneMuted}
      ref={localVideoRef}
      className="h-full w-full -scale-x-100 border border-gray-200 bg-slate-800 object-cover object-center dark:border-neutral-700"
    />
  );
}

function Button({
  children,
  className,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...rest}
      className={`flex h-16 w-16 items-center justify-center rounded-full text-4xl hover:brightness-75${
        className ? " " + className : ""
      }`}
    >
      {children}
    </button>
  );
}

function ButtonsContainer({
  children,
  className,
}: HTMLAttributes<HTMLUListElement>) {
  return (
    <ul
      className={`fixed bottom-12 z-20 flex h-24 w-full items-center justify-between px-8 transition-opacity md:justify-center md:space-x-20 lg:bottom-24${
        className ? " " + className : ""
      }`}
    >
      {children}
    </ul>
  );
}

interface ICallStarted {
  cameraEnabled: boolean;
  microphoneMuted: boolean;
  localStream: MediaStream;
  toggleCamera: (event: MouseEvent) => void;
  toggleMicrophone: (event: MouseEvent) => void;
}
function CallStarted({
  cameraEnabled,
  microphoneMuted,
  localStream,
  toggleCamera,
  toggleMicrophone,
}: ICallStarted) {
  const [showControls, setShowControls] = useState(true);

  const { remoteUser, callStarted, isCallInitiator, endCall, callUser } =
    useContext(CallContext);

  const remoteVideoRef = useRef<null | HTMLVideoElement>(null);

  useEffect(() => {
    if (!callStarted && isCallInitiator) {
      callUser(localStream);
    }
  }, []);

  useEffect(() => {
    if (!remoteUser.stream || !remoteVideoRef.current) return;

    remoteVideoRef.current.srcObject = remoteUser.stream;
  }, [remoteUser.stream]);

  console.log(callStarted);

  const toggleControls = () => {
    return setShowControls((prev) => !prev);
  };

  return (
    <main onClick={toggleControls} className="relative h-screen w-screen">
      <video
        className="h-full w-full -scale-x-100 bg-slate-900 object-cover object-center"
        autoPlay
        // muted={remoteMicrophoneMuted}
        ref={remoteVideoRef}
      />

      <div className="fixed inset-x-0 top-24 z-20 w-full text-center">
        Calling {remoteUser.displayName}...
      </div>

      <div
        className={`fixed z-10 transition-all duration-500 ${
          callStarted
            ? "bottom-8 right-8 h-52 w-32 md:aspect-video md:h-auto md:w-72 lg:bottom-16 lg:right-16 lg:w-96"
            : "inset-0"
        }`}
      >
        <SelfCam localStream={localStream} microphoneMuted={microphoneMuted} />
      </div>

      <ButtonsContainer
        className={`${
          showControls ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        <li className="relative">
          <Button
            title={
              microphoneMuted
                ? "Click to unmute microphone"
                : "Click to mute microphone"
            }
            onClick={toggleMicrophone}
            className={microphoneMuted ? "bg-gray-950" : "bg-gray-800"}
          >
            <BiMicrophoneOff />
          </Button>
          {microphoneMuted && (
            <span className="absolute w-full select-none text-center text-xs">
              Muted
            </span>
          )}
        </li>
        <li className="relative">
          <Button
            title={
              cameraEnabled
                ? "Click to disable camera"
                : "Click to enable camera"
            }
            onClick={toggleCamera}
            className={cameraEnabled ? "bg-gray-800" : "bg-gray-950"}
          >
            <BiCameraOff />
          </Button>
          {!cameraEnabled && (
            <span className="absolute w-full select-none text-center text-xs">
              Disabled
            </span>
          )}
        </li>
        <li>
          <Button
            onClick={endCall}
            title="Click to end call"
            className="bg-red-600"
          >
            <BiPhoneOff />
          </Button>
        </li>
      </ButtonsContainer>
    </main>
  );
}

interface IIncomingCall {
  localStream: MediaStream;
}
function IncomingCall({ localStream }: IIncomingCall) {
  const { callStarted, remoteUser, endCall, answerCall } =
    useContext(CallContext);

  const navigate = useNavigate();

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (!callStarted) {
        console.log("timeout");
        endCall();
      }
    }, 60 * 1000);

    return () => {
      clearTimeout(timeout);
    };
  }, [callStarted]);

  const callAnswerHandler = () => {
    answerCall(localStream);
  };

  return (
    <main className="relative h-screen w-screen">
      <div className="h-full w-full">
        {<SelfCam localStream={localStream} microphoneMuted={false} />}
      </div>
      <div className="fixed inset-x-0 top-24 z-20 w-full text-center">
        Call from {remoteUser.displayName}
      </div>
      <ButtonsContainer>
        <Button onClick={callAnswerHandler} className="bg-green-700">
          <BiPhone />
        </Button>
        <Button onClick={endCall} className="bg-red-600">
          <BiPhoneOff />
        </Button>
      </ButtonsContainer>
    </main>
  );
}

function Call() {
  const [microphoneMuted, setMicrophoneMuted] = useState(true);
  const [cameraEnabled, setCameraCameraEnabled] = useState(true);
  const [localStream, setLocalStream] = useState<MediaStream>();

  const { isCallInitiator, isRecivingCall, callStarted } =
    useContext(CallContext);

  const navigate = useNavigate();

  useEffect(() => {
    globalThis.navigator.mediaDevices
      .getUserMedia({ video: cameraEnabled, audio: true })
      .then((currentStream) => {
        setLocalStream(currentStream);
      });
  }, [cameraEnabled]);

  useEffect(() => {
    return () => {
      if (localStream) {
        localStream.getTracks().forEach((track) => {
          track.stop();
        });
      }
    };
  }, [localStream]);

  useEffect(() => {}, []);

  useEffect(() => {
    if (!isCallInitiator && !isRecivingCall && !callStarted) {
      console.log("All are false so it will go back");
      navigate(-1);
    }
  }, [isCallInitiator, isRecivingCall, callStarted]);

  const toggleMicrophone = (event: MouseEvent) => {
    event.stopPropagation();
    return setMicrophoneMuted((prev) => !prev);
  };

  const toggleCamera = (event: MouseEvent) => {
    event.stopPropagation();
    return setCameraCameraEnabled((prev) => !prev);
  };

  if (!localStream) {
    return <div>Loading camera...</div>;
  }

  return (
    <Routes>
      <Route
        path="/call-started"
        element={
          <CallStarted
            localStream={localStream}
            microphoneMuted={microphoneMuted}
            toggleMicrophone={toggleMicrophone}
            cameraEnabled={cameraEnabled}
            toggleCamera={toggleCamera}
          />
        }
      />
      <Route
        path="/incoming-call"
        element={<IncomingCall localStream={localStream} />}
      />
      <Route path="*" element={<Navigate to="/not-found" replace />} />
    </Routes>
  );
}

export default Call;
