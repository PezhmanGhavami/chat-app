import ChatCard, {
  IChat,
} from "../chat-card/chat-card.component";

interface IChatCardsContainer {
  chats: IChat[];
}

const ChatCardsContainer = ({
  chats,
}: IChatCardsContainer) => {
  return (
    <div className="overflow-y-scroll overflow-x-hidden">
      {chats.map((chat) => (
        <ChatCard chat={chat} />
      ))}
    </div>
  );
};

export default ChatCardsContainer;
