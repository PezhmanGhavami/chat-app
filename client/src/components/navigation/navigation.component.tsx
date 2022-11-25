import {
  ChangeEvent,
  FormEvent,
  useState,
  useContext,
  useEffect,
} from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  VscSearch,
  VscClose,
  VscMenu,
  VscSignOut,
  VscArchive,
  VscAccount,
  VscArrowLeft,
  VscEdit,
  VscCheck,
  VscLock,
} from "react-icons/vsc";
import {
  BsPeople,
  BsSunFill,
  BsMoonFill,
} from "react-icons/bs";
import { MdDevices } from "react-icons/md";
import { toast } from "react-toastify";

import useUser from "../../hooks/useUser";

import { WebSocketContext } from "../../context/websocket.context";
import { ThemeContext } from "../../context/theme.context";

import fetcher from "../../utils/fetcher";

import ChatCardsContainer from "../chat-cards-container/chat-cards-container.component";
import UserCardsContainer from "../user-card-container/user-cards-container.component";
import ProfilePicture from "../profile-picture/profile-picture.component";
import Modal from "../modal/modal.component";
import Overlay from "../overlay/overlay.component";
import LoadingSpinner from "../loading-spinner/loading-spinner.component";
import { formStyles } from "../../pages/signin/signin.page";
import { IChat } from "../chat-card/chat-card.component";
import { IUser } from "../user-card/user-card.component";

const navStyles = {
  button:
    "w-full px-4 sm:px-6 hover:bg-gray-200 dark:hover:bg-neutral-700 ",
  buttonDescription:
    "h-12 text-lg flex items-center space-x-2 ",
};

const bgColors = [
  "from-pink-400 to-pink-600",
  "from-rose-400 to-rose-600",
  "from-emerald-400 to-emerald-600",
  "from-green-500 to-green-600",
  "from-teal-400 to-teal-700",
  "from-cyan-500 to-cyan-600",
  "from-blue-400 to-blue-600",
  "from-indigo-400 to-indigo-600",
  "from-orange-400 to-orange-600",
  "from-amber-400 to-amber-500",
];

const userInfoFormDefault: {
  displayName: string;
  username: string;
  bgColor: string;
  profilePicture: null | string;
} = {
  displayName: "",
  username: "",
  bgColor: "",
  profilePicture: null,
};

const userAuthFormDefault: {
  password: string;
  email: string;
  newPassword: string;
  newPasswordConfirmation: string;
} = {
  password: "",
  email: "",
  newPassword: "",
  newPasswordConfirmation: "",
};

const unsavedChangSpan = (
  <span className="text-sm text-red-600 dark:text-red-500">
    *Unsaved change
  </span>
);

interface ISession {
  id: string;
  socketId: string;
  isOnline: boolean;
  lastOnline: Date | null;
  createdAt: Date;
}

