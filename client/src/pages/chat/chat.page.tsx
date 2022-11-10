import {
  useState,
  useEffect,
  ChangeEvent,
  FormEvent,
  useRef,
  useContext,
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
}

const Message = ({
  message,
  isOwn,
}: {
  message: IMessage;
  isOwn: boolean;
}) => {
  const messageTime = new Date(
    message.createdAt
  ).toLocaleTimeString("default", {
    hour: "numeric",
    minute: "numeric",
  });
  return (
    <div
      className={`w-fit max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl 2xl:max-w-2xl my-1 py-2 px-4 rounded-lg break-words ${
        isOwn
          ? "bg-blue-600 rounded-br-none self-end"
          : "bg-neutral-600 rounded-bl-none self-start"
      }`}
      key={message.id}
    >
      <p className="leading-tight">
        {message.body}{" "}
        <span className="pl-4 pt-2 text-xs text-white/90 float-right">
          {messageTime}
        </span>
      </p>
    </div>
  );
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
  const messagesListEnd = useRef<null | HTMLDivElement>(
    null
  );

  const socket = useContext(WebSocketContext);

  const params = useParams();
  const navigate = useNavigate();

  // Chat initializer
  // join emit - leave emit
  // init data listener - internal error listener
  useEffect(() => {
    if (!socket || !params.chatID) return;

    socket.emit("joined-chat", { chatId: params.chatID });

    socket.on(
      `chat-${params.chatID}-init`,
      ({ recipientUser, messages }) => {
        setCurrentRecipientUser(recipientUser);
        setMessagesList(messages);
      }
    );

    socket.on(
      `chat-${params.chatID}-new-message`,
      ({ message }) => {
        setMessagesList((prev) => [
          message,
          ...(prev as IMessage[]),
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
  }, [socket, params.chatID]);

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
    scrollToBottom();
  }, [messagesList]);

  if (!messagesList || !currentRecipientUser) {
    return (
      <div className="py-80 text-3xl">
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
      <div className="flex-1 flex flex-col-reverse overflow-y-auto overflow-x-hidden px-2 pb-2">
        {messagesList.map((message) => (
          <Message
            key={message.id}
            message={message}
            isOwn={
              message.senderId !==
              currentRecipientUser.recipientId
            }
          />
        ))}
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
