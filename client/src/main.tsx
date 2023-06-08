import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { ToastContainer } from "react-toastify";

import App from "./App";
import "./index.css";

import "react-toastify/dist/ReactToastify.min.css";

import ThemeProvider from "./context/theme.context";
import SocketIOProvider from "./context/socket.io.context";
import CallProvider from "./context/call.context";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <SocketIOProvider>
          <CallProvider>
            <ToastContainer />
            <App />
          </CallProvider>
        </SocketIOProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
