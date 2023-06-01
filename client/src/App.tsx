import { useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import { toast } from "react-toastify";

import Layout from "./components/layout/layout.component";
import AuthLayout from "./components/auth-layout/auth-layout.component";
import ProtectedRoute from "./components/protected-route/protected-route";

import Index from "./pages/index/index.page";
import Chat from "./pages/chat/chat.page";
import Call from "./pages/call/call.page";
import Signin from "./pages/signin/signin.page";
import Signup from "./pages/signup/signup.page";
import NotFound from "./pages/not-found/not-found.page";

const CustomToast = () => {
  return (
    <div>
      <p>
        This is a prototype project made for educational purposes. You can find
        the source code here:
      </p>
      <a
        className="text-blue-600 hover:underline dark:text-blue-300"
        href="https://github.com/PezhmanGhavami/chat-app"
        target="_blank"
        rel="noreferrer"
      >
        https://github.com/PezhmanGhavami/chat-app
      </a>
    </div>
  );
};

function App() {
  useEffect(() => {
    toast.info(CustomToast, {
      autoClose: false,
    });
  }, []);
  return (
    <Routes>
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Index />} />
        <Route path="chat/:chatId" element={<Chat />} />
        <Route path="call/:chatId" element={<Chat />} />
      </Route>

      <Route path="/auth" element={<AuthLayout />}>
        <Route path="signin" element={<Signin />} />
        <Route path="signup" element={<Signup />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;
