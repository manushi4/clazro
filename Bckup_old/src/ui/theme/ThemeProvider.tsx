/**
 * Theme Provider
 * Provides theme context to all child components
 *
 * Usage:
 * <ThemeProvider theme={myTheme}>
 *   <App />
 * </ThemeProvider>
 */

import React, { createContext, ReactNode } from 'react';
import { Theme, defaultTheme } from './createTheme';

export const ThemeContext = createContext<Theme>(defaultTheme);

interface ThemeProviderProps {
  theme?: Theme;
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  theme = defaultTheme,
  children,
}) => {
  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
};
