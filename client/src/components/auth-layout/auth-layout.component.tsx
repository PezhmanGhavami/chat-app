import { Outlet } from "react-router-dom";

const AuthLayout = () => {
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
