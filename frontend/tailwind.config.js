module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Palette principale — Bleu Royal + Or + Blanc
        royal:      '#1B3A7A',
        'royal-dark':'#0F2456',
        'royal-deep':'#091840',
        sky:        '#2E6DB4',
        'sky-light':'#5B9BD5',
        azure:      '#E8F2FF',
        gold:       '#C9A84C',
        'gold-light':'#E8C97A',
        ivory:      '#FAFBFF',
        // Textes
        'text-main':'#0F2456',
        'text-sub': '#4A6080',
        // Compatibilité ancienne palette
        sand:        '#C9A84C',
        terracotta:  '#B5471B',
        'brown-deep':'#1B3A7A',
        night:       '#091840',
        cream:       '#FAFBFF',
        obsidian:    '#091840',
        parchment:   '#4A6080',
      },
      fontFamily: {
        display: ['Cinzel', 'Georgia', 'serif'],
        heading: ['Playfair Display', 'Georgia', 'serif'],
        sans:    ['Lato', 'Segoe UI', 'Arial', 'sans-serif'],
      },
      animation: {
        'fade-up':    'fadeUp 0.7s ease forwards',
        'fade-in':    'fadeIn 0.8s ease forwards',
        'slide-right':'slideRight 0.6s ease forwards',
        'float':      'float 4s ease-in-out infinite',
      },
      keyframes: {
        fadeUp:     { '0%': { opacity: 0, transform: 'translateY(28px)' }, '100%': { opacity: 1, transform: 'translateY(0)' } },
        fadeIn:     { '0%': { opacity: 0 }, '100%': { opacity: 1 } },
        slideRight: { '0%': { opacity: 0, transform: 'translateX(-20px)' }, '100%': { opacity: 1, transform: 'translateX(0)' } },
        float:      { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-8px)' } },
      },
      boxShadow: {
        'royal':  '0 4px 24px rgba(27,58,122,0.18)',
        'gold':   '0 4px 20px rgba(201,168,76,0.25)',
        'card':   '0 2px 16px rgba(27,58,122,0.10)',
      },
    },
  },
  plugins: [],
};
