import React from "react";
import ReactDOM from "react-dom/client";
import { ToastContainer } from "react-toastify";
import { BrowserRouter } from "react-router-dom";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import App from "./App";
import "./index.css";

import "react-toastify/dist/ReactToastify.min.css";

import ThemeProvider from "./context/theme.context";
import SocketIOProvider from "./context/socket.io.context";
import CallProvider from "./context/call.context";

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <ReactQueryDevtools />
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
    </QueryClientProvider>
  </React.StrictMode>,
);
