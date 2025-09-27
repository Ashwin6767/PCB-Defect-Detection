import { Components, Theme } from '@mui/material/styles';

export const MuiTable: Components<Theme>['MuiTable'] = {
  styleOverrides: {
    root: {
      '& .MuiTableHead-root': {
        backgroundColor: 'rgba(255, 255, 255, 0.02)',
      },
      '& .MuiTableCell-root': {
        borderColor: 'rgba(255, 255, 255, 0.08)',
        fontSize: 14,
        color: '#E6EEF3',
      },
      '& .MuiTableRow-root': {
        '&:hover': {
          backgroundColor: 'rgba(255, 255, 255, 0.04)',
          transition: 'background-color 150ms cubic-bezier(0.4, 0, 0.2, 1)',
        },
      },
    },
  },
};