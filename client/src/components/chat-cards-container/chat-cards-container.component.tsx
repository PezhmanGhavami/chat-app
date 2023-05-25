import ChatCard, { IChat } from "../chat-card/chat-card.component";

interface IChatCardsContainer {
  chats: IChat[];
}

const ChatCardsContainer = ({ chats }: IChatCardsContainer) => {
  return (
    <div className="overflow-y-auto overflow-x-hidden">
      {chats.map((chat) => (
        <ChatCard key={chat.id} chat={chat} />
      ))}
    </div>
  );
};

export default ChatCardsContainer;
