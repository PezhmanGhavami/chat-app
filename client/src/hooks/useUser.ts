import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import fetcher from "../utils/fetcher";

interface IUser {
  isLoggedIn: boolean;
  userID: string;
  email: string;
  displayName: string;
  sessionId: string;
  profilePicture: string | null;
  username: string | null;
  bgColor: string;
}

export type TSession = {
  id: string;
  socketId: string;
  isOnline: boolean;
  lastOnline: Date | null;
  createdAt: Date;
};

const redirectRoutes = ["/auth/sign-in", "/auth/signup"];

const useUser = () => {
  const userData = useQuery<IUser, Error>({
    queryKey: ["user"],
    queryFn: () => fetcher("/api/auth"),
  });

  const location = useLocation();
  let navigate = useNavigate();

  useEffect(() => {
    if (
      userData.data?.isLoggedIn &&
      redirectRoutes.includes(location.pathname)
    ) {
      navigate("/", { replace: true });
    }
  }, [userData.data]);

  return userData;
};

const useSessions = () => {
  const user = useUser();
  return useQuery<TSession[], Error>({
    queryKey: ["sessions", "user", user.data?.userID],
    queryFn: () => fetcher("/api/auth/sessions"),
  });
};

type TUserUpdatePayload =
  | {
      bgColor?: string;
      displayName?: string;
      username?: string;
    }
  | {
      password: string;
      email?: string;
      newPassword?: string;
      newPasswordConfirmation?: string;
    };

const useUpdateUser = () => {
  const queryClient = useQueryClient();

  const headers = new Headers({
    "Content-Type": "application/json",
  });

  return useMutation<IUser, Error, TUserUpdatePayload>({
    mutationFn: (payload: TUserUpdatePayload) =>
      fetcher("/api/auth", {
        method: "PUT",
        headers,
        body: JSON.stringify(payload),
      }),

    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["user"] }),
  });
};

type TSignInPayload = {
  usernameOrEmail: string;
  password: string;
};

const useSignInUser = () => {
  const queryClient = useQueryClient();

  const headers = new Headers({
    "Content-Type": "application/json",
  });

  return useMutation<IUser, Error, TSignInPayload>({
    mutationFn: (payload: TSignInPayload) =>
      fetcher("/api/auth/sign-in", {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      }),

    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["user"] }),
  });
};

type TSignUpPayload = {
  email: string;
  displayName: string;
  password: string;
  confirmPassword: string;
};

const useRegisterUser = () => {
  const queryClient = useQueryClient();

  const headers = new Headers({
    "Content-Type": "application/json",
  });

  return useMutation<IUser, Error, TSignUpPayload>({
    mutationFn: (payload: TSignUpPayload) =>
      fetcher("/api/auth", {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      }),

    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["user"] }),
  });
};


const useTerminateSession = (id:string) => {
  const queryClient = useQueryClient();

  const headers = new Headers({
    "Content-Type": "application/json",
  });

  return useMutation<IUser, Error, TSignUpPayload>({
    mutationFn: (payload: TSignUpPayload) =>
      fetcher("/api/auth", {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      }),

    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["user"] }),
  });
};

export { useUser, useSignInUser, useRegisterUser, useUpdateUser, useSessions };
