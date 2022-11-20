import { useContext } from "react";
import { Outlet } from "react-router-dom";
import { BsSunFill, BsMoonFill } from "react-icons/bs";

import LoadingSpinner from "../loading-spinner/loading-spinner.component";
import { authFormStyles } from "../../pages/signin/signin.page";

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
    <div className="flex flex-col justify-between w-screen h-screen">
      <div>
        <h1 className="text-center tracking-tight pt-28 text-6xl pb-9">
          Chat App
        </h1>
        <main>
          <Outlet />
        </main>
      </div>
      <div className="self-end m-2">
        <button
          type="button"
          title={`Click to switch to ${
            theme === "dark" ? "light" : "dark"
          } theme`}
          className={
            "flex justify-center items-center space-x-2 text-xl p-2 rounded-md hover:bg-neutral-200 dark:hover:bg-neutral-800 " +
            authFormStyles.colorAnimation
          }
          onClick={changeTheme}
        >
          {theme === "dark" ? (
            <>
              <BsSunFill />
              <span className="text-sm">
                Switch to light mode
              </span>
            </>
          ) : (
            <>
              <BsMoonFill />
              <span className="text-sm">
                Switch to dark mode
              </span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default AuthLayout;
