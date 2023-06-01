import { Outlet, useParams } from "react-router-dom";

import Navigation from "../navigation/navigation.component";
import WebSocketProvider from "../../context/socket.io.context";

const Layout = () => {
  const params = useParams();

  return (
    <WebSocketProvider>
      <div className="flex h-screen w-screen">
        <div className="z-10 flex h-full w-full flex-col dark:bg-neutral-800 sm:w-64 sm:border-r sm:border-r-neutral-300 sm:shadow sm:dark:border-r-neutral-500 md:w-72 lg:w-80 xl:w-96">
          <Navigation />
        </div>
        <main
          className={`sm-w-full fixed inset-0 sm:static sm:flex-1 sm:translate-x-0 ${
            params.chatId ? "z-50 translate-x-0 sm:z-0" : "translate-x-full"
          }`}
        >
          <Outlet key={params.chatId ? params.chatId : "no-chat"} />
        </main>
      </div>
    </WebSocketProvider>
  );
};

export default Layout;
