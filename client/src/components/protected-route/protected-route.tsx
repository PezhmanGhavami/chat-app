import { Navigate, useLocation } from "react-router-dom";

import useUser from "../../hooks/useUser";

import LoadingSpinner from "../loading-spinner/loading-spinner.component";

function ProtectedRoute({ children }: { children: JSX.Element }) {
  const { user } = useUser();
  const location = useLocation();

  if (!user) {
    return (
      <div className="h-screen text-4xl">
        <LoadingSpinner />
      </div>
    );
  }

  if (user.isLoggedIn) {
    return children;
  }

  return <Navigate state={{ from: location }} to="/auth/signin" replace />;
}

export default ProtectedRoute;
