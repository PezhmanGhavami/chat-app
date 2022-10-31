import { ChangeEvent, useState } from "react";
import {
  VscSearch,
  VscClose,
  VscMenu,
} from "react-icons/vsc";

import UserCardsContainer from "../user-cards-container/user-cards-container.component";

const Navigation = ({
  connected,
}: {
  connected: boolean;
}) => {
  const [openSearch, setOpenSearch] = useState(false);
  const [searchInput, setSearchInput] = useState("");

  const toggleSearch = () => {
    setOpenSearch((prev) => !prev);
    setSearchInput("");
  };

  const handleSearchChange = (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    setSearchInput(event.target.value);
  };

  return (
    <>
      {/* Search bar */}
      <header className="relative flex justify-between mb-3 pb-3 border-b border-neutral-100 dark:border-neutral-500">
        <button className="text-lg p-2 pl-0  mr-8">
          <VscMenu />
        </button>
        <div className="flex-1 w-full flex justify-between">
          <p className="text-2xl">
            {connected ? (
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
            className="z-10 rotate-[270deg] text-lg"
            type="button"
            onClick={toggleSearch}
          >
            <VscSearch />
          </button>
        </div>

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
      {/* User cards container - can be filled with users's chats or search results for new chats */}
      <UserCardsContainer />
    </>
  );
};

export default Navigation;
