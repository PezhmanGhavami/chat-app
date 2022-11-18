const colors = [
  "from-pink-400 to-pink-600",
  "from-rose-400 to-rose-600",
  "from-emerald-400 to-emerald-600",
  "from-green-500 to-green-600",
  "from-teal-400 to-teal-700",
  "from-cyan-500 to-cyan-600",
  "from-blue-400 to-blue-600",
  "from-indigo-400 to-indigo-600",
  "from-orange-400 to-orange-600",
  "from-amber-400 to-amber-500",
];
const getRandomColor = () => {
  return colors[Math.floor(Math.random() * colors.length)];
};

export default getRandomColor;
