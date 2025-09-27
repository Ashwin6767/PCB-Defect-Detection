import { Components, Theme } from '@mui/material/styles';

export const MuiTextField: Components<Theme>['MuiTextField'] = {
  styleOverrides: {
    root: {
      '& .MuiOutlinedInput-root': {
        borderRadius: 8,
        backgroundColor: 'rgba(255, 255, 255, 0.02)',
        '& fieldset': {
          borderColor: 'rgba(255, 255, 255, 0.08)',
        },
        '&:hover fieldset': {
          borderColor: 'rgba(255, 255, 255, 0.12)',
          transition: 'border-color 150ms cubic-bezier(0.4, 0, 0.2, 1)',
        },
        '&.Mui-focused fieldset': {
          borderColor: '#1E88E5',
          borderWidth: 2,
        },
      },
      '& .MuiInputLabel-root': {
        color: '#9AA4B2',
        '&.Mui-focused': {
          color: '#1E88E5',
        },
      },
      '& .MuiOutlinedInput-input': {
        color: '#E6EEF3',
      },
    },
  },
};