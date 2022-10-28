import { Outlet } from "react-router-dom";

import Navigation from "../navigation/navigation.component";

const Layout = () => {
  return (
    <div>
      <div>
        a hamburger and some menu items
        {/* A hidden navbar to change theme and logout */}
      </div>
      <div>
        <Navigation />
      </div>
      <main>
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
