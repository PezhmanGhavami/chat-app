import { Navigate, useLocation } from "react-router-dom";

import useUser from "../../hooks/useUser";

function ProtectedRoute({ children }: { children: JSX.Element }) {
  const { user } = useUser();
  const location = useLocation();

  if (user?.isLoggedIn) {
    return children;
  }

  return <Navigate state={{ from: location }} to="/auth/signin" replace />;
}

export default ProtectedRoute;
