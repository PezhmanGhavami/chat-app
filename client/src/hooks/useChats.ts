import { useUser } from "./useUser";
import fetcher from "../utils/fetcher";
import { useQuery } from "@tanstack/react-query";

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

const useChats = () => {
  const user = useUser();
  return useQuery<IChat[], Error>({
    queryKey: ["chats", user.data?.userID],
    queryFn: () => fetcher("/api/chats"),
    staleTime: Infinity,
  });
};

export { useChats };
