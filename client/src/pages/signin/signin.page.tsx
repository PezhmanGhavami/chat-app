import { useState, ChangeEvent } from "react";
import { Link } from "react-router-dom";

export const authFormStyles = {
  formContainer: "max-w-sm mx-auto",
  h2: "text-center text-2xl pb-6",
  form: "w-11/12 mx-auto",
  inputsContainer: "mb-6 space-y-4",
  inputContainer: "group",
  colorAnimation: "transition-colors duration-150",
  get label() {
    return (
      "group-hover:text-blue-400 group-focus-within:text-blue-400 " +
      this.colorAnimation
    );
  },
  get input() {
    return (
      "w-full h-12 px-4 bg-transparent rounded-md border border-neutral-100 dark:border-neutral-700 group-hover:border-blue-600 focus:outline-none group-focus-within:border-blue-600 focus:ring-1 focus:ring-blue-600 " +
      this.colorAnimation
    );
  },
  get submitButton() {
    return (
      "w-full h-12 rounded-md bg-blue-600 hover:bg-blue-700 font-bold text-lg " +
      this.colorAnimation
    );
  },
  get link() {
    return (
      "flex justify-center items-center text-blue-400 text-lg text-center mt-6 h-12 hover:bg-blue-900/10 rounded-md " +
      this.colorAnimation
    );
  },
};

const initialFormData = {
  usernameOrEmail: "",
  password: "",
};

const Signin = () => {
  const [formData, setFormData] = useState(initialFormData);

  const { usernameOrEmail, password } = formData;

  const handleChange = (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    setFormData((prev) => ({
      ...prev,
      [event.target.name]: event.target.value,
    }));
  };

  return (
    <div className={authFormStyles.formContainer}>
      <h2 className={authFormStyles.h2}>
        Sign in to Chat App
      </h2>
      <form className={authFormStyles.form}>
        <div className={authFormStyles.inputsContainer}>
          <div className={authFormStyles.inputContainer}>
            <label
              className={authFormStyles.label}
              htmlFor="signin-username-or-password"
            >
              Username or email address
            </label>
            <input
              className={authFormStyles.input}
              type="text"
              name="usernameOrEmail"
              id="signin-username-or-password"
              value={usernameOrEmail}
              onChange={handleChange}
            />
          </div>
          <div className={authFormStyles.inputContainer}>
            <label
              className={authFormStyles.label}
              htmlFor="signin-password"
            >
              Password
            </label>
            <input
              className={authFormStyles.input}
              type="password"
              name="password"
              id="signin-password"
              value={password}
              onChange={handleChange}
            />
          </div>
        </div>
        <button
          className={authFormStyles.submitButton}
          type="submit"
        >
          Sign in
        </button>
        <Link
          to={"/auth/signup"}
          className={authFormStyles.link}
        >
          <span>or create a new account</span>
        </Link>
      </form>
    </div>
  );
};

export default Signin;
