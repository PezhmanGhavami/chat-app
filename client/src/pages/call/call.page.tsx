// TODO - Protect this route
import { ReactNode } from "react";

function SelfCam() {
  return <video className="h-full w-full bg-pink-200" src=""></video>;
}

function ButtonsContainer({ children }: { children: ReactNode }) {
  return (
    <div className="fixed bottom-24 flex w-full items-center justify-center space-x-4 bg-yellow-700">
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
        <span>mic</span>
        <span>cam</span>
        <span className="bg-red-600">end</span>
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
        <span className="bg-green-700">accept</span>
        <span className="bg-red-600">reject</span>
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
        <span>stop call</span>
      </ButtonsContainer>
    </>
  );
}

function Call() {
  return (
    <main className={"relative h-screen w-screen"}>
      {/* <InCall /> */}
      <IncomingCall />
      {/* <Calling /> */}
    </main>
  );
}

export default Call;
