import {
  useState,
  useEffect,
  ChangeEvent,
  FormEvent,
  useRef,
  useContext,
  UIEventHandler,
} from "react";
import {
  Link,
  useParams,
  useNavigate,
} from "react-router-dom";
import { toast } from "react-toastify";
import {
  VscArrowLeft,
  VscArrowDown,
  VscKebabVertical,
} from "react-icons/vsc";
import { IoSend } from "react-icons/io5";

import { WebSocketContext } from "../../context/websocket.context";

import UserCard, {
  IUser,
} from "../../components/user-card/user-card.component";
import LoadingSpinner from "../../components/loading-spinner/loading-spinner.component";

export interface IChatUser extends IUser {
  recipientId: string;
  isOnline: boolean;
  lastOnline: Date | null;
}
interface IMessage {
  id: string;
  body: string;
  chatId: string;
  senderId: string;
  createdAt: Date;
  updatedAt: Date;
  recipients: {
    isRead: boolean;
    recipientId: string;
  }[];
}

const showMessageDate = (
  messages: IMessage[],
  index: number
) => {
  if (messages.length - 1 === index) return true;
  const currentDate = new Date(messages[index].createdAt);
  const nextDate = new Date(messages[index + 1].createdAt);
  if (
    Math.floor(
      (nextDate.getTime() - currentDate.getTime()) / 1000
    ) > 90
  ) {
    return true;
  }
  return false;
};

const Message = ({
  message,
  isOwn,
  isLast,
  showTime,
}: {
  message: IMessage;
  isOwn: boolean;
  isLast: boolean;
  showTime: boolean;
}) => {
  const messageTime = new Date(
    message.createdAt
  ).toLocaleTimeString("default", {
    hour: "numeric",
    minute: "numeric",
  });

  return (
    <div>
      <div
        className={`w-fit max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl 2xl:max-w-2xl mt-1 py-2 px-4 rounded-2xl break-words ${
          isOwn
            ? `bg-blue-600 ml-auto ${
                isLast || showTime ? "rounded-br-sm" : ""
              }`
            : `bg-neutral-600 mr-auto ${
                isLast || showTime ? "rounded-bl-sm" : ""
              }`
        }`}
        key={message.id}
      >
        <p className="leading-tight">{message.body}</p>
      </div>
      {(isLast || showTime) && (
        <p
          className={`block text-xs pt-1 select-none text-white/70 mb-2 ${
            isOwn ? "text-right" : "text-left"
          }`}
        >
          {messageTime}
          {isOwn && (
            <span className="font-semibold">
              {message.recipients[0].isRead
                ? " . Read"
                : " . Delivered"}
            </span>
          )}
        </p>
      )}
    </div>
  );
};

const isTheSameDay = (
  currentDateUnformatted: Date,
  previousDateUnformatted: Date
) => {
  const currentDate = new Date(currentDateUnformatted);
  const previousDate = new Date(previousDateUnformatted);

  if (currentDate.getDay() !== previousDate.getDay()) {
    return false;
  }
  return true;
};

const isLast = (messages: IMessage[], index: number) => {
  if (messages.length - 1 === index) return true;
  if (
    !isTheSameDay(
      messages[index].createdAt,
      messages[index + 1].createdAt
    )
  ) {
    return true;
  }
  const currentMessage = messages[index];
  const nextMessage = messages[index + 1];
  if (currentMessage.senderId !== nextMessage.senderId) {
    return true;
  }
  return false;
};

