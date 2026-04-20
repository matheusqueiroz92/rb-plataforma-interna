export const cores = {
  navy: {
    900: '#0D1A2B',
    800: '#11223A',
    700: '#192F4A',
    600: '#243F5E',
  },
  gold: {
    500: '#C9A84C',
    400: '#E0BC6A',
    300: '#F5E6B0',
  },
  cream: '#FAF8F3',
  offWhite: '#F3F1EA',
  gray: {
    100: '#E8E4D8',
    500: '#8A8270',
    900: '#1C1814',
  },
  institucional: {
    red: '#A63228',
    green: '#25714E',
    amber: '#B87820',
    blue: '#1A4F82',
  },
  branco: '#FFFFFF',
} as const;

export const tipografia = {
  serif: 'Georgia',
  sans: 'System',
  tamanhos: {
    titulo: 26,
    subtitulo: 20,
    corpo: 15,
    pequeno: 12,
    capsula: 10,
  },
  pesos: {
    regular: '400' as const,
    medio: '500' as const,
    semi: '600' as const,
    bold: '700' as const,
  },
} as const;

export const espacamentos = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const raios = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  pill: 999,
} as const;
