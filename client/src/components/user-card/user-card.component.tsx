import { useState, useContext, MouseEvent } from "react";
import { toast } from "react-toastify";

import Modal from "../modal/modal.component";
import ProfilePicture from "../profile-picture/profile-picture.component";

import { WebSocketContext } from "../../context/websocket.context";

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
  const { socket, isConnected } = useContext(
    WebSocketContext
  );

  const handleClick = () => {
    if (!socket || !isConnected) {
      return toast.error(
        "Connection lost\nReconnecting..."
      );
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
          <div className="flex-none w-14 h-14 text-3xl">
            <ProfilePicture user={user} />
          </div>
          <div>
            <p className="leading-4">{user.displayName}</p>
            {user.username && (
              <p className="text-xs opacity-80">
                @{user.username}
              </p>
            )}
          </div>
        </div>

        <button
          onClick={handleClick}
          className="text-white bg-blue-600 hover:bg-blue-700 w-full rounded-lg p-1"
        >
          Click to start conversation
        </button>
      </div>
    </Modal>
  );
};

const UserCard = ({
  user,
  isInChat,
  isReconnecting,
}: IUserCard) => {
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
                  new Date((user as IChatUser).lastOnline!)
                )}`
              : "last seen a long time ago"}
          </p>
        )}
      </div>

      {modalIsOpen && (
        <UserModal user={user} closeModal={closeModal} />
      )}
    </div>
  );
};

UserCard.defaultProps = {
  isInChat: false,
  isReconnecting: false,
};

export default UserCard;
