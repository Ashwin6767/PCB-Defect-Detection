import { Components, Theme } from '@mui/material/styles';

export const MuiDrawer: Components<Theme>['MuiDrawer'] = {
  styleOverrides: {
    paper: {
      width: 240,
      backgroundColor: '#111418', // Lighter than main background
      borderRight: '1px solid rgba(255, 255, 255, 0.08)',
      color: '#E6EEF3',
    },
  },
};