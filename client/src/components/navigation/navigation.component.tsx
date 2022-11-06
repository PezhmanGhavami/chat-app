import { ChangeEvent, useState, useContext } from "react";
import {
  VscSearch,
  VscClose,
  VscMenu,
  VscSignOut,
} from "react-icons/vsc";

import useUser from "../../hooks/useUser";

import { WebSocketContext } from "../../context/websocket.context";

import ChatCardsContainer from "../chat-cards-container/chat-cards-container.component";
import Overlay from "../overlay/overlay.component";
import LoadingSpinner from "../loading-spinner/loading-spinner.component";

const Navigation = () => {
  const [openSearch, setOpenSearch] = useState(false);
  const [openMenu, setOpenMenu] = useState(false);
  const [searchInput, setSearchInput] = useState("");

  const { user } = useUser();
  const { ws, isConnected } = useContext(WebSocketContext);

  const toggleSearch = () => {
    setOpenSearch((prev) => !prev);
    setSearchInput("");
  };

  const toggleMenu = () => {
    setOpenMenu((prev) => !prev);
  };

  const handleSearchChange = (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    setSearchInput(event.target.value);

    if (event.target.value.length >= 3) {
      const payload = { "search-user": event.target.value };
      ws?.send(JSON.stringify(payload));
    }
  };

  if (!user) {
    return (
      <div className="pt-52">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <>
      {/* Header (seach bar, menu, connection status) */}
      <div className="p-3 pb-0 border-b border-neutral-100 dark:border-neutral-500">
        <header className="relative flex justify-between pb-3">
          {/* The menu */}
          <button
            onClick={toggleMenu}
            className="text-lg p-2 pl-0 mr-8"
          >
            <VscMenu />
          </button>
          {openMenu && <Overlay handleClick={toggleMenu} />}
          <nav
            className={`fixed left-0 inset-y-0 z-40 -translate-x-full transition-transform duration-200 w-2/3 sm:w-64 md:w-72 lg:w-80 xl:w-96 bg-neutral-800${
              openMenu ? " translate-x-0" : ""
            }`}
          >
            <div className="h-1/6 border-b p-4 sm:p-6 pb-2">
              {/* TODO - make the bg color dynamic based on the name letter or just randomize it */}
              <div className="bg-red-500 w-12 h-12 rounded-full overflow-hidden text-3xl flex justify-center items-center">
                {user?.profilePicure ? (
                  <img
                    src={user.profilePicure}
                    alt={`${user.displayName}'s profile picture`}
                  />
                ) : (
                  <div>
                    {user.displayName[0].toLocaleUpperCase()}
                  </div>
                )}
              </div>

              <p className="pt-4 capitalize">
                {user.displayName}
              </p>
              <p className="opacity-60">{user.email}</p>
            </div>
            <div className="h-5/6 flex flex-col justify-between">
              <div>
                {/*TODO - Bunch of updates to fill the sapace things like update username email display name password etc */}
              </div>
              <div className="w-full px-4 sm:px-6 hover:bg-neutral-700">
                <a
                  href="/api/auth/signout"
                  title="Click to sign out"
                  className="h-12 text-red-500 text-lg flex items-center space-x-2"
                >
                  <VscSignOut />
                  <span> Signout</span>
                </a>
              </div>
            </div>
          </nav>
          {/* Connection status and search bar toggle*/}
          <div className="flex-1 w-full flex justify-between">
            <p className="text-2xl">
              {isConnected ? (
                <span className="tracking-tight font-semibold">
                  Chat app
                </span>
              ) : (
                <span className="animate-pulse">
                  Connecting...
                </span>
              )}
            </p>
            <button
              className="-rotate-90 text-lg"
              type="button"
              onClick={toggleSearch}
            >
              <VscSearch />
            </button>
          </div>
          {/* Search bar */}
          {openSearch && (
            <form className="absolute z-10 left-0 bg-neutral-700 rounded-md overflow-hidden w-full">
              <div>
                <label
                  htmlFor="user-search"
                  className="sr-only"
                >
                  Search
                </label>
                <div className="flex h-8 pr-1">
                  <input
                    className="w-full pl-4 pr-6 bg-transparent focus:outline-none "
                    type="text"
                    name="search"
                    id="user-search"
                    placeholder="Search"
                    value={searchInput}
                    onChange={handleSearchChange}
                    autoFocus
                  />

                  <button
                    className="text-lg"
                    type="button"
                    onClick={toggleSearch}
                  >
                    <VscClose />
                  </button>
                </div>
              </div>
            </form>
          )}
        </header>
      </div>
      {/* Chat cards container - can be filled with users's chats or search results for new chats */}
      <ChatCardsContainer />
    </>
  );
};

export default Navigation;
