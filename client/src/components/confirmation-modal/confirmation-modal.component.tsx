import { MouseEvent } from "react";
import Modal from "../modal/modal.component";

const ConfirmationModal = ({
  closeModal,
  confirmModal,
  message,
}: {
  message: string;
  closeModal: (event: MouseEvent) => void;
  confirmModal: (event: MouseEvent) => void;
}) => {
  return (
    <Modal closeModal={closeModal}>
      <div className="text-base">
        <p className="text-lg font-medium py-1">
          Are you sure you want to continue?
        </p>
        <p>{message}</p>
        <div className="flex justify-end w-full mt-4 space-x-2">
          <button
            title="Cancel"
            className="w-1/4 h-7 text-white bg-red-600 hover:opacity-80 rounded-md"
            onClick={closeModal}
          >
            Cancel
          </button>
          <button
            title="Confirm and proceed"
            className="w-1/4 h-7 text-white bg-green-700 hover:opacity-80 rounded-md"
            onClick={confirmModal}
          >
            Continue
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmationModal;
