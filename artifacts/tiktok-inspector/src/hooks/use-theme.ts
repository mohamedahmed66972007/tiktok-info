import { useState, useEffect } from "react";

export type DarkMode = "light" | "dark";
export type ColorTheme = "tiktok" | "red" | "green" | "blue" | "purple" | "orange";

export interface ThemeColor {
  id: ColorTheme;
  label: string;
  from: string;
  to: string;
  swatch: string;
}

export const COLOR_THEMES: ThemeColor[] = [
  { id: "tiktok",  label: "تيك توك",  from: "#fe2c55", to: "#25f4ee", swatch: "#fe2c55" },
  { id: "red",     label: "أحمر",      from: "#ef4444", to: "#f97316", swatch: "#ef4444" },
  { id: "green",   label: "أخضر",      from: "#10b981", to: "#06b6d4", swatch: "#10b981" },
  { id: "blue",    label: "أزرق",      from: "#3b82f6", to: "#818cf8", swatch: "#3b82f6" },
  { id: "purple",  label: "بنفسجي",    from: "#8b5cf6", to: "#ec4899", swatch: "#8b5cf6" },
  { id: "orange",  label: "برتقالي",   from: "#f97316", to: "#eab308", swatch: "#f97316" },
];

function getStoredDark(): DarkMode {
  if (typeof window === "undefined") return "light";
  const s = localStorage.getItem("dark-mode") as DarkMode | null;
  if (s === "light" || s === "dark") return s;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function getStoredColor(): ColorTheme {
  if (typeof window === "undefined") return "tiktok";
  const s = localStorage.getItem("color-theme") as ColorTheme | null;
  if (s && COLOR_THEMES.some((t) => t.id === s)) return s;
  return "tiktok";
}

export function useTheme() {
  const [dark, setDark] = useState<DarkMode>(getStoredDark);
  const [color, setColorState] = useState<ColorTheme>(getStoredColor);

  useEffect(() => {
    const root = document.documentElement;
    if (dark === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
    localStorage.setItem("dark-mode", dark);
  }, [dark]);

  useEffect(() => {
    document.documentElement.setAttribute("data-color", color);
    localStorage.setItem("color-theme", color);
  }, [color]);

  const toggleDark = () => setDark((d) => (d === "dark" ? "light" : "dark"));
  const setColor = (c: ColorTheme) => setColorState(c);

  const activeColor = COLOR_THEMES.find((t) => t.id === color)!;

  return {
    theme: dark,
    toggle: toggleDark,
    dark,
    toggleDark,
    color,
    setColor,
    activeColor,
    COLOR_THEMES,
  };
}
