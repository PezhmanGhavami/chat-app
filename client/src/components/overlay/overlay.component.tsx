import { MouseEvent } from "react";

function Overlay({
  handleClick,
}: {
  handleClick: (event: MouseEvent) => void;
}) {
  return (
    <div
      className="fixed inset-0 z-30 cursor-pointer bg-black/30 dark:bg-black/50"
      onClick={handleClick}
    />
  );
}

export default Overlay;
