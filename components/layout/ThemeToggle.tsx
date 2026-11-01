
"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

export default function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Wait until the browser can determine the theme.
    const frame = requestAnimationFrame(() =>
      setMounted(true)
    );

    return () => cancelAnimationFrame(frame);
  }, []);

  const isDark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      disabled={!mounted}
      onClick={() =>
        setTheme(isDark ? "light" : "dark")
      }
      aria-label={
        isDark
          ? "Switch to light mode"
          : "Switch to dark mode"
      }
      title={isDark ? "Light mode" : "Dark mode"}
      className="fixed bottom-5 left-5 z-50 flex h-12 w-12 items-center justify-center rounded-full border border-violet-200 bg-white text-violet-700 shadow-lg transition hover:scale-105 disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800 dark:text-violet-300"
    >
      {!mounted ? (
        <span className="h-5 w-5 rounded-full bg-slate-200" />
      ) : isDark ? (
        <Sun size={23} />
      ) : (
        <Moon size={23} />
      )}
    </button>
  );
}
