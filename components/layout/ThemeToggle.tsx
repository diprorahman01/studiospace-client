
"use client";

import { useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

const emptySubscribe = () => () => {};

function useIsMounted() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}

export default function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();

  const mounted = useIsMounted();

  const isDark = mounted && resolvedTheme === "dark";

  function handleThemeToggle() {
    if (!mounted) return;

    setTheme(isDark ? "light" : "dark");
  }

  return (
    <button
      type="button"
      disabled={!mounted}
      onClick={handleThemeToggle}
      aria-label={
        !mounted
          ? "Change color theme"
          : isDark
            ? "Switch to light mode"
            : "Switch to dark mode"
      }
      title={
        !mounted
          ? "Change color theme"
          : isDark
            ? "Light mode"
            : "Dark mode"
      }
      className="fixed bottom-5 left-5 z-50 flex h-12 w-12 items-center justify-center rounded-full border border-violet-200 bg-white text-violet-700 shadow-lg transition hover:scale-105 disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800 dark:text-violet-300"
    >
      {!mounted ? (
        <span
          aria-hidden="true"
          className="h-5 w-5 rounded-full bg-violet-200"
        />
      ) : isDark ? (
        <Sun size={23} aria-hidden="true" />
      ) : (
        <Moon size={23} aria-hidden="true" />
      )}
    </button>
  );
}
