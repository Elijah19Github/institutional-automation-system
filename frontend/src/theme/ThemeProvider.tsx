"use client";

import React, { createContext, useEffect, useState } from 'react';
import { lightTheme, darkTheme, blueTheme } from './theme';

type Theme = 'dark' | 'light' | 'blue' | 'system';

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
};

type ThemeProviderState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

const initialState: ThemeProviderState = {
  theme: 'system',
  setTheme: () => null,
};

export const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

export function ThemeProvider({
  children,
  defaultTheme = 'system',
  storageKey = 'ui-theme',
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem(storageKey) as Theme) || defaultTheme
  );

  useEffect(() => {
    const root = window.document.documentElement;

    root.classList.remove('light', 'dark', 'theme-blue');

    // Remove old styles to cleanly apply the new one
    Object.keys(lightTheme).forEach((key) => {
      root.style.removeProperty(key);
    });

    let systemTheme: Theme = 'light';
    if (theme === 'system') {
      systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
      root.classList.add(systemTheme);
    } else {
      if (theme === 'blue') root.classList.add('theme-blue');
      else root.classList.add(theme);
    }

    const resolvedTheme = theme === 'system' ? systemTheme : theme;
    
    let themeVars = lightTheme;
    if (resolvedTheme === 'dark') themeVars = darkTheme;
    else if (resolvedTheme === 'blue') themeVars = blueTheme;

    // Apply the CSS variables dynamic values for the requested theme
    Object.entries(themeVars).forEach(([key, value]) => {
      root.style.setProperty(key, value as string);
    });

  }, [theme]);

  const value = {
    theme,
    setTheme: (theme: Theme) => {
      localStorage.setItem(storageKey, theme);
      setTheme(theme);
    },
  };

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}
