import { useState, useContext, MouseEvent } from "react";
import { toast } from "react-toastify";

import Modal from "../modal/modal.component";
import ProfilePicture from "../profile-picture/profile-picture.component";

import { SocketIOContext } from "../../context/socket.io.context";

import { dateFormatter } from "../chat-card/chat-card.component";
import { IChatUser } from "../../pages/chat/chat.page";

// NOTE - Naming conflict with the main IUser interface from useUser hook
export interface IUser {
  id: string;
  username: string | null;
  bgColor: string;
  displayName: string;
  profilePicture: string | null;
}

interface IUserCard {
  user: IUser | IChatUser;
  isInChat: boolean;
  isReconnecting: boolean;
}

const UserModal = ({
  user,
  closeModal,
}: {
  user: IUser;
  closeModal: (event: MouseEvent) => void;
}) => {
  const { socket, isConnected } = useContext(SocketIOContext);

  const handleClick = () => {
    if (!socket || !isConnected) {
      return toast.error("Connection lost\nReconnecting...");
    }
    socket.emit("create-chat", {
      recipientId: user.id,
      recipientName: user.displayName,
    });
  };

  return (
    <Modal closeModal={closeModal}>
      <div className="flex flex-col">
        <div className="flex items-center space-x-4 pb-4">
          <div className="h-14 w-14 flex-none text-3xl">
            <ProfilePicture user={user} />
          </div>
          <div>
            <p className="leading-4">{user.displayName}</p>
            {user.username && (
              <p className="text-xs opacity-80">@{user.username}</p>
            )}
          </div>
        </div>

        <button
          onClick={handleClick}
          className="w-full rounded-lg bg-blue-600 p-1 text-white hover:bg-blue-700"
        >
          Click to start conversation
        </button>
      </div>
    </Modal>
  );
};

const UserCard = ({ user, isInChat, isReconnecting }: IUserCard) => {
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
      className="flex h-full w-full select-none items-center px-3"
    >
      {/* Profile picture */}
      <div className="h-8 w-8 flex-none">
        <ProfilePicture user={user} />
      </div>
      {/* Display name */}
      <div className="pl-2">
        <h3
          className={`${isInChat ? "text-base font-semibold leading-4" : ""}`}
        >
          {user.displayName}
        </h3>
        {isInChat && (
          <p
            className={`text-xs opacity-80${
              isReconnecting ? " animate-pulse" : ""
            }`}
          >
            {isReconnecting
              ? "reconnecting..."
              : (user as IChatUser).isOnline
              ? "online"
              : (user as IChatUser).lastOnline
              ? `last seen ${dateFormatter(
                  new Date((user as IChatUser).lastOnline!),
                )}`
              : "last seen a long time ago"}
          </p>
        )}
      </div>

      {modalIsOpen && <UserModal user={user} closeModal={closeModal} />}
    </div>
  );
};

UserCard.defaultProps = {
  isInChat: false,
  isReconnecting: false,
};

export default UserCard;
