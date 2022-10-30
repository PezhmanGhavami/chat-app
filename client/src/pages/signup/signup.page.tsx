import { useState, ChangeEvent, FormEvent } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";

import LoadingSpinner from "../../components/loading-spinner/loading-spinner.component";

import useUser from "../../hooks/useUser";

import fetcher from "../../utils/fetcher";

import { authFormStyles } from "../signin/signin.page";

const initialFormData = {
  email: "",
  displayName: "",
  password: "",
  confirmPassword: "",
};

enum inputStatus {
  EMPTY,
  VALID,
  INVALID,
}

const Signup = () => {
  const [formData, setFormData] = useState(initialFormData);
  const [isLoading, setIsLoading] = useState(false);

  const { mutateUser } = useUser();

  const { email, displayName, password, confirmPassword } =
    formData;

  const handleChange = (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    setFormData((prev) => ({
      ...prev,
      [event.target.name]: event.target.value,
    }));
  };

  // TODO - consider adding a live validator to the form

  const validateForm = (onSubmit: boolean = false) => {
    let formIsValid = true;
    let emailStatus = inputStatus.VALID;
    let displayNameStatus = inputStatus.VALID;
    let passwordStatus = inputStatus.VALID;
    let confirmPasswordStatus = inputStatus.VALID;
    const emailRegex =
      /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;

    if (email === "" || !email || !emailRegex.test(email)) {
      formIsValid = false;
      emailStatus =
        email === "" || !email
          ? inputStatus.EMPTY
          : inputStatus.INVALID;
      onSubmit &&
        toast.error(
          emailStatus === inputStatus.EMPTY
            ? "You should provide an email address."
            : "Invalid email address."
        );
    }

    if (displayName === "" || !displayName) {
      formIsValid = false;
      displayNameStatus = inputStatus.EMPTY;
      onSubmit && toast.error("You should provide a name.");
    }

    if (password === "" || !password) {
      formIsValid = false;
      passwordStatus = inputStatus.EMPTY;
      onSubmit &&
        toast.error("You should provide a password.");
    }

    if (
      confirmPassword === "" ||
      !confirmPassword ||
      confirmPassword !== password
    ) {
      formIsValid = false;
      confirmPasswordStatus =
        password !== confirmPassword
          ? inputStatus.INVALID
          : inputStatus.EMPTY;

      onSubmit &&
        toast.error(
          confirmPasswordStatus === inputStatus.INVALID
            ? "Passwords should match."
            : "Please confirm your password before you continue."
        );
    }

    return {
      formIsValid,
      emailStatus,
      displayNameStatus,
      passwordStatus,
      confirmPasswordStatus,
    };
  };

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!validateForm(true).formIsValid) {
      return;
    }

    setIsLoading(true);

    const userData = {
      email,
      displayName,
      password,
      confirmPassword,
    };

    const headers = new Headers({
      "Content-Type": "application/json",
    });
    try {
      mutateUser(
        await fetcher("/api/auth/", {
          method: "POST",
          headers,
          body: JSON.stringify(userData),
        }),
        false
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
    <div className={authFormStyles.formContainer}>
      <h2 className={authFormStyles.h2}>
        Sign up to Chat App
      </h2>
      <form
        onSubmit={handleSubmit}
        className={authFormStyles.form}
      >
        <div className={authFormStyles.inputsContainer}>
          <div className={authFormStyles.inputContainer}>
            <label
              className={authFormStyles.label}
              htmlFor="signup-email"
            >
              Email address
            </label>
            <input
              className={authFormStyles.input}
              type="email"
              name="email"
              id="signup-email"
              value={email}
              onChange={handleChange}
              autoFocus
              tabIndex={1}
            />
          </div>
          <div className={authFormStyles.inputContainer}>
            <label
              className={authFormStyles.label}
              htmlFor="signup-display-name"
            >
              Display name
            </label>
            <input
              className={authFormStyles.input}
              type="text"
              name="displayName"
              id="signup-display-name"
              value={displayName}
              onChange={handleChange}
              tabIndex={2}
            />
          </div>
          <div className={authFormStyles.inputContainer}>
            <label
              className={authFormStyles.label}
              htmlFor="signup-password"
            >
              Password
            </label>
            <input
              className={authFormStyles.input}
              type="password"
              name="password"
              id="signup-password"
              value={password}
              onChange={handleChange}
              tabIndex={3}
            />
          </div>
          <div className={authFormStyles.inputContainer}>
            <label
              className={authFormStyles.label}
              htmlFor="signup-password-confirmation"
            >
              Confirm pasword
            </label>
            <input
              className={authFormStyles.input}
              type="password"
              name="confirmPassword"
              id="signup-password-confirmation"
              value={confirmPassword}
              onChange={handleChange}
              tabIndex={4}
            />
          </div>
        </div>
        <button
          className={authFormStyles.submitButton}
          type="submit"
          tabIndex={5}
        >
          {isLoading ? <LoadingSpinner /> : "Sign up"}
        </button>
        <Link
          to={"/auth/signup"}
          tabIndex={6}
          className={authFormStyles.link}
        >
          <span>or sign in to your account</span>
        </Link>
      </form>
    </div>
  );
};

export default Signup;
