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
import { useNavigate } from "react-router-dom";
import {
  BiCameraOff,
  BiMicrophoneOff,
  BiPhone,
  BiPhoneOff,
} from "react-icons/bi";

import { CallContext } from "../../context/call.context";

function SelfCam({ localStream }: { localStream: MediaStream | null }) {
  const localVideoRef = useRef<null | HTMLVideoElement>(null);

  useEffect(() => {
    if (!localStream || !localVideoRef.current) return;

    localVideoRef.current.srcObject = localStream;
  }, [localStream]);

  return (
    <video
      autoPlay
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
  microphoneEnabled: boolean;
  toggleCamera: (event: MouseEvent) => void;
  toggleMicrophone: (event: MouseEvent) => void;
}
function CallStarted({
  cameraEnabled,
  microphoneEnabled,
  toggleCamera,
  toggleMicrophone,
}: ICallStarted) {
  const [showControls, setShowControls] = useState(true);

  const { localStream, remoteUser, callStarted, endCall } =
    useContext(CallContext);

  const remoteVideoRef = useRef<null | HTMLVideoElement>(null);

  useEffect(() => {
    if (!remoteUser.stream || !remoteVideoRef.current) return;

    remoteVideoRef.current.srcObject = remoteUser.stream;
  }, [remoteUser.stream]);

  const toggleControls = () => {
    return setShowControls((prev) => !prev);
  };

  return (
    <main onClick={toggleControls} className="relative h-screen w-screen">
      <video
        className="h-full w-full -scale-x-100 bg-slate-900 object-cover object-center"
        autoPlay
        ref={remoteVideoRef}
      />

      <div
        className={`fixed ${
          callStarted
            ? "left-6 top-6 rounded-md bg-black/50 px-2 text-green-300"
            : "inset-x-0 top-24"
        } z-20 text-center`}
      >
        {callStarted ? (
          <p>{remoteUser.displayName}</p>
        ) : (
          <p>Calling {remoteUser.displayName}...</p>
        )}
      </div>

      <div
        className={`fixed z-10 transition-all duration-500 ${
          callStarted
            ? "bottom-8 right-8 h-52 w-32 md:aspect-video md:h-auto md:w-72 lg:bottom-16 lg:right-16 lg:w-96"
            : "inset-0"
        }`}
      >
        <SelfCam localStream={localStream} />
      </div>

      <ButtonsContainer
        className={`${
          showControls ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        <li className="relative">
          <Button
            title={
              microphoneEnabled
                ? "Click to mute microphone"
                : "Click to unmute microphone"
            }
            onClick={toggleMicrophone}
            className={microphoneEnabled ? "bg-gray-800" : "bg-gray-950"}
          >
            <BiMicrophoneOff />
          </Button>
          {!microphoneEnabled && (
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

function IncomingCall() {
  const { localStream, callStarted, remoteUser, endCall, answerCall } =
    useContext(CallContext);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (!callStarted) {
        endCall();
      }
    }, 60 * 1000);

    return () => {
      clearTimeout(timeout);
    };
  }, [callStarted]);

  const callAnswerHandler = () => {
    answerCall();
  };

  return (
    <main className="relative h-screen w-screen">
      <div className="h-full w-full">
        {<SelfCam localStream={localStream} />}
      </div>
      <div className="fixed inset-x-0 top-24 z-20 text-center">
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
  const [microphoneEnabled, setMicrophoneEnabled] = useState(true);
  const [cameraEnabled, setCameraCameraEnabled] = useState(true);

  const { isCallInitiator, isRecivingCall, callStarted } =
    useContext(CallContext);

  const navigate = useNavigate();

  useEffect(() => {
    if (!isCallInitiator && !isRecivingCall && !callStarted) {
      navigate(-1);
    }
  }, [isCallInitiator, isRecivingCall, callStarted]);

  const toggleMicrophone = (event: MouseEvent) => {
    event.stopPropagation();
    return setMicrophoneEnabled((prev) => !prev);
  };

  const toggleCamera = (event: MouseEvent) => {
    event.stopPropagation();
    return setCameraCameraEnabled((prev) => !prev);
  };

  if (isRecivingCall && !callStarted) {
    return <IncomingCall />;
  }

  return (
    <CallStarted
      microphoneEnabled={microphoneEnabled}
      toggleMicrophone={toggleMicrophone}
      cameraEnabled={cameraEnabled}
      toggleCamera={toggleCamera}
    />
  );
}

export default Call;
