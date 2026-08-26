export const theme = {
  colors: {
    background: '#f4f6fb',
    surface: '#ffffff',
    border: '#e4e8f0',
    text: '#101828',
    muted: '#667085',
    primary: '#0f9d58',
    primaryDark: '#0b7a44',
    danger: '#e02424',
    warning: '#f59f00',
    chipBackground: '#eef2f7',
  },
  spacing: (multiplier: number) => multiplier * 8,
  radius: { sm: 8, md: 12, lg: 18 },
} as const;
