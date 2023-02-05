import { Link } from "react-router-dom";

function NotFound() {
  return (
    <div className="flex h-[85vh] flex-col items-center justify-center">
      <p className="pb-4 text-4xl">There's nothing here!</p>
      <Link
        className="pt-4 text-neutral-600 hover:text-neutral-800 hover:underline dark:text-neutral-400 dark:hover:text-neutral-100"
        to={"/"}
      >
        Go Back Home
      </Link>
    </div>
  );
}
export default NotFound;
