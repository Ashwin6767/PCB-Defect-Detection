import { Components, Theme } from '@mui/material/styles';

export const MuiTooltip: Components<Theme>['MuiTooltip'] = {
  styleOverrides: {
    tooltip: {
      backgroundColor: '#111418',
      border: '1px solid rgba(255, 255, 255, 0.12)',
      borderRadius: 8,
      fontSize: 12,
      color: '#E6EEF3',
      boxShadow: '0px 8px 16px rgba(2, 6, 23, 0.4)',
    },
    arrow: {
      color: '#111418',
    },
  },
};