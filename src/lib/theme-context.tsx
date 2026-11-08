"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";

export type Theme = "light" | "dark" | "system";

interface ThemeContextType {
  theme: Theme;
  resolvedTheme: "light" | "dark";
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "light",
  resolvedTheme: "light",
  setTheme: () => {},
  toggleTheme: () => {},
});

function getInitialTheme(): Theme {
  if (typeof window !== "undefined") {
    const saved = localStorage.getItem("iconfigly_theme") as Theme | null;
    if (saved && ["light", "dark", "system"].includes(saved)) {
      return saved;
    }
  }
  return "light";
}

function resolveActiveTheme(t: Theme): "light" | "dark" {
  if (t === "system") {
    if (typeof window !== "undefined") {
      return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }
    return "light";
  }
  return t;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(getInitialTheme);
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">(() => resolveActiveTheme(getInitialTheme()));

  const applyThemeToDom = useCallback((active: "light" | "dark") => {
    if (typeof document !== "undefined") {
      const root = document.documentElement;
      if (active === "dark") {
        root.classList.add("dark");
        root.classList.remove("light");
      } else {
        root.classList.add("light");
        root.classList.remove("dark");
      }
      root.setAttribute("data-theme", active);
    }
  }, []);

  const setTheme = useCallback(
    (newTheme: Theme) => {
      setThemeState(newTheme);
      if (typeof window !== "undefined") {
        localStorage.setItem("iconfigly_theme", newTheme);
      }
      const active = resolveActiveTheme(newTheme);
      setResolvedTheme(active);
      applyThemeToDom(active);
    },
    [applyThemeToDom]
  );

  const toggleTheme = useCallback(() => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  }, [resolvedTheme, setTheme]);

  useEffect(() => {
    const active = resolveActiveTheme(theme);
    applyThemeToDom(active);

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      const current = (localStorage.getItem("iconfigly_theme") as Theme | null) || "system";
      if (current === "system") {
        const next = mediaQuery.matches ? "dark" : "light";
        setResolvedTheme(next);
        applyThemeToDom(next);
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => {
      mediaQuery.removeEventListener("change", handleChange);
    };
  }, [theme, applyThemeToDom]);

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
