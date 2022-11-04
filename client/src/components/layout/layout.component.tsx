import { Outlet } from "react-router-dom";

import Navigation from "../navigation/navigation.component";

import SocketProvider from "../../context/socket.context";

const Layout = () => {
  return (
    <SocketProvider>
      <div className="w-screen h-screen flex">
        <div className="bg-neutral-800 w-full h-full sm:w-64 md:w-72 lg:w-80 xl:w-96 z-10">
          <Navigation />
        </div>
        <main className="fixed inset-0 translate-x-full sm:static sm:translate-x-0 sm:flex-1 sm-w-full">
          <Outlet />
        </main>
      </div>
    </SocketProvider>
  );
};

export default Layout;
