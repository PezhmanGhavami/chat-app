const Pill = ({ text }: { text: string }) => {
  return (
    <p className="bg-gray-100 dark:bg-neutral-800 px-4 py-1 mx-auto my-2 w-fit rounded-full select-none">
      {text}
    </p>
  );
};

export default Pill;
