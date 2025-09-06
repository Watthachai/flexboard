"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

interface ThemeContextType {
  darkMode: boolean;
  toggleDarkMode: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [darkMode, setDarkMode] = useState(false); // Default to light mode

  useEffect(() => {
    // Load dark mode preference from localStorage
    if (typeof window !== "undefined" && window.localStorage) {
      const savedDarkMode = localStorage.getItem("darkMode");
      if (savedDarkMode !== null) {
        const isDark = JSON.parse(savedDarkMode);
        setDarkMode(isDark);
        applyTheme(isDark);
      } else {
        // Check system preference first
        const prefersDark = window.matchMedia(
          "(prefers-color-scheme: dark)"
        ).matches;
        setDarkMode(prefersDark);
        applyTheme(prefersDark);
        localStorage.setItem("darkMode", JSON.stringify(prefersDark));
      }
    }
  }, []);

  const applyTheme = (isDark: boolean) => {
    console.log("🎨 Applying theme:", isDark ? "dark" : "light");
    if (isDark) {
      document.documentElement.classList.add("dark");
      console.log("✅ Added 'dark' class to document");
    } else {
      document.documentElement.classList.remove("dark");
      console.log("❌ Removed 'dark' class from document");
    }
  };

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    console.log("🌙 Theme toggle clicked:", {
      from: darkMode,
      to: newDarkMode,
    });

    setDarkMode(newDarkMode);
    applyTheme(newDarkMode);

    // Save to localStorage
    if (typeof window !== "undefined" && window.localStorage) {
      localStorage.setItem("darkMode", JSON.stringify(newDarkMode));
      console.log("💾 Saved dark mode preference:", newDarkMode);
    }

    // Debug: Show visual alert
    setTimeout(() => {
      console.log(
        "🔄 Final check - Document classes:",
        document.documentElement.className
      );
      console.log(
        "🔄 Final check - Has dark class:",
        document.documentElement.classList.contains("dark")
      );
    }, 100);
  };

  return (
    <ThemeContext.Provider value={{ darkMode, toggleDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
