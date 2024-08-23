import { useState, ChangeEvent, FormEvent } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";

import LoadingSpinner from "../../components/loading-spinner/loading-spinner.component";

import useUser from "../../hooks/useUser";

import fetcher from "../../utils/fetcher";

export const formStyles = {
  formContainer: "max-w-sm mx-auto",
  h2: "text-center text-2xl font-medium dark:font-normal pb-6",
  form: "w-11/12 mx-auto",
  inputsContainer: "mb-6 space-y-4",
  inputContainer: "group",
  colorAnimation: "transition-colors duration-150",
  get label() {
    return (
      "group-hover:text-blue-500 dark:group-hover:text-blue-400 group-focus-within:text-blue-500 dark:group-focus-within:text-blue-400 " +
      this.colorAnimation
    );
  },
  get input() {
    return (
      "w-full h-12 px-4 bg-transparent rounded-md border border-neutral-300 dark:border-neutral-700 group-hover:border-blue-600 focus:outline-none group-focus-within:border-blue-600 focus:ring-1 focus:ring-blue-600 " +
      this.colorAnimation
    );
  },
  get submitButton() {
    return (
      "w-full h-12 rounded-md bg-blue-600 hover:bg-blue-700 font-bold text-lg text-white " +
      this.colorAnimation
    );
  },
  get link() {
    return (
      "flex justify-center items-center text-blue-500 dark:text-blue-400 text-lg text-center mt-6 h-12 hover:bg-blue-900/10 rounded-md " +
      this.colorAnimation
    );
  },
};

const initialFormData = {
  usernameOrEmail: "",
  password: "",
};

enum inputStatus {
  EMPTY,
  VALID,
  INVALID,
}

const SignIn = () => {
  const [formData, setFormData] = useState(initialFormData);
  const [isLoading, setIsLoading] = useState(false);

  const { mutateUser } = useUser();

  const { usernameOrEmail, password } = formData;

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [event.target.name]: event.target.value,
    }));
  };

  // TODO - consider adding a live validator to the form

  const validateForm = (onSubmit: boolean = false) => {
    let formIsValid = true;
    let usernameOrEmailStatus = inputStatus.VALID;
    let passwordStatus = inputStatus.VALID;
    const emailRegex =
      /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;
    const usernameRegex = /^[a-z0-9_-]{3,20}$/i;

    if (
      usernameOrEmail === "" ||
      !usernameOrEmail ||
      (!emailRegex.test(usernameOrEmail) &&
        !usernameRegex.test(usernameOrEmail))
    ) {
      formIsValid = false;
      usernameOrEmailStatus =
        usernameOrEmail === "" || !usernameOrEmail
          ? inputStatus.EMPTY
          : inputStatus.INVALID;
      onSubmit &&
        toast.error(
          usernameOrEmailStatus === inputStatus.EMPTY
            ? "You should provide your username or email address."
            : "Invalid email address or username format.",
        );
    }

    if (password === "" || !password) {
      formIsValid = false;
      passwordStatus = inputStatus.EMPTY;
      onSubmit && toast.error("You should provide a password.");
    }

    return {
      formIsValid,
      usernameOrEmailStatus,
      passwordStatus,
    };
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!validateForm(true).formIsValid) {
      return;
    }

    setIsLoading(true);

    const userData = {
      usernameOrEmail,
      password,
    };

    const headers = new Headers({
      "Content-Type": "application/json",
    });
    try {
      mutateUser(
        await fetcher("/api/auth/sign-in", {
          method: "POST",
          headers,
          body: JSON.stringify(userData),
        }),
        false,
      );
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Something went wrong.");
      }
    }

    setIsLoading(false);
  };

  return (
    <div className={formStyles.formContainer}>
      <h2 className={formStyles.h2}>Sign in to Chat App</h2>
      <form onSubmit={handleSubmit} className={formStyles.form}>
        <div className={formStyles.inputsContainer}>
          <div className={formStyles.inputContainer}>
            <label
              className={formStyles.label}
              htmlFor="sign-in-username-or-email"
            >
              Username or email address
            </label>
            <input
              className={formStyles.input}
              type="text"
              name="usernameOrEmail"
              id="sign-in-username-or-email"
              value={usernameOrEmail}
              onChange={handleChange}
              autoFocus
              tabIndex={1}
            />
          </div>
          <div className={formStyles.inputContainer}>
            <label className={formStyles.label} htmlFor="sign-in-password">
              Password
            </label>
            <input
              className={formStyles.input}
              type="password"
              name="password"
              id="sign-in-password"
              value={password}
              onChange={handleChange}
              tabIndex={2}
            />
          </div>
        </div>
        <button className={formStyles.submitButton} type="submit" tabIndex={3}>
          {isLoading ? <LoadingSpinner /> : "Sign in"}
        </button>
        <Link to={"/auth/signup"} tabIndex={4} className={formStyles.link}>
          <span>or create a new account</span>
        </Link>
      </form>
    </div>
  );
};

export default SignIn;
