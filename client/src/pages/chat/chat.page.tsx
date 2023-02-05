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
import Pill from "../../components/pill/pill.component";
import ConfirmationModal from "../../components/confirmation-modal/confirmation-modal.component";

export interface IChatUser extends IUser {
  chatId: string;
  isArchived: boolean;
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
  index: number,
) => {
  if (messages.length - 1 === index) return true;
  const currentDate = new Date(messages[index].createdAt);
  const nextDate = new Date(messages[index + 1].createdAt);
  if (
    Math.floor(
      (nextDate.getTime() - currentDate.getTime()) / 1000,
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
    message.createdAt,
  ).toLocaleTimeString("default", {
    hour: "numeric",
    minute: "numeric",
  });

  return (
    <div>
      <div
        className={`mt-[2px] w-fit max-w-xs break-words rounded-2xl py-2 px-4 sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl 2xl:max-w-2xl ${
          isOwn
            ? `ml-auto bg-blue-600 text-white ${
                isLast || showTime ? "rounded-br-sm" : ""
              }`
            : `mr-auto bg-gray-200 dark:bg-neutral-600 ${
                isLast || showTime ? "rounded-bl-sm" : ""
              }`
        }`}
        key={message.id}
      >
        <p className="leading-tight">{message.body}</p>
      </div>
      {(isLast || showTime) && (
        <p
          className={`mb-2 block select-none pt-1 text-xs opacity-70 ${
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
  previousDateUnformatted: Date,
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
      messages[index + 1].createdAt,
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
  const [showGoToBottom, setShowGoToBottom] =
    useState(false);
  const [thereIsNoScrollbar, setThereIsNoScrollbar] =
    useState(false);
  const [scrollbarAtTop, setScrollbarAtTop] =
    useState(false);
  const [isLoadingMoreMessages, setIsLoadingMoreMessages] =
    useState(false);
  const [endOfMessages, setEndOfMessages] = useState(false);
  const [lastUpdateRequest, setLastUpdateRequest] =
    useState(0);
  const [openChatDeleteModal, setOpenChatDeleteModal] =
    useState(false);

  const messagesListEnd = useRef<null | HTMLDivElement>(
    null,
  );
  const unreadMessages = useRef<null | HTMLDivElement>(
    null,
  );
  const messagesListContainer =
    useRef<null | HTMLDivElement>(null);

  const { user: currentUser } = useUser();

  const { socket, isConnected } = useContext(
    WebSocketContext,
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
            !message.recipients[0].isRead,
        );
        if (index === -1) {
          setScrollbarAtEnd(true);
        }
        if (messages.length < 50) {
          setEndOfMessages(true);
        }
      },
    );
    // New message
    socket.on(
      `chat-${params.chatId}-new-message`,
      ({ message }) => {
        setMessagesList((prev) => [
          ...(prev as IMessage[]),
          message,
        ]);
        if (message.recipientId === currentUser?.userID) {
          socket.emit("read-messages", {
            chatId: params.chatId,
          });
          setAllToRead();
        }
      },
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
        })),
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
      },
    );
    // Error handler
    socket.on(
      `chat-${params.chatId}-error`,
      ({ status, errorMessasge }) => {
        toast.error(status + " - " + errorMessasge);
        navigate("/");
      },
    );
    // Recipient status change
    socket.on(
      `chat-${params.chatId}-recipient-status-change`,
      ({ isOnline }) => {
        setCurrentRecipientUser((prev) => ({
          ...prev!,
          isOnline,
        }));
      },
    );

    return () => {
      socket.off(`chat-${params.chatId}-init`);
      socket.off(`chat-${params.chatId}-error`);
      socket.off(`chat-${params.chatId}-new-message`);
      socket.off(`chat-${params.chatId}-messages-loader`);
      socket.off(`chat-${params.chatId}-read-all`);
      socket.off(
        `chat-${params.chatId}-recipient-status-change`,
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
          (message) => message.id === tempId,
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
      },
    );
    return () => {
      socket.off(`chat-${params.chatId}-delivered`);
    };
  }, [socket, messagesList]);

  const handleChange = (
    event: ChangeEvent<HTMLTextAreaElement>,
  ) => {
    setMessage(event.target.value);
  };
  const handleSubmit = (
    event: FormEvent<HTMLFormElement>,
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
          !message.recipients[0].isRead,
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
    event,
  ) => {
    const clientHeight = event.currentTarget.clientHeight;
    const scrollLeftToTop = event.currentTarget.scrollTop;
    const totalScrollHeight =
      event.currentTarget.scrollHeight;
    const sum = clientHeight + scrollLeftToTop;
    setScrollbarAtEnd(sum === totalScrollHeight);
    setShowGoToBottom(
      totalScrollHeight - sum > clientHeight / 2,
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
        clientHeight === totalScrollHeight,
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

  // TODO - add a prompt to confirm delete
  const deleteChatEmitter = (event: MouseEvent) => {
    event.preventDefault();
    if (!socket || !currentRecipientUser)
      return toast.error(
        "Connection lost.\n please retry after connection is restablished.",
      );

    socket.emit("delete-chat", {
      chatId: currentRecipientUser.chatId,
    });

    navigate("/");
  };
  const toggleChatDeleteModal = () => {
    setOpenChatDeleteModal(true);
  };
  const closeChatDeleteModal = (event: MouseEvent) => {
    event.stopPropagation();
    setOpenChatDeleteModal(false);
  };

  const archiveChatEmitter = (
    event: MouseEvent<HTMLAnchorElement>,
  ) => {
    event.preventDefault();
    if (!socket || !currentRecipientUser)
      return toast.error(
        "Connection lost.\n please retry after connection is restablished.",
      );

    socket.emit("archive-chat", {
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
      <div className="h-full bg-white text-3xl dark:bg-neutral-900">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="relative flex h-full flex-col justify-between overflow-x-hidden bg-white dark:bg-neutral-900">
      {/* Go to bottom button */}
      {showGoToBottom && (
        <button
          type="button"
          title="Click to go to bottom"
          onClick={scrollToBottom}
          className="absolute right-8 bottom-24 z-20 rounded-full border-2 bg-white p-3 text-2xl hover:bg-gray-200 dark:border-0 dark:bg-neutral-600 dark:hover:bg-neutral-700"
        >
          <VscArrowDown />
        </button>
      )}
      {/* Header */}
      <div className="border-b border-neutral-300 bg-white p-3 pr-1 shadow dark:border-neutral-500 dark:bg-neutral-800">
        <header className="flex items-center justify-between text-lg">
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
              isReconnecting={!isConnected}
              user={currentRecipientUser}
            />
          </div>
          {/* Chat options */}
          <button
            title="Chat options"
            type="button"
            className="group relative rounded-full p-2 focus:bg-gray-200 dark:focus:bg-neutral-700 "
          >
            <div className="flex h-4 w-4 flex-col items-center justify-center space-y-[3px]">
              <div className="h-[3px] w-[3px] rounded-full bg-neutral-900 dark:bg-white" />
              <div className="h-[3px] w-[3px] rounded-full bg-neutral-900 dark:bg-white" />
              <div className="h-[3px] w-[3px] rounded-full bg-neutral-900 dark:bg-white" />
            </div>
            {/* Content */}
            <div className="invisible absolute top-9 right-0 z-20 flex flex-col whitespace-nowrap rounded-lg border bg-white py-2 text-lg shadow-md group-focus-within:visible group-active:visible dark:border-neutral-600 dark:bg-neutral-800 sm:text-base">
              <a
                title="Click to delete chat"
                onClick={archiveChatEmitter}
                className="flex items-center space-x-1 px-5 py-2 hover:bg-gray-200 dark:hover:bg-neutral-700 sm:px-2 sm:py-1"
              >
                <VscArchive />
                <span>
                  {currentRecipientUser.isArchived
                    ? "Unarchive chat"
                    : "Archive chat"}
                </span>
              </a>
              <a
                title="Click to delete chat"
                onClick={toggleChatDeleteModal}
                className="flex items-center space-x-1 px-5 py-2 text-red-600 hover:bg-gray-200 dark:text-red-500 dark:hover:bg-neutral-700 sm:px-2 sm:py-1"
              >
                <VscTrash />
                <span>Delete chat</span>
              </a>
            </div>
          </button>
        </header>
        {openChatDeleteModal && (
          <ConfirmationModal
            message="By confirming, this chat will be deleted for all chat members."
            closeModal={closeChatDeleteModal}
            confirmModal={deleteChatEmitter}
          />
        )}
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

        {/* End of messages */}
        {endOfMessages && (
          <div className="text-xs font-medium">
            <Pill text="Chat Started" />
            {messagesList.length === 0 && (
              <Pill
                text={new Date(
                  currentRecipientUser.chatCreated,
                ).toLocaleDateString("default", {
                  weekday: "short",
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })}
              />
            )}
          </div>
        )}

        {/* Message list */}
        {messagesList.map((message, index, messages) => (
          <div id={message.id} key={message.id}>
            {/* Date banner */}
            {(index === 0 ||
              !isTheSameDay(
                message.createdAt,
                messagesList[index - 1].createdAt,
              )) && (
              <div className="text-xs font-medium">
                <Pill
                  text={new Date(
                    message.createdAt,
                  ).toLocaleDateString("default", {
                    weekday: "short",
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })}
                />
              </div>
            )}
            {/* Unread banner */}
            {startOfUnread === index && (
              <div
                ref={unreadMessages}
                id="unread-messages"
                className="my-2 w-full select-none bg-gray-100 text-center dark:bg-neutral-800"
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
      <form
        onSubmit={handleSubmit}
        className="flex overflow-hidden border-t border-t-neutral-300 bg-white transition-all duration-200 dark:border-t-neutral-500 dark:bg-neutral-800"
      >
        <label htmlFor="message" className="sr-only">
          Message
        </label>
        <textarea
          className="h-12 w-full resize-none bg-transparent px-5 py-3 outline-none transition-all duration-200 focus-within:h-28 focus:outline-none"
          name="message"
          id="message"
          placeholder="Write a message"
          autoComplete="off"
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
          className={`mr-2 mb-2 self-end rounded-full p-2 text-lg transition-all duration-200${
            message.length > 0
              ? " bg-blue-600 text-white hover:bg-blue-700"
              : " text-blue-600 dark:text-blue-500"
          }`}
        >
          <BsFillCursorFill className="rotate-45" />
        </button>
      </form>
    </div>
  );
}

export default Chat;
