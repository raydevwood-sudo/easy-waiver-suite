/**
 * Shared Tailwind CSS preset for the Easy Waiver Suite.
 *
 * Uses `brand-*` colour tokens instead of org-specific names.
 * To change the brand colour, override the `brand` palette in your app's
 * tailwind.config.js `theme.extend.colors` section.
 *
 * Default palette: cyan-blue (#05adee) — suitable for Cycling Without Age Society.
 */

/** @type {import('tailwindcss').Config} */
export default {
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#e6f7fd',
          100: '#b3e8fa',
          200: '#80d9f7',
          300: '#4dcaf4',
          400: '#1abbf1',
          500: '#05adee',
          600: '#0493cc',
          700: '#0379aa',
          800: '#025f88',
          900: '#014566',
          dark: '#0286b8',
          light: '#66cef5',
        },
      },
      fontFamily: {
        sans: ['Inter', 'Roboto', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 2px 8px rgba(0,0,0,0.08)',
        medium: '0 4px 12px rgba(0,0,0,0.1)',
        strong: '0 8px 24px rgba(0,0,0,0.12)',
        'inner-soft': 'inset 0 2px 4px rgba(0,0,0,0.06)',
        card: '0 1px 3px rgba(0,0,0,0.06), 0 2px 8px rgba(0,0,0,0.06)',
      },
    },
  },
  plugins: [],
};
