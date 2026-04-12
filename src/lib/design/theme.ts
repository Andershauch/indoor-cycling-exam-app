export const designTokens = {
  colors: {
    background: "#FEE81F",
    backgroundSoft: "#FEED5D",
    backgroundMuted: "#FFF7BE",
    surface: "#FFFDF4",
    surfaceStrong: "#FFF3C2",
    text: "#111111",
    textMuted: "#3F3F3F",
    success: "#23683F",
    warning: "#CF5F00",
    danger: "#B3261E",
  },
  spacing: {
    xs: "0.5rem",
    sm: "0.75rem",
    md: "1rem",
    lg: "1.5rem",
    xl: "2rem",
    "2xl": "3rem",
  },
  radius: {
    sm: "0.75rem",
    md: "1.25rem",
    lg: "2rem",
    pill: "999px",
  },
  typography: {
    display: '"Arial Black", Arial, Helvetica, sans-serif',
    body: "Arial, Helvetica, sans-serif",
    mono: '"Geist Mono", "Geist Mono Fallback", ui-monospace, monospace',
  },
} as const;
