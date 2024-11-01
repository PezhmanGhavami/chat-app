const fetcher = async (input: RequestInfo, init: RequestInit) => {
  const res = await fetch(input, init);

  if (!res.ok) {
    const resBody = await res.json();
    throw new Error(resBody.message);
  }

  return res.json();
};

export default fetcher;
