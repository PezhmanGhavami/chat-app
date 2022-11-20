import { useState, useContext, MouseEvent } from "react";
import { VscClose } from "react-icons/vsc";
import { toast } from "react-toastify";

import Overlay from "../overlay/overlay.component";
import ProfilePicture from "../profile-picture/profile-picture.component";

import { WebSocketContext } from "../../context/websocket.context";

import { dateFormatter } from "../chat-card/chat-card.component";
import { IChatUser } from "../../pages/chat/chat.page";

// NOTE - Naming conflict with the main IUser interface from useUser hook
export interface IUser {
  id: string;
  bgColor: string;
  displayName: string;
  profilePicure: string | null;
}

interface IUserCard {
  user: IUser | IChatUser;
  isInChat: boolean;
}

const UserModal = ({
  user,
  closeModal,
}: {
  user: IUser;
  closeModal: (event: MouseEvent) => void;
}) => {
  const { socket, isConnected } = useContext(
    WebSocketContext
  );

  const handleClick = () => {
    if (!socket || !isConnected) {
      return toast.error(
        "Connection lost\nReconnecting..."
      );
    }
    socket.emit("create-chat", { recipientId: user.id });
  };

  return (
    <div className="fixed z-40 inset-x-0 bottom-1/2 w-11/12 md:w-3/5 xl:w-2/5 mx-auto bg-gray-100 dark:bg-neutral-800 rounded-lg p-4 hover:cursor-default shadow-2xl">
      <div className="flex flex-col">
        <button
          type="button"
          className="p-2 pt-0 self-end"
          onClick={closeModal}
        >
          <VscClose className="h-6 w-6" />
        </button>

        <div className="flex items-center space-x-4 pb-4">
          <div className="flex-none w-14 h-14">
            <ProfilePicture user={user} />
          </div>
          <p>{user.displayName}</p>
        </div>

        <button
          onClick={handleClick}
          className="text-white bg-blue-600 hover:bg-blue-700 w-full rounded-lg p-1"
        >
          Click to start conversation
        </button>
      </div>
    </div>
  );
};

const UserCard = ({ user, isInChat }: IUserCard) => {
  const [modalIsOpen, setModalIsOpen] = useState(false);

  const closeModal = (event: MouseEvent) => {
    event.stopPropagation();
    if (isInChat) return;
    setModalIsOpen(false);
  };
  const openModal = () => {
    if (isInChat) return;
    setModalIsOpen(true);
  };

  return (
    <div
      onClick={openModal}
      className="flex items-center px-3 select-none w-full h-full"
    >
      {/* Profile picture */}
      <div className="flex-none w-8 h-8">
        <ProfilePicture user={user} />
      </div>
      {/* Display name */}
      <div className="pl-2">
        <h3
          className={`${
            isInChat
              ? "text-base font-semibold leading-3"
              : ""
          }`}
        >
          {user.displayName}
        </h3>
        {isInChat && (
          <p className="text-xs text-white/80">
            {(user as IChatUser).isOnline
              ? "online"
              : (user as IChatUser).lastOnline
              ? `last seen ${dateFormatter(
                  new Date((user as IChatUser).lastOnline!)
                )}`
              : "last seen a long time ago"}
          </p>
        )}
      </div>

      {modalIsOpen && (
        <>
          <Overlay handleClick={closeModal} />
          <UserModal user={user} closeModal={closeModal} />
        </>
      )}
    </div>
  );
};

UserCard.defaultProps = {
  isInChat: false,
};

export default UserCard;
