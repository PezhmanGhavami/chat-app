import { useState, useContext, MouseEvent } from "react";
import { VscClose } from "react-icons/vsc";
import { toast } from "react-toastify";

import Overlay from "../overlay/overlay.component";
import ProfilePicture from "../profile-picture/profile-picture.component";

import { WebSocketContext } from "../../context/websocket.context";

import UserCard, {
  IUser,
} from "../user-card/user-card.component";

interface IUserCardsContainer {
  users: null | IUser[];
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

const UserCardsContainer = ({
  users,
}: IUserCardsContainer) => {
  const [modalIsOpen, setModalIsOpen] = useState(false);

  const closeModal = (event: MouseEvent) => {
    event.stopPropagation();
    setModalIsOpen(false);
  };
  const openModal = () => {
    setModalIsOpen(true);
  };

  if (!users || users?.length === 0) {
    return (
      <div className="flex justify-center items-center text-center text-xl p-12 sm:p-2 h-full select-none">
        <p>There are no results for your search</p>
      </div>
    );
  }

  return (
    <div className="overflow-y-auto overflow-x-hidden">
      {users.map((user) => (
        <div
          key={user.id}
          onClick={openModal}
          className="hover:bg-neutral-700 hover:cursor-pointer py-3"
        >
          {modalIsOpen && (
            <>
              <Overlay handleClick={closeModal} />
              <UserModal
                user={user}
                closeModal={closeModal}
              />
            </>
          )}
          <UserCard user={user} />
        </div>
      ))}
    </div>
  );
};

export default UserCardsContainer;
