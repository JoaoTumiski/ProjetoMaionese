// src/styles/theme.ts

const Theme = {
  colors: {
    background: '#131316',
    surface: '#1b1b1e',
    surfaceLight: '#2a2a2d',
    surfaceBright: '#39393c',
    primary: '#ffb3b4',
    onPrimary: '#660518',
    primaryContainer: '#721020', // Burgundy
    secondary: '#efbc98',
    text: '#e4e1e6',
    textSecondary: '#ddc0bf',
    textMuted: '#a58a8a',
    border: '#353438',
    outline: '#a58a8a',
    danger: '#ffb4ab',
    warning: '#efbc98',
    success: '#c8c5cd',
    overlay: 'rgba(19, 19, 22, 0.7)',
    shadow: 'rgba(0, 0, 0, 0.5)',
  },
  spacing: {
    xs: 8,
    sm: 12,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  radius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    xxl: 24,
    round: 9999,
  },
  typography: {
    fontFamily: 'Manrope', // Note: Requires font loading in App.tsx
  },
};

export default Theme;
