import { ReactNode, MouseEvent } from "react";
import { VscClose } from "react-icons/vsc";

import Overlay from "../overlay/overlay.component";

const Modal = ({
  children,
  closeModal,
}: {
  children: ReactNode;
  closeModal: (event: MouseEvent) => void;
}) => {
  return (
    <>
      <Overlay handleClick={closeModal} />
      <div className="fixed inset-x-0 bottom-1/2 z-40 mx-auto w-11/12 max-w-md translate-y-1/2 rounded-lg bg-white p-4 shadow-2xl hover:cursor-default dark:bg-neutral-800">
        <button
          type="button"
          title="Close"
          className="absolute right-0 top-0 self-end p-3"
          onClick={closeModal}
        >
          <VscClose className="h-6 w-6 hover:opacity-75" />
        </button>
        {children}
      </div>
    </>
  );
};

export default Modal;
