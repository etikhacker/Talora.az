"use client";
import { useSyncExternalStore } from "react";
type Theme = "dark" | "light";
const key = "talora-theme";
const event = "talora:theme";
function snapshot(): Theme {
  return document.documentElement.classList.contains("light")
    ? "light"
    : "dark";
}
function subscribe(callback: () => void) {
  const onStorage = (change: StorageEvent) => {
    if (
      change.key === key &&
      (change.newValue === "light" || change.newValue === "dark")
    )
      applyTheme(change.newValue);
  };
  window.addEventListener(event, callback);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(event, callback);
    window.removeEventListener("storage", onStorage);
  };
}
export function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle("light", theme === "light");
  document.documentElement.classList.toggle("dark", theme === "dark");
  window.dispatchEvent(new Event(event));
}
export function initializeTheme() {
  try {
    const saved =
      localStorage.getItem(key) ?? localStorage.getItem("intern-az-theme");
    if (saved === "light" || saved === "dark") applyTheme(saved);
  } catch {
    /* Storage is optional. */
  }
}
export function useTheme() {
  const theme = useSyncExternalStore(
    subscribe,
    snapshot,
    () => "dark" as const,
  );
  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    applyTheme(next);
    try {
      localStorage.setItem(key, next);
    } catch {
      /* Storage is optional. */
    }
  }
  return { theme, toggleTheme };
}
