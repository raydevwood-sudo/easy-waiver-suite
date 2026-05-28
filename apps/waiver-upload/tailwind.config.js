/** @type {import('tailwindcss').Config} */
import sharedPreset from '../../packages/shared/tailwind.preset.js';

export default {
  presets: [sharedPreset],
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      // Override brand colours here for your organisation, e.g.:
      // colors: { brand: { 500: '#your-color' } }
    },
  },
  plugins: [],
};
