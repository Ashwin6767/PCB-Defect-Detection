import { createTheme, Theme } from '@mui/material/styles';
import { palette } from './palette';
import { typography } from './typography';
import { shadows } from './shadows';
import { components } from './components';

// Create the MUI theme with industrial dark styling
export const aoiTheme: Theme = createTheme({
  palette,
  typography,
  shadows,
  components,
  shape: {
    borderRadius: 8, // 8px border radius for consistency
  },
  spacing: 8, // 8px grid system
  transitions: {
    duration: {
      shortest: 150,
      shorter: 200,
      short: 250,
      standard: 300,
      complex: 375,
    },
    easing: {
      easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
      easeOut: 'cubic-bezier(0.0, 0, 0.2, 1)',
      easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
      sharp: 'cubic-bezier(0.4, 0, 0.6, 1)',
    },
  },
});

export default aoiTheme;