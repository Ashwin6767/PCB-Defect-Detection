import { Components, Theme } from '@mui/material/styles';

export const MuiButton: Components<Theme>['MuiButton'] = {
  styleOverrides: {
    root: {
      borderRadius: 8,
      textTransform: 'none',
      fontWeight: 500,
      transition: 'all 150ms cubic-bezier(0.4, 0, 0.2, 1)',
    },
    contained: {
      backgroundColor: '#1E88E5',
      color: '#FFFFFF',
      boxShadow: '0px 2px 4px rgba(30, 136, 229, 0.2)',
      '&:hover': {
        backgroundColor: '#1976D2', // 6% darker
        boxShadow: '0px 4px 8px rgba(30, 136, 229, 0.3)',
      },
    },
    outlined: {
      borderColor: 'rgba(255, 255, 255, 0.12)',
      color: '#E6EEF3',
      '&:hover': {
        borderColor: 'rgba(255, 255, 255, 0.16)',
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
      },
    },
    text: {
      color: '#E6EEF3',
      '&:hover': {
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
      },
    },
  },
};