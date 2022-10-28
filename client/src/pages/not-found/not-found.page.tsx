import { Link } from "react-router-dom";

function NotFound() {
  return (
    <div className="h-[85vh] flex flex-col justify-center items-center">
      <p className="text-4xl pb-4">There's nothing here!</p>
      <Link
        className="pt-4 text-neutral-600 dark:text-neutral-400 hover:underline hover:text-neutral-800 dark:hover:text-neutral-100"
        to={"/"}
      >
        Go Back Home
      </Link>
    </div>
  );
}
export default NotFound;
