import { Outlet } from "react-router-dom";

const Layout = () => {
  return (
    <div className="min-h-screen bg-slate-900  text-slate-100">
      <main>
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
