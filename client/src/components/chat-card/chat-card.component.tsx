import { Link } from "react-router-dom";

import ProfilePicture from "../profile-picture/profile-picture.component";

export interface IChat {
  id: string;
  profilePicure: string | null;
  displayName: string;
  lastMessage: string;
  unreadCount: number;
  lastMessageDate: Date;
  isArchived: boolean;
  bgColor: string;
}

export const dateFormatter = (date: Date) => {
  const today = new Date(Date.now());

  if (
    today.getDay() === date.getDay() &&
    today.getMonth() === date.getMonth() &&
    today.getFullYear() === date.getFullYear()
  ) {
    return date.toLocaleTimeString("default", {
      hour: "numeric",
      minute: "numeric",
    });
  } else {
    return date.toLocaleDateString();
  }
};

const ChatCard = ({ chat }: { chat: IChat }) => {
  const lastMessageDate = new Date(chat.lastMessageDate);

  return (
    <Link
      className="block border-b border-b-gray-200 dark:border-b-neutral-700 last-of-type:border-0"
      to={"/chat/" + chat.id}
    >
      <div className="flex py-2 px-3 select-none hover:bg-gray-200 dark:hover:bg-neutral-700">
        {/* Profile picture */}
        <div className="flex-none w-12 h-12">
          <ProfilePicture
            user={{
              displayName: chat.displayName,
              profilePicure: chat.profilePicure,
              bgColor: chat.bgColor,
            }}
          />
        </div>
        {/* Chat details */}
        <div className="pl-3 w-full">
          {/* Title and last message time */}
          <div className="flex justify-between ">
            <h3 className="font-semibold">
              {chat.displayName}
            </h3>
            <span className="text-xs opacity-70">
              {dateFormatter(lastMessageDate)}
            </span>
          </div>
          {/* Last message summary and unread messages */}
          <div className="flex justify-between">
            <div className="relative w-full mr-2">
              <p className="absolute inset-0 truncate opacity-70 h-fit">
                {chat.lastMessage}
              </p>
            </div>
            {chat.unreadCount > 0 && (
              <span className="flex-none bg-gray-300 dark:bg-neutral-600 rounded-full text-sm tracking-tighter w-5 h-5 flex justify-center items-center">
                {chat.unreadCount}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ChatCard;
