import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import useSWR from "swr";

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

const redirectRoutes = ["/auth/sign-in", "/auth/signup"];

function fetcher(url: string): Promise<IUser> {
  return fetch(url, {
    method: "GET",
    credentials: "include",
    headers: { "Access-Control-Allow-Credentials": "true" },
  }).then((res) => res.json());
}

export default function useUser() {
  const { data, mutate } = useSWR<IUser>(
    `${import.meta.env.VITE_SOCKET_URL}/api/auth`,
    fetcher,
  );

  const location = useLocation();
  let navigate = useNavigate();

  useEffect(() => {
    if (data?.isLoggedIn && redirectRoutes.includes(location.pathname)) {
      navigate("/", { replace: true });
    }
  }, [data]);

  return {
    user: data,
    mutateUser: mutate,
  };
}
