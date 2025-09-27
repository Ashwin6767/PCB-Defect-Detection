import { Components, Theme } from '@mui/material/styles';

export const MuiAppBar: Components<Theme>['MuiAppBar'] = {
  styleOverrides: {
    root: {
      height: 64,
      backgroundColor: 'transparent',
      backdropFilter: 'blur(8px)',
      borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
      boxShadow: 'none',
      color: '#E6EEF3',
    },
  },
};