import { Components, Theme } from '@mui/material/styles';

export const MuiCard: Components<Theme>['MuiCard'] = {
  styleOverrides: {
    root: {
      borderRadius: 12,
      backgroundColor: '#0F1418',
      backgroundImage: 'linear-gradient(135deg, #0F1418 0%, #111418 100%)',
      border: '1px solid rgba(255, 255, 255, 0.08)',
      boxShadow: '0px 2px 4px rgba(2, 6, 23, 0.2)',
      transition: 'box-shadow 150ms cubic-bezier(0.4, 0, 0.2, 1)',
      '&:hover': {
        boxShadow: '0px 4px 8px rgba(2, 6, 23, 0.3)',
      },
    },
  },
};