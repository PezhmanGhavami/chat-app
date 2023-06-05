// TODO - Protect this route
import {
  useState,
  useEffect,
  useRef,
  MouseEvent,
  ButtonHTMLAttributes,
  HTMLAttributes,
} from "react";
import {
  BiCameraOff,
  BiMicrophoneOff,
  BiPhone,
  BiPhoneOff,
} from "react-icons/bi";

function SelfCam({
  cameraEnabled,
  microphoneMuted,
}: {
  cameraEnabled: boolean;
  microphoneMuted: boolean;
}) {
  const [stream, setStream] = useState<MediaStream>();

  const videoRef = useRef<null | HTMLVideoElement>(null);

  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ video: cameraEnabled, audio: true })
      .then((currentStream) => {
        setStream(currentStream);
      });
  }, [cameraEnabled]);

  useEffect(() => {
    if (!stream || !videoRef.current) return;

    videoRef.current.srcObject = stream;
  }, [stream]);

  return (
    <video
      autoPlay
      muted={microphoneMuted}
      ref={videoRef}
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

function CallText({ text }: { text: string }) {
  return (
    <div className="fixed inset-x-0 top-24 w-full bg-green-700 text-center">
      {text}
    </div>
  );
}

interface IInCall {
  showControls: boolean;
  calling: boolean;
  microphoneMuted: boolean;
  toggleMicrophone: (event: MouseEvent) => void;
  cameraEnabled: boolean;
  toggleCamera: (event: MouseEvent) => void;
}

function InCall({
  showControls,
  calling,
  cameraEnabled,
  microphoneMuted,
  toggleCamera,
  toggleMicrophone,
}: IInCall) {
  return (
    <>
      <video
        className="h-full w-full -scale-x-100 bg-slate-900 object-cover object-center"
        src=""
      ></video>
      <div
        className={`fixed z-10 transition-all duration-500 ${
          calling
            ? "inset-0"
            : "bottom-8 right-8 h-52 w-32 md:aspect-video md:h-auto md:w-72 lg:bottom-16 lg:right-16 lg:w-96"
        }`}
      >
        <SelfCam
          cameraEnabled={cameraEnabled}
          microphoneMuted={microphoneMuted}
        />
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
          <Button title="Click to end call" className="bg-red-600">
            <BiPhoneOff />
          </Button>
        </li>
      </ButtonsContainer>
    </>
  );
}

function IncomingCall() {
  return (
    <>
      <div className="h-full w-full">{/* <SelfCam /> */}</div>
      <CallText text="caller name" />
      <ButtonsContainer>
        <Button className="bg-green-700">
          <BiPhone />
        </Button>
        <Button className="bg-red-600">
          <BiPhoneOff />
        </Button>
      </ButtonsContainer>
    </>
  );
}

function Call() {
  const [showControls, setShowControls] = useState(true);
  const [calling, setCalling] = useState(false);
  const [microphoneMuted, setMicrophoneMuted] = useState(true);
  const [cameraEnabled, setCameraCameraEnabled] = useState(true);

  const toggleControls = () => {
    return setShowControls((prev) => !prev);
  };

  const toggleMicrophone = (event: MouseEvent) => {
    event.stopPropagation();
    return setMicrophoneMuted((prev) => !prev);
  };

  const toggleCamera = (event: MouseEvent) => {
    event.stopPropagation();
    return setCameraCameraEnabled((prev) => !prev);
  };

  return (
    <main onClick={toggleControls} className={"relative h-screen w-screen"}>
      <InCall
        showControls={showControls}
        microphoneMuted={microphoneMuted}
        toggleMicrophone={toggleMicrophone}
        cameraEnabled={cameraEnabled}
        toggleCamera={toggleCamera}
        calling={calling}
      />
      {/* <IncomingCall /> */}
    </main>
  );
}

export default Call;
