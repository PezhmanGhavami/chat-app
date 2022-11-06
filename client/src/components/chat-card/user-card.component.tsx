import { Link } from "react-router-dom";

const user: {
  profilePicure: string | null;
  displayName: string;
} = {
  profilePicure: null,
  displayName: "Toasty test",
};

const lastMessage =
  "Last message summary jkfasd jsdafa ajasdf dfsjjsdf jsfkl jlfj  jfsd jflsjfl jj fl jlf jaf j f a jfjs f;djf;ld asj";
const unreadCount = 25;

const ChatCard = () => {
  return (
    <Link
      className="block border-b border-b-neutral-700 last-of-type:border-0"
      to={"/chat/test"}
    >
      <div className="flex py-2 px-3 select-none hover:bg-neutral-700">
        {/* Profile picture */}
        <div className="flex-none bg-red-500 w-12 h-12 rounded-full overflow-hidden text-3xl flex justify-center items-center">
          {user?.profilePicure ? (
            <img
              src={user.profilePicure}
              alt={`${user.displayName}'s profile picture`}
            />
          ) : (
            <div>
              {user.displayName[0].toLocaleUpperCase()}
            </div>
          )}
        </div>
        {/* Chat details */}
        <div className="pl-3 w-full">
          {/* Title and last message time */}
          <div className="flex justify-between">
            <h3>Chat title</h3>
            <span className="text-xs text-neutral-400">
              00:30
            </span>
          </div>
          {/* Last message summary and unread messages */}
          <div className="flex justify-between">
            <div className="relative w-full mr-2">
              <p className="absolute inset-0 truncate text-neutral-400">
                {lastMessage}
              </p>
            </div>
            <span className="flex-none bg-neutral-600 rounded-full text-sm text-white tracking-tighter w-5 h-5 flex justify-center items-center">
              {unreadCount}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ChatCard;