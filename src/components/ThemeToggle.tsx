import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

export default function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");

    if (savedTheme === "dark") {
      document.documentElement.classList.add("dark");
      setDark(true);
    } else if (savedTheme === "light") {
      document.documentElement.classList.remove("dark");
      setDark(false);
    } else {
      // Default → Dark mode
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
      setDark(true);
    }
  }, []);

  const toggleTheme = () => {
    if (dark) {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
      setDark(false);
    } else {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
      setDark(true);
    }
  };

  return (
    <button
      onClick={toggleTheme}
      className="
  p-0 md:p-2
  bg-transparent md:bg-card
  border-0 md:border md:border-border
  rounded-none md:rounded-full
  hover:bg-transparent md:hover:bg-muted
  transition
"
    >
      {dark ? (
  <Sun className="w-4 h-4 md:w-5 md:h-5" />
) : (
  <Moon className="w-4 h-4 md:w-5 md:h-5" />
)}
    </button>
  );
}