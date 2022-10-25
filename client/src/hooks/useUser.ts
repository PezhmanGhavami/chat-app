import { useEffect } from "react";
import { redirect, useLocation } from "react-router-dom";
import useSWR from "swr";

import fetcher from "../utils/fetcher";

interface IUser {
  isLoggedIn: boolean;
  userID: string;
}

const redirectRoutes = ["/auth/signin", "/auth/signup"];

export default function useUser() {
  const { data, mutate } = useSWR<IUser>(
    "/api/auth",
    fetcher
  );

  const location = useLocation();

  useEffect(() => {
    if (
      data?.isLoggedIn &&
      redirectRoutes.includes(location.pathname)
    ) {
      redirect("/");
    }
  }, [data]);

  return {
    user: data,
    mutateUser: mutate,
  };
}
