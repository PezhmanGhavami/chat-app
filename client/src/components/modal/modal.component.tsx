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
      <div className="fixed z-40 inset-x-0 bottom-1/2 w-11/12 md:w-3/5 xl:w-2/5 mx-auto bg-gray-100 dark:bg-neutral-800 rounded-lg p-4 hover:cursor-default shadow-2xl">
        <button
          type="button"
          className="absolute top-0 right-0 p-3 self-end"
          onClick={closeModal}
        >
          <VscClose className="h-6 w-6" />
        </button>
        {children}
      </div>
    </>
  );
};

export default Modal;
