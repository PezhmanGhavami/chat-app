const Pill = ({ text }: { text: string }) => {
  return (
    <p className="mx-auto my-2 w-fit select-none rounded-full bg-gray-100 px-4 py-1 dark:bg-neutral-800">
      {text}
    </p>
  );
};

export default Pill;
