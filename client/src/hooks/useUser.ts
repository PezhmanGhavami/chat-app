import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
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
  let navigate = useNavigate();

  useEffect(() => {
    if (
      data?.isLoggedIn &&
      redirectRoutes.includes(location.pathname)
    ) {
      navigate("/");
    }
  }, [data]);

  return {
    user: data,
    mutateUser: mutate,
  };
}
