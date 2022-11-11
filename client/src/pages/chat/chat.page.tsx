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
  VscKebabVertical,
} from "react-icons/vsc";

import { WebSocketContext } from "../../context/websocket.context";

import UserCard, {
  IUser,
} from "../../components/user-card/user-card.component";
import LoadingSpinner from "../../components/loading-spinner/loading-spinner.component";

interface IMessage {
  id: string;
  body: string;
  chatId: string;
  senderId: string;
  createdAt: string;
  updatedAt: string;
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
                isLast || showTime ? "rounded-br-none" : ""
              }`
            : `bg-neutral-600 mr-auto ${
                isLast || showTime ? "rounded-bl-none" : ""
              }`
        }`}
        key={message.id}
      >
        <p className="leading-tight">{message.body}</p>
      </div>
      {(isLast || showTime) && (
        <p
          className={`block text-xs pt-1 select-none text-white/90 mb-2 ${
            isOwn ? "text-right" : "text-left"
          }`}
        >
          {messageTime}{" "}
          {isOwn && (
            <span className="border-l pl-1">
              {message.recipients[0].isRead
                ? "Read"
                : "Delivered"}
            </span>
          )}
        </p>
      )}
    </div>
  );
};

const isTheSameDay = (
  currentDateUnformatted: string,
  previousDateUnformatted: string
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
    useState<(IUser & { recipientId: string }) | null>(
      null
    );
  const [messagesList, setMessagesList] = useState<
    IMessage[] | null
  >(null);
  const [message, setMessage] = useState("");
  const [autoScroll, setAutoScroll] = useState(true);

  const messagesListEnd = useRef<null | HTMLDivElement>(
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
          ...(prev?.reverse() as IMessage[]),
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
    event: ChangeEvent<HTMLInputElement>
  ) => {
    setMessage(event.target.value);
  };
  const handleSubmit = (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
  };
  const sendMessage = () => {
    if (!socket || !currentRecipientUser)
      return toast.error("Connection lost...");

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

  useEffect(() => {
    if (autoScroll) scrollToBottom();
  }, [messagesList, autoScroll]);

  const handleScroll: UIEventHandler<HTMLDivElement> = (
    event
  ) => {
    const clientHeight = event.currentTarget.clientHeight;
    const scrollLeftToTop = event.currentTarget.scrollTop;
    const totalScrollHeight =
      event.currentTarget.scrollHeight;
    setAutoScroll(
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
    <div className="flex flex-col justify-between h-full bg-neutral-900">
      {/* Header */}
      <div className="p-3 bg-neutral-800 border-b sm:border-l border-neutral-100 dark:border-neutral-500">
        <header className="flex justify-between items-center text-lg">
          {/* The menu */}
          <Link to={"/"} className="p-2 pl-0">
            <VscArrowLeft />
          </Link>
          {/* Connection status and search bar toggle*/}
          <div className="flex-1">
            <UserCard user={currentRecipientUser} />
          </div>
          <button className="p-2 pr-0" type="button">
            <VscKebabVertical />
          </button>
        </header>
      </div>

      {/* Message list */}
      <div
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto overflow-x-hidden px-2 pb-2"
      >
        {messagesList.map((message, index, messages) =>
          index !== 0 &&
          isTheSameDay(
            message.createdAt,
            messagesList[index - 1].createdAt
          ) ? (
            <Message
              key={message.id}
              message={message}
              isLast={isLast(messages, index)}
              showTime={showMessageDate(messages, index)}
              isOwn={
                message.senderId !==
                currentRecipientUser.recipientId
              }
            />
          ) : (
            <div key={message.id}>
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
          )
        )}
        <div className="h-1" ref={messagesListEnd} />
      </div>

      {/* Text input */}
      <div>
        <form onSubmit={handleSubmit} className="flex">
          <label htmlFor="message" className="sr-only">
            Message
          </label>
          <input
            className="bg-neutral-800 w-full h-12 px-4 focus:outline-none"
            name="message"
            id="message"
            autoComplete="off"
            autoFocus
            value={message}
            onKeyDown={(event) => {
              if (
                event.nativeEvent.code === "Enter" &&
                event.shiftKey
              ) {
                sendMessage();
              }
            }}
            onChange={handleChange}
          />
          <button
            type="button"
            className="bg-green-700 h-12 w-1/6 hover:cursor-pointer"
            onClick={sendMessage}
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}

export default Chat;
