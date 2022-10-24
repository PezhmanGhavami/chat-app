import { AiOutlineLoading3Quarters } from "react-icons/ai";

function Loading() {
  return (
    <div className="h-full w-full flex justify-center items-center">
      <AiOutlineLoading3Quarters className="animate-spin" />
    </div>
  );
}

export default Loading;
