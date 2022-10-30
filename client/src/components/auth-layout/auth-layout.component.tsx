import { Outlet } from "react-router-dom";

import LoadingSpinner from "../loading-spinner/loading-spinner.component";

import useUser from "../../hooks/useUser";

const AuthLayout = () => {
  const { user } = useUser();

  if (!user || user.isLoggedIn) {
    return (
      <div className="mx-auto mt-96 text-3xl">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-center tracking-tight pt-28 text-6xl pb-9">
        Chat App
      </h1>
      <main>
        <Outlet />
      </main>
    </div>
  );
};

export default AuthLayout;
