import { PaletteOptions } from '@mui/material/styles';

export const palette: PaletteOptions = {
  mode: 'dark',
  
  // Bright blue palette from analytics dashboard
  primary: {
    light: '#60A5FA',    // Light blue from charts
    main: '#3B82F6',     // Main bright blue
    dark: '#2563EB',     // Darker blue
    contrastText: '#FFFFFF',
  },
  
  // Secondary neutral palette
  secondary: {
    light: '#9CA3AF',
    main: '#6B7280',
    dark: '#4B5563',
    contrastText: '#F9FAFB',
  },
  
  // Dark analytics background
  background: {
    default: '#0A0E1A', // Very dark blue-black like analytics dashboard
    paper: '#111827',   // Slightly lighter for cards
  },
  
  // Text colors with high contrast
  text: {
    primary: '#F9FAFB',   // Very light text
    secondary: '#D1D5DB', // Medium light text
    disabled: '#6B7280',  // Disabled text
  },
  
  // Status colors matching analytics dashboard
  success: {
    light: '#34D399',    // Bright green like in dashboard
    main: '#10B981',     // Main green from dashboard
    dark: '#059669',     // Darker green
    contrastText: '#FFFFFF',
  },
  
  warning: {
    light: '#FBBF24',    // Bright yellow/orange
    main: '#F59E0B',     // Main orange
    dark: '#D97706',     // Darker orange
    contrastText: '#000000',
  },
  
  error: {
    light: '#F87171',    // Light red
    main: '#EF4444',     // Main red from dashboard
    dark: '#DC2626',     // Darker red
    contrastText: '#FFFFFF',
  },
  
  info: {
    light: '#60A5FA',    // Light blue
    main: '#3B82F6',     // Main blue (same as primary)
    dark: '#2563EB',     // Darker blue
    contrastText: '#FFFFFF',
  },
  
  // Divider and borders - subtle like analytics dashboard
  divider: 'rgba(75, 85, 99, 0.3)', // Subtle gray borders
  
  // Action states
  action: {
    hover: 'rgba(59, 130, 246, 0.1)',     // Blue hover like dashboard
    selected: 'rgba(59, 130, 246, 0.2)',  // Blue selection
    disabled: 'rgba(156, 163, 175, 0.5)',  // Gray disabled
    disabledBackground: 'rgba(75, 85, 99, 0.2)',
    focus: 'rgba(59, 130, 246, 0.3)',     // Blue focus
  },
};