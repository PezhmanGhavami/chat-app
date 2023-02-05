import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { ToastContainer } from "react-toastify";

import App from "./App";
import "./index.css";

import "react-toastify/dist/ReactToastify.min.css";

import ThemeProvider from "./context/theme.context";

ReactDOM.createRoot(
  document.getElementById("root")!,
).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <ToastContainer />
        <App />
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
