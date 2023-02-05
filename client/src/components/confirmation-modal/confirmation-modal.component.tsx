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
        <p className="py-1 text-lg font-medium">
          Are you sure you want to continue?
        </p>
        <p>{message}</p>
        <div className="mt-4 flex w-full justify-end space-x-2">
          <button
            title="Cancel"
            className="h-7 w-1/4 rounded-md bg-red-600 text-white hover:opacity-80"
            onClick={closeModal}
          >
            Cancel
          </button>
          <button
            title="Confirm and proceed"
            className="h-7 w-1/4 rounded-md bg-green-700 text-white hover:opacity-80"
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
