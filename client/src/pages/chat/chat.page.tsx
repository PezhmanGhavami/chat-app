import {
  useState,
  useEffect,
  ChangeEvent,
  FormEvent,
  useRef,
  useContext,
} from "react";
import { Link } from "react-router-dom";
import {
  VscArrowLeft,
  VscKebabVertical,
} from "react-icons/vsc";

import { WebSocketContext } from "../../context/websocket.context";

import UserCard from "../../components/user-card/user-card.component";

function Chat() {
  const [messagesList, setMessagesList] = useState<
    JSX.Element[]
  >([]);
  const [message, setMessage] = useState("");
  const messagesListEnd = useRef<null | HTMLDivElement>(
    null
  );

  const { isConnected } = useContext(WebSocketContext);

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

  const scrollToBottom = () => {
    messagesListEnd.current?.scrollIntoView({
      behavior: "smooth",
    });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messagesList]);

  return (
    <div className="flex flex-col justify-between h-full bg-neutral-900">
      {/* Header */}
      <div className="p-3 bg-neutral-800 border-b sm:border-l border-neutral-100 dark:border-neutral-500">
        <header className="flex justify-between ">
          {/* The menu */}
          <Link to={"/"} className="text-lg p-2 pl-0">
            <VscArrowLeft />
          </Link>
          {/* Connection status and search bar toggle*/}
          <div className="flex-1 text-lg w-full flex justify-between">
            <UserCard />
            <button type="button">
              <VscKebabVertical />
            </button>
          </div>
        </header>
      </div>

      {/* Message list */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        {messagesList.map((Tag, i) => (
          <div className="bg-neutral-600 my-2 px-7" key={i}>
            {Tag}
          </div>
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
            className="bg-neutral-800 w-full h-12 px-4"
            name="message"
            id="message"
            autoComplete="off"
            value={message}
            onKeyDown={(event) => {
              if (
                event.nativeEvent.code === "Enter" &&
                event.shiftKey
              ) {
                // TODO - Send message
              }
            }}
            onChange={handleChange}
          />
          <button
            type="submit"
            className="bg-green-700 h-12 w-1/6 hover:cursor-pointer"
            // onClick={sendMessage}
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}

export default Chat;
