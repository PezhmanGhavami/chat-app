import { MouseEvent } from "react";

function Overlay({
  handleClick,
}: {
  handleClick: (event: MouseEvent) => void;
}) {
  return (
    <div
      className="fixed inset-0 bg-black/30 dark:bg-black/50 cursor-pointer z-30"
      onClick={handleClick}
    />
  );
}

export default Overlay;