function Chat() {
  const [currentRecipientUser, setCurrentRecipientUser] =
    useState<IChatUser | null>(null);
  const [messagesList, setMessagesList] = useState<
    IMessage[] | null
  >(null);
  const [message, setMessage] = useState("");
  const [startOfUnread, setStartOfUnread] = useState<
    null | number
  >(null);
  const [scrollbarAtEnd, setScrollbarAtEnd] =
    useState(false);
  const [scrollbarAtTop, setScrollbarAtTop] =
    useState(false);
  // TODO - use this to load more messages

  const messagesListEnd = useRef<null | HTMLDivElement>(
    null
  );
  const unreadMessages = useRef<null | HTMLDivElement>(
    null
  );

  const { socket, isConnected } = useContext(
    WebSocketContext
  );

  const params = useParams();
  const navigate = useNavigate();

  // Chat initializer
  // join emit - leave emit
  // init data listener - internal error listener
  useEffect(() => {
    if (!socket || !params.chatID || !isConnected) return;

    socket.emit("joined-chat", { chatId: params.chatID });

    socket.on(
      `chat-${params.chatID}-init`,
      ({ recipientUser, messages }) => {
        setCurrentRecipientUser(recipientUser);
        setMessagesList(messages.reverse());
      }
    );

    socket.on(
      `chat-${params.chatID}-new-message`,
      ({ message }) => {
        setMessagesList((prev) => [
          ...(prev as IMessage[]),
          message,
        ]);
      }
    );

    socket.on(
      `chat-${params.chatID}-error`,
      ({ status, errorMessasge }) => {
        toast.error(status + " - " + errorMessasge);
        navigate("/");
      }
    );

    return () => {
      socket.off(`chat-${params.chatID}-init`);
      socket.off(`chat-${params.chatID}-error`);
      socket.off(`chat-${params.chatID}-new-message`);
      socket.emit("left-chat", { chatId: params.chatID });
    };
  }, [socket, params.chatID, isConnected]);

  const handleChange = (
    event: ChangeEvent<HTMLTextAreaElement>
  ) => {
    setMessage(event.target.value);
  };
  const handleSubmit = (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    sendMessage();
  };
  const sendMessage = () => {
    if (!socket || !currentRecipientUser)
      return toast.error("Connection lost...");

    if (message.length === 0)
      return toast.error("Can't send empty message");

    socket.emit("send-message", {
      chatId: currentRecipientUser.id,
      recipientId: currentRecipientUser.recipientId,
      message,
    });
    setMessage("");
  };

  const scrollToBottom = () => {
    messagesListEnd.current?.scrollIntoView({
      behavior: "smooth",
    });
  };
  const scrollToUnread = () => {
    unreadMessages.current?.scrollIntoView({
      behavior: "smooth",
    });
  };

  const emitReadAll = () => {
    if (!socket || !currentRecipientUser)
      return toast.error("Connection lost...");

    socket.emit("read-messages", {
      chatId: currentRecipientUser.id,
    });
  };

  // Unread tracker
  useEffect(() => {
    if (messagesList) {
      const index = messagesList.findIndex(
        (message) =>
          message.senderId ===
            currentRecipientUser?.recipientId &&
          !message.recipients[0].isRead
      );
      if (index === -1) {
        setScrollbarAtEnd(true);
      }
      setStartOfUnread(index !== -1 ? index : null);
    }
  }, [messagesList]);

  // TODO - make the unread banner doesn't flash when the newest message makes the scrollbar be at end, make it so it stays there until new message or chat close
  // TODO - update the Message component read recipt after emitting a read all

  // Scroll useEffect
  useEffect(() => {
    if (messagesList) {
      if (startOfUnread !== null && !scrollbarAtEnd) {
        return scrollToUnread();
      }
      if (scrollbarAtEnd) {
        if (startOfUnread !== null) {
          emitReadAll();
          setStartOfUnread(null);
        }
        scrollToBottom();
      }
    }
  }, [scrollbarAtEnd, messagesList, startOfUnread]);

  const handleScroll: UIEventHandler<HTMLDivElement> = (
    event
  ) => {
    const clientHeight = event.currentTarget.clientHeight;
    const scrollLeftToTop = event.currentTarget.scrollTop;
    const totalScrollHeight =
      event.currentTarget.scrollHeight;
    setScrollbarAtEnd(
      clientHeight + scrollLeftToTop === totalScrollHeight
    );
  };

  if (!messagesList || !currentRecipientUser) {
    return (
      <div className="text-3xl bg-neutral-900 h-full">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="relative flex flex-col justify-between h-full bg-neutral-900 sm:border-l border-neutral-100 dark:border-neutral-500">
      {/* Go to bottom button */}
      {!scrollbarAtEnd && (
        <button
          type="button"
          onClick={scrollToBottom}
          className="absolute right-8 bottom-24 bg-neutral-600 hover:bg-neutral-700 rounded-full p-3 shadow-lg text-2xl"
        >
          <VscArrowDown />
        </button>
      )}
      {/* Header */}
      <div className="p-3 bg-neutral-800 border-b border-neutral-100 dark:border-neutral-500">
        <header className="flex justify-between items-center text-lg">
          {/* Back */}
          <Link to={"/"} className="p-2 pl-0">
            <VscArrowLeft />
          </Link>
          {/* User info */}
          <div className="flex-1">
            {/* TODO - add a chat mode to disable the modal inside and show online status */}
            <UserCard
              isInChat={true}
              user={currentRecipientUser}
            />
          </div>
          {/* Chat settings */}
          <button className="p-2 pr-0" type="button">
            <VscKebabVertical />
          </button>
        </header>
      </div>

      {/* Message list */}
      <div
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto overflow-x-hidden pb-2"
      >
        {messagesList.map((message, index, messages) => (
          <div key={message.id}>
            {/* Unread banner */}
            {startOfUnread === index && (
              <div
                ref={unreadMessages}
                id="unread-messages"
                className="w-full text-center mb-2 bg-neutral-800 select-none"
              >
                <p>Unread Messages &#8595;</p>
              </div>
            )}
            {/* Date banner */}
            {(index === 0 ||
              !isTheSameDay(
                message.createdAt,
                messagesList[index - 1].createdAt
              )) && (
              <p className="bg-neutral-800 px-4 py-1 mx-auto my-2 w-fit rounded-full select-none">
                {new Date(
                  message.createdAt
                ).toLocaleDateString("default", {
                  weekday: "short",
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            )}
            {/* Message */}
            <div className="px-2">
              <Message
                message={message}
                isLast={isLast(messages, index)}
                showTime={showMessageDate(messages, index)}
                isOwn={
                  message.senderId !==
                  currentRecipientUser.recipientId
                }
              />
            </div>
          </div>
        ))}
        {/* End tracker */}
        <div className="h-1" ref={messagesListEnd} />
      </div>

      {/* Text input */}
      <div className="p-2 ">
        <form
          onSubmit={handleSubmit}
          className="flex bg-neutral-800 rounded-full overflow-hidden"
        >
          <label htmlFor="message" className="sr-only">
            Message
          </label>
          <textarea
            className="bg-transparent w-full h-12 px-4 py-3 focus:outline-none resize-none"
            name="message"
            id="message"
            placeholder="Start a message"
            autoComplete="off"
            autoFocus
            value={message}
            onKeyDown={(event) => {
              if (
                event.nativeEvent.code === "Enter" &&
                !event.shiftKey
              ) {
                event.preventDefault();
                sendMessage();
              }
            }}
            onChange={handleChange}
          ></textarea>
          <button
            type="submit"
            className="bg-transparent hover:bg-neutral-700 flex justify-center items-center text-2xl text-white/75 w-20 hover:cursor-pointer"
          >
            <IoSend />
          </button>
        </form>
      </div>
    </div>
  );
}

export default Chat;