const Navigation = () => {
  const [openSearch, setOpenSearch] = useState(false);
  const [openMenu, setOpenMenu] = useState(false);
  const [openUserInfoForm, setOpenUserInfoForm] =
    useState(false);
  const [openUserAuthForm, setOpenUserAuthForm] =
    useState(false);
  const [openSessionManager, setOpenSessionManager] =
    useState(false);
  const [formIsLoading, setFormIsLoading] = useState(false);
  const [chats, setChats] = useState<null | IChat[]>(null);
  const [archivedChats, setArchivedChats] = useState<
    null | IChat[]
  >(null);
  const [showArchived, setShowArchived] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [searchResult, setSearchResult] = useState<
    null | IUser[]
  >(null);
  const [authError, setAuthError] = useState(false);
  const [activeSessions, setActiveSessions] = useState<
    null | ISession[]
  >(null);
  const [userInfoForm, setUserInfoForm] = useState(
    userInfoFormDefault
  );
  const [userAuthForm, setUserAuthForm] = useState(
    userAuthFormDefault
  );

  const { user, mutateUser } = useUser();
  const { socket, isConnected, updateIsConnected } =
    useContext(WebSocketContext);
  const { theme, changeTheme } = useContext(ThemeContext);

  const navigate = useNavigate();

  // search input listener
  useEffect(() => {
    if (!socket) return;

    socket.on("search-result", (res) => {
      setSearchResult(res);
    });

    return () => {
      socket.off("search-result");
    };
  }, [socket]);

  // Connection status listener
  useEffect(() => {
    if (!socket) return updateIsConnected(false);

    socket.on("connect", () => {
      updateIsConnected(true);
    });
    socket.on("auth-error", ({ status, errorMessage }) => {
      toast.error(status + " - " + errorMessage);
      setAuthError(true);
    });
    socket.on("disconnect", () => {
      updateIsConnected(false);
    });

    return () => {
      socket.off("connect");
      socket.off("auth-error");
      socket.off("disconnect");
    };
  }, [socket]);

  // New chat and chats list update
  useEffect(() => {
    if (!chats || !archivedChats || !socket) return;
    socket.on("new-chat-created", (chat) => {
      setChats((prev) => [chat, ...(prev as IChat[])]);
      toggleSearch();
      navigate("/chat/" + chat.id);
    });
    socket.on("new-chat", (chat) => {
      setChats((prev) => [chat, ...(prev as IChat[])]);
    });
    socket.on("chat-exists", ({ chatId }) => {
      toggleSearch();
      navigate("/chat/" + chatId);
    });
    // chats list update
    socket.on(
      "chats-list-update",
      ({
        chatId,
        lastMessage,
        lastMessageDate,
        unreadCount,
        readAll,
      }) => {
        const targetChatIndex = chats.findIndex(
          (chat) => chat.id === chatId
        );
        if (chatId !== -1) {
          if (readAll) {
            setChats((prev) => {
              const newArr = [...prev!];
              newArr[targetChatIndex] = {
                ...newArr[targetChatIndex],
                unreadCount: 0,
              };
              newArr.sort(
                (a, b) =>
                  new Date(b.lastMessageDate).getTime() -
                  new Date(a.lastMessageDate).getTime()
              );

              return newArr;
            });
          } else {
            setChats((prev) => {
              const newArr = [...prev!];
              newArr[targetChatIndex] = {
                ...newArr[targetChatIndex],
                unreadCount: 0,
              };

              const basePayload = {
                ...newArr[targetChatIndex],
                lastMessage,
                lastMessageDate,
              };
              newArr[targetChatIndex] = unreadCount
                ? {
                    ...basePayload,
                    unreadCount,
                  }
                : basePayload;

              newArr.sort(
                (a, b) =>
                  new Date(b.lastMessageDate).getTime() -
                  new Date(a.lastMessageDate).getTime()
              );

              return newArr;
            });
          }
        }
      }
    );
    // Chat deleted
    socket.on("chat-deleted", ({ chatId }) => {
      setChats((prev) =>
        prev!.filter((chat) => chat.id !== chatId)
      );
    });

    socket.on("archive-change", ({ chatId, archive }) => {
      if (archive) {
        const newArchived = chats.find(
          (chat) => chat.id === chatId
        );
        setChats((prev) =>
          prev!.filter((chat) => chat.id !== chatId)
        );
        setArchivedChats((prev) => [
          newArchived!,
          ...prev!,
        ]);
      } else {
        const newUnarchived = archivedChats.find(
          (chat) => chat.id === chatId
        );
        setChats((prev) => [newUnarchived!, ...prev!]);
        setArchivedChats((prev) =>
          prev!.filter((chat) => chat.id !== chatId)
        );
      }
    });

    return () => {
      socket.off("new-chat-created");
      socket.off("chats-list-update");
      socket.off("chat-deleted");
      socket.off("archive-change");
      socket.off("new-chat");
      socket.off("chat-exists");
    };
  }, [chats, archivedChats, socket]);

  // Initial chats fetch
  useEffect(() => {
    fetcher("/api/chats", { method: "GET" })
      .then((chats) => {
        const normalChats = (chats as IChat[]).filter(
          (chat) => !chat.isArchived
        );
        const archivedChats = (chats as IChat[]).filter(
          (chat) => chat.isArchived
        );
        setChats(normalChats);
        setArchivedChats(archivedChats);
      })
      .catch((error) => {
        if (error instanceof Error) {
          toast.error(error.message);
        } else {
          toast.error("Something went wrong.");
        }
      });
  }, []);

  // Search close key listener
  useEffect(() => {
    if (!openSearch) return;

    const escapeEventFunction = (event: KeyboardEvent) => {
      if (event.code === "Escape") {
        toggleSearch();
      }
    };

    globalThis.addEventListener(
      "keyup",
      escapeEventFunction
    );

    return () => {
      globalThis.removeEventListener(
        "keyup",
        escapeEventFunction
      );
    };
  }, [openSearch]);

  const toggleSearch = () => {
    setOpenSearch((prev) => !prev);
    setSearchInput("");
    setSearchResult(null);
  };

  const toggleMenu = () => {
    setOpenMenu((prev) => !prev);
  };

  const toggleArchivedChats = () => {
    setShowArchived(true);
    toggleMenu();
  };
  const closeArchviedChats = () => {
    setShowArchived(false);
  };

  const toggleUserInfoForm = () => {
    if (user) {
      setOpenUserInfoForm((prev) => !prev);
      toggleMenu();
      setUserInfoForm({
        displayName: user.displayName,
        username: user.username ? user.username : "",
        bgColor: user.bgColor,
        profilePicture: user.profilePicture,
      });
    }
  };
  const closeUserInfoForm = () => {
    setOpenUserInfoForm(false);
  };

  const toggleUserAuthForm = () => {
    if (user) {
      setOpenUserAuthForm((prev) => !prev);
      toggleMenu();
      setUserAuthForm({
        ...userAuthFormDefault,
        email: user.email,
      });
    }
  };
  const closeUserAuthForm = () => {
    setOpenUserAuthForm(false);
  };

  const toggleSessionManager = () => {
    setOpenSessionManager(true);
    toggleMenu();
    fetcher("/api/auth/sessions", { method: "GET" })
      .then((sessions) => {
        setActiveSessions(sessions);
      })
      .catch((error) => {
        if (error instanceof Error) {
          toast.error(error.message);
        } else {
          toast.error("Couldn't fetch sessions.");
        }
      });
  };
  const closeSessionManager = () => {
    setOpenSessionManager(false);
    setActiveSessions(null);
  };

  const handleSearchChange = (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    setSearchInput(event.target.value);

    if (event.target.value.length >= 3) {
      socket?.emit("search", { query: event.target.value });
    }
  };

  const validateForm = (type: "info" | "auth") => {
    let formIsValid = true;

    if (type === "info") {
      const usernameRegex = /^[a-z0-9_-]{3,20}$/i;
      const displayNameRegex = /^(?!.{21,})\w+( *?\w)+$/;

      if (
        (userInfoForm.username !== "" ||
          userInfoForm.username) &&
        !usernameRegex.test(userInfoForm.username)
      ) {
        formIsValid = false;

        toast.error(
          "Invalid username.\nUsername can only contain alphanumeric values and (-),(_) symbols.\nUsername should be between 3 to 20 characters long"
        );
      }
      if (
        userInfoForm.displayName === "" ||
        !userInfoForm.displayName ||
        !displayNameRegex.test(userInfoForm.displayName)
      ) {
        formIsValid = false;

        toast.error(
          userInfoForm.displayName === "" ||
            !userInfoForm.displayName
            ? "You should provide a name"
            : "Invalid name.\nName should be less than 20 characters.Only alphanumeric characters and space is allowed."
        );
      }
    } else if (type === "auth") {
      const emailRegex =
        /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;

      if (
        userAuthForm.email === "" ||
        !userAuthForm.email ||
        !emailRegex.test(userAuthForm.email)
      ) {
        formIsValid = false;

        toast.error(
          userAuthForm.email === "" || !userAuthForm.email
            ? "You should provide an email address"
            : "Invalid email address."
        );
      }

      if (userAuthForm.password === "") {
        formIsValid = false;

        toast.error("You should provide a password.");
      }

      if (
        userAuthForm.newPassword !== "" &&
        userAuthForm.newPassword.length < 6
      ) {
        formIsValid = false;

        toast.error(
          "Your new password should be at least 6 characters."
        );
      }

      if (
        userAuthForm.newPassword !== "" &&
        (userAuthForm.newPasswordConfirmation === "" ||
          userAuthForm.newPasswordConfirmation !==
            userAuthForm.newPassword)
      ) {
        formIsValid = false;
        toast.error(
          userAuthForm.newPasswordConfirmation !==
            userAuthForm.newPassword
            ? "Passwords should match."
            : "Please confirm your password before you continue."
        );
      }
    }

    return formIsValid;
  };

  const handleUserInfoFormChange = (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    setUserInfoForm((prev) => ({
      ...prev,
      [event.target.name]: event.target.value,
    }));
  };
  const handleBgColorChange = (selectedColor: string) => {
    setUserInfoForm((prev) => ({
      ...prev,
      bgColor: selectedColor,
    }));
    (
      globalThis.document.activeElement as HTMLElement
    ).blur();
  };
  const handleUserInfoFormSubmit = (event: FormEvent) => {
    event.preventDefault();

    if (!validateForm("info")) return;

    console.log(userInfoForm);
  };

  const handleUserAuthFormChange = (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    setUserAuthForm((prev) => ({
      ...prev,
      [event.target.name]: event.target.value,
    }));
  };
  const handleUserAuthFormSubmit = async (
    event: FormEvent
  ) => {
    event.preventDefault();

    if (!validateForm("auth")) return;

    if (
      userAuthForm.email === user?.email &&
      userAuthForm.newPassword === ""
    ) {
      toast.info("Nothing to update.");
      return;
    }

    const payload: {
      password: string;
      email?: string;
      newPassword?: string;
      newPasswordConfirmation?: string;
    } = {
      password: userAuthForm.password,
    };

    if (userAuthForm.email !== user?.email) {
      payload.email = userAuthForm.email;
    }
    if (userAuthForm.newPassword !== "") {
      payload.newPassword = userAuthForm.newPassword;
      payload.newPasswordConfirmation =
        userAuthForm.newPasswordConfirmation;
    }

    const headers = new Headers({
      "Content-Type": "application/json",
    });
    try {
      setFormIsLoading(true);
      mutateUser(
        await fetcher("/api/auth", {
          method: "PUT",
          headers,
          body: JSON.stringify(payload),
        }),
        { revalidate: true }
      );
      toast.success("Changes saved successfully.");
      closeUserAuthForm();
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Couldn't updated credentials.");
      }
    } finally {
      setFormIsLoading(false);
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
      <div className="p-3 pb-0 border-b border-b-neutral-300 dark:border-b-neutral-500 shadow">
        {/* TODO - fix the sizings */}
        <header className="relative flex justify-between pb-3">
          {/* The menu */}
          {showArchived ? (
            <button
              title="Click to go back to chats"
              type="button"
              onClick={closeArchviedChats}
              className="text-lg p-2 pl-0 mr-8"
            >
              <VscArrowLeft />
            </button>
          ) : (
            <button
              onClick={toggleMenu}
              title="Open menu"
              type="button"
              className="text-lg p-2 pl-0 mr-8"
            >
              <VscMenu />
            </button>
          )}
          {openMenu && <Overlay handleClick={toggleMenu} />}
          <nav
            className={`fixed left-0 inset-y-0 z-40 flex flex-col transition-transform duration-200 w-2/3 sm:w-64 md:w-72 lg:w-80 xl:w-96 bg-white dark:bg-neutral-800 ${
              openMenu
                ? "translate-x-0"
                : "-translate-x-full"
            } `}
          >
            {/* Top part */}
            <div className="border-b border-b-neutral-300 dark:border-neutral-b-500 p-4 sm:p-6 pb-2">
              <div className=" flex justify-between">
                <div className="w-12 h-12 sm:w-14 sm:h-14 text-2xl">
                  <ProfilePicture
                    user={{
                      bgColor: user.bgColor,
                      displayName: user.displayName,
                      profilePicture: user.profilePicture,
                    }}
                  />
                </div>
                <button
                  type="button"
                  title={`Click to switch to ${
                    theme === "dark" ? "light" : "dark"
                  } theme`}
                  className="self-start text-xl p-2 rounded-full hover:bg-gray-200 dark:hover:bg-neutral-700"
                  onClick={changeTheme}
                >
                  {theme === "dark" ? (
                    <BsSunFill />
                  ) : (
                    <BsMoonFill />
                  )}
                </button>
              </div>
              <p className="pt-4 font-medium">
                {user.displayName}
              </p>
              <p className="opacity-70">{user.email}</p>
            </div>
            {/* Links and buttons */}
            <div className="flex-1 flex flex-col justify-between">
              {/* Menu buttons */}
              <div>
                <button
                  type="button"
                  title="Click to show the archived chats"
                  className={
                    navStyles.button +
                    navStyles.buttonDescription
                  }
                  onClick={toggleArchivedChats}
                >
                  <VscArchive />
                  <span>Show archive</span>
                </button>
                <button
                  type="button"
                  title="Click to edit your profile"
                  className={
                    navStyles.button +
                    navStyles.buttonDescription
                  }
                  onClick={toggleUserInfoForm}
                >
                  <VscAccount />
                  <span>Edit profile</span>
                </button>
                <button
                  type="button"
                  title="Click to change your credentials"
                  className={
                    navStyles.button +
                    navStyles.buttonDescription
                  }
                  onClick={toggleUserAuthForm}
                >
                  <VscLock />
                  <span>Account security</span>
                </button>
                {/* TODO - make groups work */}
                {/* <button
                  type="button"
                  title="Click to create a new group chat"
                  className={
                    navStyles.button +
                    navStyles.buttonDescription
                  }
                  onClick={() =>
                    console.log("new group button")
                  }
                >
                  <BsPeople />
                  <span>New group</span>
                </button> */}
                <button
                  type="button"
                  title="Click to see and terminate active sessions"
                  className={
                    navStyles.button +
                    navStyles.buttonDescription
                  }
                  onClick={toggleSessionManager}
                >
                  <MdDevices />
                  <span>Active sessions</span>
                </button>
              </div>
              {/* Signout button */}
              <div className={navStyles.button}>
                <a
                  href="/api/auth/signout"
                  title="Click to sign out"
                  className={
                    "text-red-600 dark:text-red-500 " +
                    navStyles.buttonDescription
                  }
                >
                  <VscSignOut />
                  <span>Signout</span>
                </a>
              </div>
            </div>
          </nav>
          {/* Connection status and search bar toggle*/}
          <div className="flex-1 w-full flex justify-between">
            <Link
              to="/"
              className="text-2xl select-none tracking-tight font-semibold"
            >
              {authError ? (
                <span title="There was a connection error, please refresh the page">
                  Connection error
                </span>
              ) : isConnected ? (
                showArchived ? (
                  <span title="Click to go home - Connected">
                    Archived chats
                  </span>
                ) : (
                  <span title="Click to go home - Connected">
                    Chat app
                  </span>
                )
              ) : (
                <span
                  title="Connecting..."
                  className="animate-pulse"
                >
                  Connecting...
                </span>
              )}
            </Link>
            <button
              title="Search for users"
              type="button"
              onClick={toggleSearch}
            >
              <VscSearch className="-rotate-90 text-lg" />
            </button>
          </div>
          {/* Search bar */}
          {openSearch && (
            <form className="absolute z-10 left-0 bg-gray-200 dark:bg-neutral-700 rounded-md overflow-hidden w-full">
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
                    title="Close search bar"
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
          {/* User info update form */}
          {openUserInfoForm && (
            <Modal closeModal={closeUserInfoForm}>
              <h2 className={formStyles.h2}>User info</h2>
              {/* Profile picture / profile bgColor selector*/}
              <div className="relative mb-2">
                {/* Selector */}
                <button
                  title="Click to change the background color"
                  type="button"
                  className="group absolute left-1/2 -translate-x-1/2 top-0 w-24 h-24 peer z-[41] rounded-full"
                >
                  <div className="invisible absolute left-1/2 -translate-x-1/2 top-24 w-2 h-2 rotate-45 bg-white dark:bg-neutral-900 border dark:border-neutral-600 border-r-0 border-b-0 z-[51] group-focus-within:visible group-active:visible cursor-default" />
                  <div className="invisible absolute left-1/2 -translate-x-1/2 top-[6.25rem] w-52 bg-white dark:bg-neutral-900 shadow-md rounded-lg border dark:border-neutral-600 py-2 z-50 group-focus-within:visible group-active:visible">
                    <div className="grid grid-cols-3 justify-items-center text-xl cursor-default">
                      {bgColors.map((color, index) => (
                        <div
                          key={index}
                          className="relative h-12 w-12 m-1 hover:cursor-pointer hover:opacity-80"
                          title={
                            color === userInfoForm.bgColor
                              ? "Currently selected"
                              : "Click to select background color"
                          }
                          onClick={() => {
                            handleBgColorChange(color);
                          }}
                        >
                          <ProfilePicture
                            user={{
                              displayName:
                                userInfoForm.displayName
                                  .length >= 1
                                  ? userInfoForm.displayName
                                  : user.displayName,
                              bgColor: color,
                              profilePicture:
                                userInfoForm.profilePicture,
                            }}
                          />
                          {color ===
                            userInfoForm.bgColor && (
                            <div className="absolute top-0 right-0 rounded-full bg-blue-600 text-white w-fit p-[2px] text-xs">
                              <VscCheck />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </button>
                {/* Preview */}
                <div className="relative w-24 h-24 text-5xl mx-auto peer-hover:opacity-80">
                  <ProfilePicture
                    user={{
                      displayName:
                        userInfoForm.displayName.length >= 1
                          ? userInfoForm.displayName
                          : user.displayName,
                      bgColor: userInfoForm.bgColor,
                      profilePicture:
                        userInfoForm.profilePicture,
                    }}
                  />
                  <div className="absolute bottom-1 right-1 rounded-full bg-white dark:bg-neutral-900 p-1 text-base">
                    <VscEdit />
                  </div>
                </div>

                <div
                  className={`text-center ${
                    userInfoForm.bgColor !== user.bgColor
                      ? "visible"
                      : "invisible"
                  }`}
                >
                  {unsavedChangSpan}
                </div>
              </div>
              <form
                onSubmit={handleUserInfoFormSubmit}
                className="flex flex-col space-y-2"
              >
                {/* TODO - handle image upload */}
                <div className={formStyles.inputsContainer}>
                  <div
                    className={formStyles.inputContainer}
                  >
                    <label
                      className={formStyles.label}
                      htmlFor="update-display-name"
                    >
                      Name{" "}
                      {userInfoForm.displayName !==
                        user.displayName && (
                        <div className="float-right">
                          {unsavedChangSpan}
                        </div>
                      )}
                    </label>
                    <input
                      type="text"
                      name="displayName"
                      id="update-display-name"
                      value={userInfoForm.displayName}
                      onChange={handleUserInfoFormChange}
                      className={formStyles.input}
                    />
                  </div>
                  <div
                    className={formStyles.inputContainer}
                  >
                    <label
                      className={formStyles.label}
                      htmlFor="update-username"
                    >
                      Username{" "}
                      {(user.username &&
                        userInfoForm.username !==
                          user.username) ||
                        (userInfoForm.username.length >=
                          1 &&
                          user.username === null && (
                            <div className="float-right">
                              {unsavedChangSpan}
                            </div>
                          ))}
                    </label>
                    <input
                      type="text"
                      name="username"
                      id="update-username"
                      value={userInfoForm.username}
                      onChange={handleUserInfoFormChange}
                      className={formStyles.input}
                    />
                  </div>
                </div>
                <button
                  className={formStyles.submitButton}
                  title="Click to save info"
                  type="submit"
                >
                  Save
                </button>
              </form>
            </Modal>
          )}
          {/* User credentials update form */}
          {openUserAuthForm && (
            <Modal closeModal={closeUserAuthForm}>
              <h2 className={formStyles.h2}>
                Account security
              </h2>
              <form
                onSubmit={handleUserAuthFormSubmit}
                className="flex flex-col space-y-2"
              >
                <div className={formStyles.inputsContainer}>
                  <div
                    className={formStyles.inputContainer}
                  >
                    <label
                      className={formStyles.label}
                      htmlFor="confirm-password"
                    >
                      Password{" "}
                      <div className="float-right">
                        <span className="text-sm text-red-600 dark:text-red-500">
                          *Required
                        </span>
                      </div>
                    </label>
                    <input
                      type="password"
                      name="password"
                      id="confirm-password"
                      value={userAuthForm.password}
                      onChange={handleUserAuthFormChange}
                      className={formStyles.input}
                    />
                  </div>
                  <div
                    className={formStyles.inputContainer}
                  >
                    <label
                      className={formStyles.label}
                      htmlFor="update-email"
                    >
                      Email address{" "}
                      {userAuthForm.email !==
                        user.email && (
                        <div className="float-right">
                          {unsavedChangSpan}
                        </div>
                      )}
                    </label>
                    <input
                      type="email"
                      name="email"
                      id="update-email"
                      value={userAuthForm.email}
                      onChange={handleUserAuthFormChange}
                      className={formStyles.input}
                    />
                  </div>
                  <div
                    className={formStyles.inputContainer}
                  >
                    <label
                      className={formStyles.label}
                      htmlFor="update-password"
                    >
                      New password{" "}
                      <div className="float-right">
                        {userAuthForm.newPassword !== "" &&
                          (userAuthForm.newPassword.length <
                          6 ? (
                            <span className="text-sm text-red-600 dark:text-red-500">
                              Needs to be at least 6
                              characters
                            </span>
                          ) : userAuthForm.newPassword !==
                            userAuthForm.newPasswordConfirmation ? (
                            <span className="text-sm text-red-600 dark:text-red-500">
                              Passwords should match
                            </span>
                          ) : (
                            unsavedChangSpan
                          ))}
                      </div>
                    </label>
                    <input
                      type="password"
                      name="newPassword"
                      id="update-password"
                      value={userAuthForm.newPassword}
                      onChange={handleUserAuthFormChange}
                      className={formStyles.input}
                    />
                  </div>
                  <div
                    className={formStyles.inputContainer}
                  >
                    <label
                      className={formStyles.label}
                      htmlFor="update-password-confirmation"
                    >
                      Confirm password{" "}
                      <div className="float-right">
                        {userAuthForm.newPassword !== "" &&
                          userAuthForm.newPasswordConfirmation !==
                            "" &&
                          (userAuthForm.newPassword !==
                          userAuthForm.newPasswordConfirmation ? (
                            <span className="text-sm text-red-600 dark:text-red-500">
                              Passwords should match
                            </span>
                          ) : (
                            unsavedChangSpan
                          ))}
                      </div>
                    </label>
                    <input
                      type="password"
                      name="newPasswordConfirmation"
                      id="update-password-confirmation"
                      value={
                        userAuthForm.newPasswordConfirmation
                      }
                      onChange={handleUserAuthFormChange}
                      className={formStyles.input}
                    />
                  </div>
                </div>
                <button
                  className={formStyles.submitButton}
                  title="Click to save credentials"
                  type="submit"
                >
                  {formIsLoading ? (
                    <LoadingSpinner />
                  ) : (
                    "Save"
                  )}
                </button>
              </form>
            </Modal>
          )}
          {/* Session manager */}
          {openSessionManager && (
            <Modal closeModal={closeSessionManager}>
              {!activeSessions ? (
                <div className="py-24 text-3xl">
                  <LoadingSpinner />
                </div>
              ) : (
                <div>
                  <h2 className="text-lg font-medium">
                    Active sessions
                  </h2>
                  <div>
                    {activeSessions.map((session) => (
                      <div key={session.id} className="">
                        <p>{session.isOnline}</p>
                        <p>
                          {new Date(
                            session.createdAt
                          ).toLocaleString()}
                        </p>
                        <p>{session.socketId}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Modal>
          )}
        </header>
      </div>
      {/* Chat cards container - can be filled with users's chats or search results for new chats */}
      {openSearch ? (
        searchInput.length >= 3 ? (
          <UserCardsContainer users={searchResult} />
        ) : (
          <div className="flex justify-center items-center text-center text-xl p-12 sm:p-2 h-full select-none">
            <p>
              Search by name, username, id or email address
            </p>
          </div>
        )
      ) : !chats || !archivedChats ? (
        <div className="py-72 text-3xl">
          <LoadingSpinner />
        </div>
      ) : !showArchived ? (
        chats.length > 0 ? (
          <ChatCardsContainer chats={chats} />
        ) : (
          <div className="flex flex-col justify-center items-center h-full select-none space-y-4 p-12 sm:px-4 text-center">
            <p className="text-2xl">
              You haven't started a converstion yet.
            </p>
            <p className="text-sm">
              You can start chatting by searching for people
              you know and begin a conversation with them;
              after that, your chats will be listed here.
            </p>
            <button
              title="Start searching for users"
              type="button"
              onClick={toggleSearch}
              className="border rounded-md px-2 py-1 hover:bg-gray-200 dark:hover:bg-neutral-900"
            >
              Search now
            </button>
          </div>
        )
      ) : archivedChats.length > 0 ? (
        <ChatCardsContainer chats={archivedChats} />
      ) : (
        <div className="flex flex-col justify-center items-center h-full select-none space-y-4 p-12 sm:px-4 text-center">
          <p className="text-2xl">Archive is empty.</p>
          <button
            title="Back to chats"
            type="button"
            onClick={closeArchviedChats}
            className="border rounded-md px-2 py-1 hover:bg-gray-200 dark:hover:bg-neutral-900"
          >
            Go back to chats
          </button>
        </div>
      )}
    </>
  );
};

export default Navigation;
