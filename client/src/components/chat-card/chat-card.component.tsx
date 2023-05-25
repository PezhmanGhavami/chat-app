import { Link } from "react-router-dom";

import ProfilePicture from "../profile-picture/profile-picture.component";

export interface IChat {
  id: string;
  profilePicture: string | null;
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
      className="block border-b border-b-gray-200 last-of-type:border-0 dark:border-b-neutral-700"
      to={"/chat/" + chat.id}
    >
      <div className="flex select-none px-3 py-2 hover:bg-gray-200 dark:hover:bg-neutral-700">
        {/* Profile picture */}
        <div className="h-12 w-12 flex-none text-2xl">
          <ProfilePicture
            user={{
              displayName: chat.displayName,
              profilePicture: chat.profilePicture,
              bgColor: chat.bgColor,
            }}
          />
        </div>
        {/* Chat details */}
        <div className="w-full pl-3">
          {/* Title and last message time */}
          <div className="flex justify-between ">
            <h3 className="font-semibold">{chat.displayName}</h3>
            <span className="text-xs opacity-70">
              {dateFormatter(lastMessageDate)}
            </span>
          </div>
          {/* Last message summary and unread messages */}
          <div className="flex justify-between">
            <div className="relative mr-2 w-full">
              <p className="absolute inset-0 h-fit truncate opacity-70">
                {chat.lastMessage}
              </p>
            </div>
            {chat.unreadCount > 0 && (
              <span className="flex h-5 w-5 flex-none items-center justify-center rounded-full bg-gray-300 text-sm tracking-tighter dark:bg-neutral-600">
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
