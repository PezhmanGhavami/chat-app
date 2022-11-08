import { useState, useContext, MouseEvent } from "react";
import { VscClose } from "react-icons/vsc";
import { toast } from "react-toastify";

import Overlay from "../overlay/overlay.component";
import ProfilePicture from "../profile-picture/profile-picture.component";

import { WebSocketContext } from "../../context/websocket.context";

export interface IUser {
  id: string;
  displayName: string;
  profilePicure: string | null;
}

interface IUserCard {
  user: IUser;
}

const UserModal = ({
  user,
  closeModal,
}: {
  user: IUser;
  closeModal: (event: MouseEvent) => void;
}) => {
  const socket = useContext(WebSocketContext);

  const handleClick = () => {
    if (!socket) {
      return toast.error(
        "Connection lost\nReconnecting..."
      );
    }
    socket.emit("create-chat", { recipientId: user.id });
  };

  return (
    <div className="fixed z-40 inset-x-0 bottom-1/2 w-11/12 md:w-3/5 xl:w-2/5 mx-auto bg-neutral-800 rounded-lg p-4 hover:cursor-default">
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
          className="bg-green-700 hover:bg-green-800 w-full rounded-lg p-1"
        >
          Click to start chatting
        </button>
      </div>
    </div>
  );
};

const UserCard = ({ user }: IUserCard) => {
  const [modalIsOpen, setModalIsOpen] = useState(false);

  const closeModal = (event: MouseEvent) => {
    event.stopPropagation();
    setModalIsOpen(false);
  };
  const openModal = () => {
    setModalIsOpen(true);
  };

  return (
    <div
      onClick={openModal}
      className="flex items-center px-3 select-none"
    >
      {/* Profile picture */}
      <div className="flex-none w-8 h-8">
        <ProfilePicture user={user} />
      </div>
      {/* Display name */}
      <div className="pl-2">
        <h3>{user.displayName}</h3>
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

export default UserCard;
