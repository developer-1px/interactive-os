import { darkTheme, lightTheme } from "@surface/tokens";
import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  themeClass: string;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light");

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  const themeClass = theme === "light" ? lightTheme : darkTheme;

  // Sync theme to body so Portals (Modals/Drawers) get the vars
  useEffect(() => {
    document.body.className = themeClass;
  }, [themeClass]);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, themeClass }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
