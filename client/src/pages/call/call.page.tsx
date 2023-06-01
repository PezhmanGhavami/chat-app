// TODO - Protect this route
import { ReactNode } from "react";
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
}: {
  children: ReactNode;
  className: string;
}) {
  return (
    <button
      className={`flex h-16 w-16 items-center justify-center rounded-full text-4xl hover:brightness-75 ${className}`}
    >
      {children}
    </button>
  );
}

function ButtonsContainer({ children }: { children: ReactNode }) {
  return (
    <div className="fixed bottom-24 flex w-full items-center justify-center space-x-20">
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

function InCall() {
  return (
    <>
      <video className="h-full w-full bg-slate-700" src=""></video>
      <div className="fixed bottom-16 right-16 z-10">
        <SelfCam />
      </div>
      <ButtonsContainer>
        <Button className="bg-gray-800">
          <BiMicrophoneOff />
        </Button>
        <Button className="bg-gray-800">
          <BiCameraOff />
        </Button>
        <Button className="bg-red-600">
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

function Calling() {
  return (
    <>
      <div className="h-full w-full">
        <SelfCam />
      </div>
      <CallText text="call status" />
      <ButtonsContainer>
        <Button className="bg-red-600">
          <BiPhoneOff />
        </Button>
      </ButtonsContainer>
    </>
  );
}

function Call() {
  return (
    <main className={"relative h-screen w-screen"}>
      <InCall />
      {/* <IncomingCall /> */}
      {/* <Calling /> */}
    </main>
  );
}

export default Call;
