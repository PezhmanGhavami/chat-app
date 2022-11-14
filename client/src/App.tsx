import { Routes, Route } from "react-router-dom";

import Layout from "./components/layout/layout.component";
import AuthLayout from "./components/auth-layout/auth-layout.component";
import ProtectedRoute from "./components/protected-route/protected-route";

import Index from "./pages/index/index.page";
import Chat from "./pages/chat/chat.page";
import Signin from "./pages/signin/signin.page";
import Signup from "./pages/signup/signup.page";
import NotFound from "./pages/not-found/not-found.page";

function App() {
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
