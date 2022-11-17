import {
  useState,
  useEffect,
  ChangeEvent,
  FormEvent,
  MouseEvent,
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
  VscArchive,
  VscTrash,
} from "react-icons/vsc";
import { BsFillCursorFill } from "react-icons/bs";

import { WebSocketContext } from "../../context/websocket.context";

import useUser from "../../hooks/useUser";

import UserCard, {
  IUser,
} from "../../components/user-card/user-card.component";
import LoadingSpinner from "../../components/loading-spinner/loading-spinner.component";

export interface IChatUser extends IUser {
  chatId: string;
  chatCreated: Date;
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
  isLocal?: boolean;
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
        className={`w-fit max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl 2xl:max-w-2xl mt-[2px] py-2 px-4 rounded-2xl break-words ${
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
              {message.isLocal
                ? " . Sending"
                : message.recipients[0].isRead
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

const Pill = ({ text }: { text: string }) => {
  return (
    <p className="bg-neutral-800 px-4 py-1 mx-auto my-2 w-fit rounded-full select-none">
      {text}
    </p>
  );
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
  const [showGoToBottom, setShowGoToBottom] =
    useState(false);
  const [thereIsNoScrollbar, setThereIsNoScrollbar] =
    useState(false);
  // TODO - use this to load more messages
  const [scrollbarAtTop, setScrollbarAtTop] =
    useState(false);
  const [isLoadingMoreMessages, setIsLoadingMoreMessages] =
    useState(false);
  const [endOfMessages, setEndOfMessages] = useState(false);
  const [lastUpdateRequest, setLastUpdateRequest] =
    useState(0);

  const messagesListEnd = useRef<null | HTMLDivElement>(
    null
  );
  const unreadMessages = useRef<null | HTMLDivElement>(
    null
  );
  const messagesListContainer =
    useRef<null | HTMLDivElement>(null);

  const { user: currentUser } = useUser();

  const { socket, isConnected } = useContext(
    WebSocketContext
  );

  const params = useParams();
  const navigate = useNavigate();

  // Chat initializer
  // join emit - leave emit
  // init data listener - internal error listener
  useEffect(() => {
    if (!socket || !params.chatId || !isConnected) return;

    socket.emit("joined-chat", { chatId: params.chatId });
    // Init
    socket.on(
      `chat-${params.chatId}-init`,
      ({ recipientUser, messages }) => {
        setCurrentRecipientUser(recipientUser);
        setMessagesList(messages.reverse());

        const index = (messages as IMessage[]).findIndex(
          (message) =>
            message.senderId === currentRecipientUser?.id &&
            !message.recipients[0].isRead
        );
        if (index === -1) {
          setScrollbarAtEnd(true);
        }
        if (messages.length < 50) {
          setEndOfMessages(true);
        }
      }
    );
    // New message
    socket.on(
      `chat-${params.chatId}-new-message`,
      ({ message }) => {
        socket.emit("read-messages", {
          chatId: params.chatId,
        });
        setMessagesList((prev) => [
          ...(prev as IMessage[]),
          message,
        ]);
        setAllToRead();
      }
    );
    // Read all handler
    socket.on(`chat-${params.chatId}-read-all`, () => {
      setMessagesList((prev) =>
        (prev as IMessage[]).map((message) => ({
          ...message,
          recipients: [
            {
              isRead: true,
              recipientId:
                message.recipients[0].recipientId,
            },
          ],
        }))
      );
    });
    // Message loader (Loading older messages)
    socket.on(
      `chat-${params.chatId}-messages-loader`,
      ({ messages, endOfMessages, lastMessageId }) => {
        messages.reverse();

        setMessagesList((prev) => {
          return [...messages, ...prev!];
        });

        const lastEelementBeforeUpdate =
          document.getElementById(lastMessageId);
        lastEelementBeforeUpdate?.scrollIntoView();

        setLastUpdateRequest(Date.now());
        setIsLoadingMoreMessages(false);
        setEndOfMessages(endOfMessages);
      }
    );
    // Error handler
    socket.on(
      `chat-${params.chatId}-error`,
      ({ status, errorMessasge }) => {
        toast.error(status + " - " + errorMessasge);
        navigate("/");
      }
    );
    // Recipient status change
    socket.on(
      `chat-${params.chatId}-recipient-status-change`,
      ({ isOnline }) => {
        setCurrentRecipientUser((prev) => ({
          ...prev!,
          isOnline,
        }));
      }
    );

    return () => {
      socket.off(`chat-${params.chatId}-init`);
      socket.off(`chat-${params.chatId}-error`);
      socket.off(`chat-${params.chatId}-new-message`);
      socket.off(`chat-${params.chatId}-messages-loader`);
      socket.off(`chat-${params.chatId}-read-all`);
      socket.off(
        `chat-${params.chatId}-recipient-status-change`
      );
      socket.emit("left-chat", { chatId: params.chatId });
    };
  }, [socket, params.chatId, isConnected]);

  // Delivered useEffect
  useEffect(() => {
    if (!messagesList || !socket) return;
    socket.on(
      `chat-${params.chatId}-delivered`,
      ({ tempId, actualId }) => {
        const messageIndex = messagesList?.findIndex(
          (message) => message.id === tempId
        );
        if (
          messageIndex !== undefined &&
          messageIndex !== -1
        ) {
          const newArr = [...(messagesList as IMessage[])];
          newArr[messageIndex].id = actualId;
          delete newArr[messageIndex].isLocal;
          setMessagesList(newArr);
        }
      }
    );
    return () => {
      socket.off(`chat-${params.chatId}-delivered`);
    };
  }, [socket, messagesList]);

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

    const tempId = Date.now().toString();

    socket.emit("send-message", {
      chatId: currentRecipientUser.chatId,
      recipientId: currentRecipientUser.id,
      message,
      tempId,
    });

    const newMessage: IMessage = {
      body: message,
      id: tempId,
      senderId: currentUser!.userID,
      recipients: [
        {
          isRead: false,
          recipientId: currentRecipientUser.id,
        },
      ],
      chatId: currentRecipientUser.chatId,
      isLocal: true,
      createdAt: new Date(Date.now()),
      updatedAt: new Date(Date.now()),
    };

    setMessagesList((prev) => [
      ...(prev as IMessage[]),
      newMessage,
    ]);

    setAllToRead();
    setMessage("");
  };

  const scrollToBottom = () => {
    messagesListEnd.current?.scrollIntoView({
      behavior: "smooth",
    });
  };

  const emitReadAll = () => {
    if (!socket || !currentRecipientUser)
      return toast.error("Connection lost...");

    socket.emit("read-messages", {
      chatId: currentRecipientUser.chatId,
    });
  };

  const setAllToRead = () => {
    setMessagesList((prev) => {
      if (!prev) {
        return null;
      }
      return prev.map((message) => {
        if (
          message.senderId !== currentUser!.userID &&
          !message.recipients[0].isRead
        ) {
          return {
            ...message,
            recipients: [
              {
                isRead: true,
                recipientId:
                  message.recipients[0].recipientId,
              },
            ],
          };
        }
        return { ...message };
      });
    });
  };

  useEffect(() => {
    if (messagesList) {
      const index = messagesList.findIndex(
        (message) =>
          message.senderId === currentRecipientUser?.id &&
          !message.recipients[0].isRead
      );
      setStartOfUnread(index !== -1 ? index : null);
    }
  }, [messagesList]);

  // Auto scroll useEffect
  useEffect(() => {
    if (messagesList) {
      if (thereIsNoScrollbar) {
        if (startOfUnread !== null) {
          emitReadAll();
        }
        return;
      }
      if (startOfUnread !== null && !scrollbarAtEnd) {
        unreadMessages.current?.scrollIntoView();
        return;
      }
      if (scrollbarAtEnd) {
        if (startOfUnread !== null) {
          emitReadAll();
        }
        messagesListEnd.current?.scrollIntoView();
      }
    }
  }, [
    scrollbarAtEnd,
    thereIsNoScrollbar,
    messagesList,
    startOfUnread,
  ]);

  const handleScroll: UIEventHandler<HTMLDivElement> = (
    event
  ) => {
    const clientHeight = event.currentTarget.clientHeight;
    const scrollLeftToTop = event.currentTarget.scrollTop;
    const totalScrollHeight =
      event.currentTarget.scrollHeight;
    const sum = clientHeight + scrollLeftToTop;
    setScrollbarAtEnd(sum === totalScrollHeight);
    setShowGoToBottom(
      totalScrollHeight - sum > clientHeight / 2
    );
    setScrollbarAtTop(scrollLeftToTop === 0);
  };

  // no scrollbar useEffect
  useEffect(() => {
    if (messagesListContainer.current) {
      const clientHeight =
        messagesListContainer.current.clientHeight;
      const totalScrollHeight =
        messagesListContainer.current.scrollHeight;

      setThereIsNoScrollbar(
        clientHeight === totalScrollHeight
      );
    }
  }, [
    messagesListContainer.current,
    messagesListContainer.current?.scrollHeight,
  ]);

  // Load more messages useEffect
  useEffect(() => {
    if (!messagesList || !socket || !currentRecipientUser)
      return;
    const currentTime = Date.now();
    if (
      scrollbarAtTop &&
      !endOfMessages &&
      currentTime - lastUpdateRequest > 1000
    ) {
      setIsLoadingMoreMessages(true);
      socket.emit("load-more", {
        chatId: currentRecipientUser.chatId,
        lastMessageId: messagesList[0].id,
      });
    }
  }, [
    scrollbarAtTop,
    endOfMessages,
    messagesList,
    socket,
    currentRecipientUser,
  ]);

  const deleteChatEmitter = (
    event: MouseEvent<HTMLAnchorElement>
  ) => {
    event.preventDefault();
    if (!socket || !currentRecipientUser)
      return toast.error(
        "Connection lost.\n please retry after connection is restablished."
      );

    socket.emit("delete-chat", {
      chatId: currentRecipientUser.chatId,
    });

    navigate("/");
  };

  if (
    !messagesList ||
    !currentRecipientUser ||
    !currentUser
  ) {
    return (
      <div className="text-3xl bg-neutral-900 h-full">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="relative overflow-x-hidden flex flex-col justify-between h-full bg-neutral-900 sm:border-l border-neutral-100 dark:border-neutral-500">
      {/* Go to bottom button */}
      {showGoToBottom && (
        <button
          type="button"
          onClick={scrollToBottom}
          className="absolute right-8 bottom-24 bg-neutral-600 hover:bg-neutral-700 rounded-full p-3 shadow-lg text-2xl"
        >
          <VscArrowDown />
        </button>
      )}
      {/* Header */}
      <div className="p-3 pr-1 bg-neutral-800 border-b border-neutral-100 dark:border-neutral-500">
        <header className="flex justify-between items-center text-lg">
          {/* Back */}
          <Link
            to={"/"}
            title="Close chat"
            className="p-2 pl-0"
          >
            <VscArrowLeft />
          </Link>
          {/* User info */}
          <div className="flex-1">
            <UserCard
              isInChat={true}
              user={currentRecipientUser}
            />
          </div>
          {/* Chat settings */}
          <button
            type="button"
            className="relative rounded-full focus:bg-neutral-700 group p-2 "
          >
            <div className="w-4 h-4 space-y-[3px] flex flex-col justify-center items-center">
              <div className="w-[3px] h-[3px] rounded-full bg-white" />
              <div className="w-[3px] h-[3px] rounded-full bg-white" />
              <div className="w-[3px] h-[3px] rounded-full bg-white" />
            </div>
            {/* Content */}
            <div className="invisible absolute top-9 right-0 text-lg sm:text-base whitespace-nowrap flex flex-col bg-neutral-50 dark:bg-neutral-800 shadow-md rounded-lg border dark:border-neutral-600 py-2 z-20 group-focus-within:visible group-active:visible">
              <a
                title="Click to delete chat"
                onClick={(e) => e.preventDefault()}
                className="px-5 py-2 sm:px-2 sm:py-1 hover:bg-neutral-700 space-x-1 flex items-center"
              >
                <VscArchive />
                <span>Archive chat</span>
              </a>
              <a
                title="Click to delete chat"
                onClick={deleteChatEmitter}
                className="px-5 py-2 sm:px-2 sm:py-1 text-red-500 hover:bg-neutral-700 space-x-1 flex items-center"
              >
                <VscTrash />
                <span>Delete chat</span>
              </a>
            </div>
          </button>
        </header>
      </div>

      {/* Message loading indicator */}
      <div
        ref={messagesListContainer}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto overflow-x-hidden pb-2"
      >
        {isLoadingMoreMessages && (
          <div className="py-10 text-3xl">
            <LoadingSpinner />
          </div>
        )}

        {/* Message list */}
        {messagesList.map((message, index, messages) => (
          <div id={message.id} key={message.id}>
            {/* Date banner */}
            {(index === 0 ||
              !isTheSameDay(
                message.createdAt,
                messagesList[index - 1].createdAt
              )) && (
              <>
                {/* End of messages */}
                {endOfMessages && (
                  <Pill text="Chat Started" />
                )}
                <Pill
                  text={new Date(
                    message.createdAt
                  ).toLocaleDateString("default", {
                    weekday: "short",
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })}
                />
              </>
            )}
            {/* Unread banner */}
            {startOfUnread === index && (
              <div
                ref={unreadMessages}
                id="unread-messages"
                className="w-full text-center my-2 bg-neutral-800 select-none"
              >
                <p>Unread Messages &#8595;</p>
              </div>
            )}
            {/* Message */}
            <div className="px-2">
              <Message
                message={message}
                isLast={isLast(messages, index)}
                showTime={showMessageDate(messages, index)}
                isOwn={
                  message.senderId !==
                  currentRecipientUser.id
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
            className="bg-transparent w-full h-12 px-5 py-3 focus:outline-none resize-none"
            name="message"
            id="message"
            placeholder="Write a message"
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
            title="Send message"
            className="bg-transparent hover:bg-neutral-700 flex justify-center items-center text-2xl text-white/75 w-20 hover:cursor-pointer"
          >
            <BsFillCursorFill className="rotate-45" />
          </button>
        </form>
      </div>
    </div>
  );
}

export default Chat;
