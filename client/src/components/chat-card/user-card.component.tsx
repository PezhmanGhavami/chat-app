import { Link } from "react-router-dom";

export interface IChat {
  id: string;
  profilePicure: string | null;
  displayName: string;
  lastMessage: string;
  unreadCount: number;
  lastMessageDate: Date;
}

const ChatCard = ({ chat }: { chat: IChat }) => {
  return (
    <Link
      className="block border-b border-b-neutral-700 last-of-type:border-0"
      to={"/chat/" + chat.id}
    >
      <div className="flex py-2 px-3 select-none hover:bg-neutral-700">
        {/* Profile picture */}
        <div className="flex-none bg-red-500 w-12 h-12 rounded-full overflow-hidden text-3xl flex justify-center items-center">
          {chat.profilePicure ? (
            <img
              src={chat.profilePicure}
              alt={`${chat.displayName}'s profile picture`}
            />
          ) : (
            <div>
              {chat.displayName[0].toLocaleUpperCase()}
            </div>
          )}
        </div>
        {/* Chat details */}
        <div className="pl-3 w-full">
          {/* Title and last message time */}
          <div className="flex justify-between">
            <h3>{chat.displayName}</h3>
            <span className="text-xs text-neutral-400">
              {chat.lastMessageDate.toLocaleTimeString()}
            </span>
          </div>
          {/* Last message summary and unread messages */}
          <div className="flex justify-between">
            <div className="relative w-full mr-2">
              <p className="absolute inset-0 truncate text-neutral-400">
                {chat.lastMessage}
              </p>
            </div>
            <span className="flex-none bg-neutral-600 rounded-full text-sm text-white tracking-tighter w-5 h-5 flex justify-center items-center">
              {chat.unreadCount}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ChatCard;
