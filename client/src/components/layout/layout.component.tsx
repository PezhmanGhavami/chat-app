import { Outlet } from "react-router-dom";

import Navigation from "../navigation/navigation.component";
import WebSocketProvider from "../../context/websocket.context";

const Layout = () => {
  return (
    <WebSocketProvider>
      <div className="w-screen h-screen flex">
        <div className="flex flex-col bg-neutral-800 w-full h-full sm:w-64 md:w-72 lg:w-80 xl:w-96 z-10">
          <Navigation />
        </div>
        <main className="fixed inset-0 translate-x-full sm:static sm:translate-x-0 sm:flex-1 sm-w-full">
          <Outlet />
        </main>
      </div>
    </WebSocketProvider>
  );
};

export default Layout;
