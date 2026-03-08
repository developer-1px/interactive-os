import { createContext } from "react";

type Theme = "light" | "dark";

export interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  themeClass: string;
}

export const ThemeContext = createContext<ThemeContextType | undefined>(
  undefined,
);
