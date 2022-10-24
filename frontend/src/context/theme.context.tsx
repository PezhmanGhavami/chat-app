import {
  useState,
  useEffect,
  createContext,
  ReactNode,
} from "react";

export const ThemeContext = createContext({
  theme: "light",
  changeTheme: () => {},
});

const detectBrowserTheme = () => {
  if (
    globalThis.matchMedia("(prefers-color-scheme: dark)")
      .matches
  ) {
    return "dark";
  }
  return "light";
};

const ThemeProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [theme, setTheme] = useState("");

  useEffect(() => {
    const savedTheme =
      globalThis.localStorage.getItem("theme");
    const initialTheme = savedTheme
      ? savedTheme
      : detectBrowserTheme();
    setTheme(initialTheme);
  }, []);

  useEffect(() => {
    if (theme === "dark") {
      globalThis.document.documentElement.classList.add(
        "dark"
      );
    } else {
      globalThis.document.documentElement.classList.remove(
        "dark"
      );
    }
  }, [theme]);

  const changeTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    globalThis.localStorage.setItem("theme", newTheme);
    setTheme(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, changeTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeProvider;
