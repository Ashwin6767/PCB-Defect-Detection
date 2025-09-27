import { Components, Theme } from '@mui/material/styles';

export const MuiDivider: Components<Theme>['MuiDivider'] = {
  styleOverrides: {
    root: {
      borderColor: 'rgba(255, 255, 255, 0.08)',
    },
  },
};