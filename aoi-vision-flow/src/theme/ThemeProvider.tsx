import React, { useEffect } from 'react';
import { ThemeProvider as MuiThemeProvider, CssBaseline } from '@mui/material';
import { aoiTheme } from './mui';

interface AOIThemeProviderProps {
  children: React.ReactNode;
}

export const AOIThemeProvider: React.FC<AOIThemeProviderProps> = ({ children }) => {
  useEffect(() => {
    // Force dark mode by adding the dark class to the document
    document.documentElement.classList.add('dark');
    document.body.style.backgroundColor = '#0A0E1A'; // Analytics dashboard background
    
    return () => {
      // Cleanup if needed
      document.documentElement.classList.remove('dark');
    };
  }, []);

  return (
    <MuiThemeProvider theme={aoiTheme}>
      <CssBaseline />
      {children}
    </MuiThemeProvider>
  );
};

export default AOIThemeProvider;