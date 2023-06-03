// TODO - Protect this route
import {
  useState,
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

function SelfCam() {
  return <video className="h-full w-full bg-pink-200" src=""></video>;
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
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`fixed bottom-12 z-20 flex w-full items-center justify-between px-8 transition-opacity md:justify-center md:space-x-20 lg:bottom-24${
        className ? " " + className : ""
      }`}
    >
      {children}
    </div>
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
  microphoneMuted: boolean;
  toggleMicrophone: (event: MouseEvent) => void;
  cameraDisabled: boolean;
  toggleCamera: (event: MouseEvent) => void;
}

function InCall({
  showControls,
  cameraDisabled,
  microphoneMuted,
  toggleCamera,
  toggleMicrophone,
}: IInCall) {
  return (
    <>
      <video className="h-full w-full bg-slate-700" src=""></video>
      <div
        className={`fixed z-10 transition-all duration-500 ${
          false
            ? "inset-0"
            : "bottom-8 right-8 w-80 lg:bottom-16 lg:right-16 lg:w-96"
        }`}
      >
        <SelfCam />
      </div>

      <ButtonsContainer
        className={`${
          showControls ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
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
        <Button
          title={
            microphoneMuted
              ? "Click to enable camera"
              : "Click to disable camera"
          }
          onClick={toggleCamera}
          className={cameraDisabled ? "bg-gray-950" : "bg-gray-800"}
        >
          <BiCameraOff />
        </Button>
        <Button title="Click to end call" className="bg-red-600">
          <BiPhoneOff />
        </Button>
      </ButtonsContainer>
    </>
  );
}

function IncomingCall() {
  return (
    <>
      <div className="h-full w-full">
        <SelfCam />
      </div>
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
  const [microphoneMuted, setMicrophoneMuted] = useState(false);
  const [cameraDisabled, setCameraDisabled] = useState(false);

  const toggleControls = () => {
    return setShowControls((prev) => !prev);
  };

  const toggleMicrophone = (event: MouseEvent) => {
    event.stopPropagation();
    return setMicrophoneMuted((prev) => !prev);
  };

  const toggleCamera = (event: MouseEvent) => {
    event.stopPropagation();
    return setCameraDisabled((prev) => !prev);
  };

  return (
    <main onClick={toggleControls} className={"relative h-screen w-screen"}>
      <InCall
        showControls={showControls}
        microphoneMuted={microphoneMuted}
        toggleMicrophone={toggleMicrophone}
        cameraDisabled={cameraDisabled}
        toggleCamera={toggleCamera}
      />
      {/* <IncomingCall /> */}
    </main>
  );
}

export default Call;
