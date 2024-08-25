const fetcher = async <TResponse>(input: RequestInfo, init?: RequestInit) => {
  const res = await fetch(input, init);

  if (!res.ok) {
    const resBody = await res.json();
    throw new Error(resBody.message);
  }

  return (await res.json()) as TResponse;
};

export default fetcher;
