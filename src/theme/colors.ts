export const DARK_COLORS = {
  // Brand Accents
  primary: '#CCFF00', // Electric Yellow
  secondary: '#79FF5B', // Athletic Vibrant Green
  tertiary: '#98D2E1', // Hydration Blue
  warning: '#FCD13B', // Rest Warning Amber
  error: '#FFB4AB', // Error Red
  errorContainer: '#93000A',

  // Neutrals / Core Backings
  background: '#000000', // Deep OLED Black
  surface: '#131313', // Charcoal Base
  surfaceCard: '#1E1E1E', // Slightly brighter card fill
  surfaceBright: '#393939', // Accent card fill / headers

  // Text Typography Colors
  textPrimary: '#FFFFFF', // High-contrast headers
  textSecondary: '#E5E2E1', // Primary body copy
  textMuted: '#C4C9AC', // Muted details
  textAccent: '#000000', // Text used on primary electric yellow

  // Outlines / Borders
  outline: '#8E9379',
  borderGlass: 'rgba(255, 255, 255, 0.1)',
  borderActive: 'rgba(204, 255, 0, 0.25)',
};

export const LIGHT_COLORS = {
  // Brand Accents (Deepened for contrast on light background)
  primary: '#769E00', // Deeper athletic lime/green
  secondary: '#2E8B1A', // Deeper athletic vibrant green
  tertiary: '#3A7D8C', // Deeper hydration blue
  warning: '#C69400', // Deeper rest warning amber
  error: '#BA1A1A', // Deeper error red
  errorContainer: '#FFDAD6',

  // Neutrals / Core Backings (Clean light theme)
  background: '#F9FAF6', // Premium light off-white background
  surface: '#FFFFFF', // Clean white surfaces for cards
  surfaceCard: '#F0F2EA', // Light grey card backing
  surfaceBright: '#E2E4DC', // Accent details / section headers

  // Text Typography Colors (High contrast for light theme)
  textPrimary: '#191C13', // Dark text headers
  textSecondary: '#43493E', // Medium text body copy
  textMuted: '#73796E', // Muted details
  textAccent: '#FFFFFF', // Text used on primary (which is dark in light mode)

  // Outlines / Borders
  outline: '#73796E',
  borderGlass: 'rgba(0, 0, 0, 0.08)',
  borderActive: 'rgba(118, 158, 0, 0.35)',
};

// Fallback export to prevent breaking unrefactored components
export const COLORS = DARK_COLORS;
