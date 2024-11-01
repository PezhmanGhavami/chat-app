const fetcher = async (input: RequestInfo, init: RequestInit) => {
  console.log(`${import.meta.env.VITE_SOCKET_URL}${input}`);
  const res = await fetch(`${import.meta.env.VITE_SOCKET_URL}${input}`, init);

  if (!res.ok) {
    const resBody = await res.json();
    throw new Error(resBody.message);
  }

  return res.json();
};

export default fetcher;
