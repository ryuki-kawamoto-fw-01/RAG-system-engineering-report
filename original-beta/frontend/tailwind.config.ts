import type { Config } from 'tailwindcss';
import plugin from 'tailwindcss/plugin';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
      colors: {
        // TODO: あとで修正
        // 'primary-dark': '#121212',
        // 'background-dark': '#121212',
        // 'dark-gray': '#1e1e1e',
        // 'assistant-light': '#f0f4ff',
        // 'assistant-dark': '#272829',
        primary: {
          DEFAULT: '#2691DE',
          foreground: '#FFF',
        },
        secondary: {
          DEFAULT: '#14344D',
          foreground: '#FFF',
        },
        tertiary: {
          DEFAULT: '#FFF',
          foreground: '#222',
        },
        destructive: {
          DEFAULT: '#DC2626',
          foreground: '#FFF',
        },
        ring: '#3D8DCC',
        neutral: {
          0: '#FFF',
          50: '#F7F7F7',
          100: '#EBEBEB',
          200: '#C6C6C6',
          300: '#B3B3B3',
          400: '#999',
          500: '#757575',
          600: '#666',
          700: '#4D4D4D',
          800: '#333',
          900: '#222',
        },
        green: {
          50: '#EFFCE9',
          100: '#DBF9CE',
          200: '#BAF3A3',
          300: '#8EE96D',
          400: '#68DA41',
          500: '#47C022',
          600: '#36A018',
          700: '#297516',
          800: '#245D17',
          900: '#224F18',
          950: '#133B0C',
        },
        sage: {
          50: '#F5FAF3',
          100: '#EDF5EB',
          200: '#D8EBD3',
          300: '#ABD3A2',
          400: '#7EB771',
          500: '#5C9A4D',
          600: '#477E3B',
          700: '#3A6431',
          800: '#32502B',
          900: '#2A4225',
          950: '#182F14',
        },
        blue: {
          50: '#EFF5FB',
          100: '#DFECF6',
          200: '#BED9EE',
          300: '#9EC6E5',
          400: '#7EB3DD',
          500: '#5DA0D4',
          600: '#3D8DCC',
          700: '#2B70A5',
          800: '#205279',
          900: '#14344D',
          950: '#0E2536',
        },
        sky: {
          50: '#E8F5FD',
          100: '#DFF0FD',
          200: '#AEDDFF',
          300: '#86CCFF',
          400: '#5DBBFF',
          500: '#3BADFF',
          600: '#1D9BF0',
          650: '#2691DE',
          700: '#0077C7',
          800: '#00518B',
          900: '#0D4065',
          950: '#022A47',
        },
        red: {
          50: '#FEF2F2',
          100: '#FFE4E6',
          200: '#FECDD3',
          300: '#FCA5A5',
          400: '#F87171',
          500: '#F24E4E',
          600: '#DC2626',
          700: '#B91C1C',
          800: '#991B1B',
          900: '#7F1D1D',
          950: '#450A0A',
        },
        orange: {
          50: '#FFF8EC',
          100: '#FFEDC9',
          200: '#FFE5B0',
          300: '#FFC46B',
          400: '#FF9F2F',
          500: '#FF8107',
          600: '#E86800',
          700: '#BA3E00',
          800: '#A33A09',
          900: '#83320B',
          950: '#471703',
        },
        yellow: {
          50: '#FFFBEB',
          100: '#FEF3C7',
          200: '#FDE68A',
          300: '#FCD34D',
          400: '#ECC22D',
          500: '#DEB342',
          600: '#C69700',
          700: '#A57E0E',
          800: '#866600',
          900: '#684F00',
          950: '#4B390C',
        },
        slate: {
          50: '#F5F8FA',
          100: '#EDF2F5',
          200: '#DFE8ED',
          300: '#CBD9E1',
          400: '#A1B6C5',
          500: '#728A9C',
          600: '#607788',
          700: '#475B69',
          800: '#334755',
          850: '#253643',
          900: '#1E2E3B',
          950: '#162531',
        },
      },
      fontSize: {
        '9xl': '2.5rem', // 40px
        '8xl': '2.25rem', // 36px
        '7xl': '2rem', // 32px
        '6xl': '1.75rem', // 28px
        '5xl': '1.5rem', // 24px
        '4xl': '1.375rem', // 22px
        '3xl': '1.25rem', // 20px
        '2xl': '1.125rem', // 18px
        xl: '1rem', // 16px
        lg: '0.935rem', // 15px
        base: '0.875rem', // 14px
        sm: '0.813rem', // 13px
        xs: '0.75rem', // 12px
        '2xs': '0.688rem', // 11px
        '3xs': '0.625rem', // 10px
      },
      boxShadow: {
        default: '0px 1px 4px 0px rgba(114, 150, 201, 0.15)',
        focus: '0px 1px 12px 0px rgba(28, 44, 68, 0.3)',
        header: '0px 2px 6px 0px rgba(22, 37, 49, 0.05)',
        sidebar: '-2px 0px 6px 0px rgba(22, 37, 49, 0.05)',
        file: '0px -2px 6px rgba(22, 37, 49, 0.05)',
      },
    },
  },
  darkMode: 'class', // この設定により、ダークモードがクラスベースで有効になる
  plugins: [
    plugin(function ({ addComponents }) {
      addComponents({
        '.custom-list': {
          '&': { listStyleType: 'disc' },
          '& ul': { listStyleType: 'circle' },
          '& ul ul': { listStyleType: 'square' },
        },
        '.custom-ordered-list': {
          '&': { listStyleType: 'decimal' },
          '& ol': { listStyleType: 'lower-alpha' },
          '& ol ol': { listStyleType: 'lower-roman' },
        },
      });
    }),
  ],
};
export default config;
