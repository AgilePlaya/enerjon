export const THEME = {
  colors: {
    background: '#0B131B',
    card: '#131F2A',
    cardBorder: 'rgba(255, 255, 255, 0.06)',
    cardBorderActive: 'rgba(0, 194, 255, 0.35)',
    inputBackground: '#0F1822',
    inputBorder: 'rgba(255, 255, 255, 0.08)',
    primary: '#00C2FF', // Electric cyan
    primaryGlow: 'rgba(0, 194, 255, 0.25)',
    primarySubtle: 'rgba(0, 194, 255, 0.12)',
    secondary: '#0A84FF',
    textPrimary: '#FFFFFF',
    textSecondary: '#94A3B8',
    textMuted: '#64748B',
    success: '#34D399',
    danger: '#F87171',
    dockBackground: 'rgba(11, 19, 27, 0.92)',
    dockBorder: 'rgba(255, 255, 255, 0.08)',
    chartTrack: '#1A2938',
  },
  fonts: {
    regular: 'System',
    medium: 'System',
    semibold: 'System',
    bold: 'System',
  },
  shadows: {
    cyanGlow: {
      shadowColor: '#00C2FF',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.35,
      shadowRadius: 12,
      elevation: 8,
    },
    card: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.4,
      shadowRadius: 10,
      elevation: 5,
    },
    dock: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: -4 },
      shadowOpacity: 0.5,
      shadowRadius: 16,
      elevation: 12,
    },
  },
  radii: {
    xs: 8,
    sm: 12,
    md: 16,
    lg: 20, // Unified primary radius for buttons, bottom dock, cards, inputs, and pills
    xl: 24,
    full: 9999,
  },
} as const;

