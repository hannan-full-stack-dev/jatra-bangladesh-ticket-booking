/** Palette: ivory paper, deep forest green, brass. Like a first-class rail carriage, not a SaaS dashboard. */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Bricolage Grotesque"', '"Anek Bangla"', 'system-ui', 'sans-serif'],
        sans: ['Figtree', '"Anek Bangla"', 'system-ui', 'sans-serif'],
        mono: ['"DM Mono"', 'ui-monospace', 'monospace'],
      },
      colors: {
        ivory: '#F6F1E7', paper: '#FFFDF8', ink: '#14211B', mute: '#667064', line: '#E6DFCF',
        forest: { DEFAULT: '#0F3D2E', deep: '#0A2A20', light: '#1B5A44' },
        brass: { DEFAULT: '#C8A24A', soft: '#F0E4C3', dark: '#8A6D22' },
        danger: '#B3261E',
      },
      boxShadow: {
        lift: '0 1px 2px rgba(20,33,27,.06), 0 14px 32px -14px rgba(20,33,27,.28)',
      },
    },
  },
}
