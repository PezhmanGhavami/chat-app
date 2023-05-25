import { useContext } from "react";
import { Outlet } from "react-router-dom";
import { BsSunFill, BsMoonFill } from "react-icons/bs";

import LoadingSpinner from "../loading-spinner/loading-spinner.component";
import { formStyles } from "../../pages/signin/signin.page";

import useUser from "../../hooks/useUser";

import { ThemeContext } from "../../context/theme.context";

const AuthLayout = () => {
  const { user } = useUser();
  const { theme, changeTheme } = useContext(ThemeContext);

  if (!user || user.isLoggedIn) {
    return (
      <div className="mx-auto mt-96 text-3xl">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen flex-col justify-between">
      <div>
        <h1 className="pb-9 pt-28 text-center text-6xl tracking-tight">
          Chat App
        </h1>
        <main>
          <Outlet />
        </main>
      </div>
      <div className="m-2 self-end">
        <button
          type="button"
          title={`Click to switch to ${
            theme === "dark" ? "light" : "dark"
          } theme`}
          className={
            "flex items-center justify-center space-x-2 rounded-md p-2 text-xl hover:bg-neutral-200 dark:hover:bg-neutral-800 " +
            formStyles.colorAnimation
          }
          onClick={changeTheme}
        >
          {theme === "dark" ? (
            <>
              <BsSunFill />
              <span className="text-sm">Switch to light mode</span>
            </>
          ) : (
            <>
              <BsMoonFill />
              <span className="text-sm">Switch to dark mode</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default AuthLayout;
