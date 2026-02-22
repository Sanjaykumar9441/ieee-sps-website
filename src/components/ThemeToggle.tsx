import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

export default function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
  const savedTheme = localStorage.getItem("theme");

  if (savedTheme) {
    document.documentElement.classList.toggle("dark", savedTheme === "dark");
  } else {
    // ✅ Force dark mode by default
    document.documentElement.classList.add("dark");
    localStorage.setItem("theme", "dark");
  }
}, []);

  const toggleTheme = () => {
  const isDark = document.documentElement.classList.contains("dark");

  if (isDark) {
    document.documentElement.classList.remove("dark");
    localStorage.setItem("theme", "light");
  } else {
    document.documentElement.classList.add("dark");
    localStorage.setItem("theme", "dark");
  }
};

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-full border border-border bg-card hover:bg-muted transition"
    >
      {dark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}