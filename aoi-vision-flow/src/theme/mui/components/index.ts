import { Components, Theme } from '@mui/material/styles';

export const components: Components<Theme> = {
  MuiAppBar: {
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
  },
  MuiDrawer: {
    styleOverrides: {
      paper: {
        width: 240,
        backgroundColor: '#111418',
        borderRight: '1px solid rgba(255, 255, 255, 0.08)',
        color: '#E6EEF3',
      },
    },
  },
  MuiCard: {
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
  },
  MuiButton: {
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
          backgroundColor: '#1976D2',
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
    },
  },
  MuiTextField: {
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
  },
};