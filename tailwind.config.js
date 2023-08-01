/** @type {import('tailwindcss').Config} */

module.exports = {
  content: ['./ui-src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          10: '#091C7A',
          9: '#102694',
          8: '#1A34B8',
          7: '#274BDB',
          6: '#3366FF',
          5: '#598BFF',
          4: '#739DFF',
          3: '#A6C1FF',
          2: '#D9E4FF',
          1: '#F2F6FF'
        },
        dark: {
          0: '#141414',
          1: '#1F1F1F',
          2: '#262626',
          3: '#434343',
          4: '#595959',
          5: '#8C8C8C',
          6: '#BFBFBF',
          7: '#F0F0F0',
          8: '#F5F5F5',
          9: '#FAFAFA',
          10: '#FFFFFF'
        },
        light: {
          0: '#FFFFFF',
          1: '#F7F9FC',
          2: '#EDF1F7',
          3: '#E4E9F2',
          4: '#C5CEE0',
          5: '#8F9BB3',
          6: '#2E3A59',
          7: '#222B45',
          8: '#192038',
          9: '#151A30',
          10: '#101426'
        }
      }
    },
    aspectRatio: {
      none: 0,
      square: '1 / 1',
      '16/9': '16 / 9',
      '4/3': '4 / 3',
      '21/9': '21 / 9'
    },
    screens: {
      sm: '640px',
      // => @media (min-width: 640px) { ... }

      md: '768px',
      // => @media (min-width: 768px) { ... }

      lg: '1024px',
      // => @media (min-width: 1024px) { ... }

      xl: '1280px',
      // => @media (min-width: 1280px) { ... }

      '2xl': '1536px',
      // => @media (min-width: 1536px) { ... }

      '2xl-max': { max: '1535px' },
      // => @media (max-width: 1535px) { ... }

      'xl-max': { max: '1279px' },
      // => @media (max-width: 1279px) { ... }

      'lg-max': { max: '1023px' },
      // => @media (max-width: 1023px) { ... }

      'md-max': { max: '767px' },
      // => @media (max-width: 767px) { ... }

      'sm-max': { max: '639px' }
      // => @media (max-width: 639px) { ... }
    }
  },
  // https://github.com/tailwindlabs/tailwindcss-container-queries
  plugins: [
    require('@tailwindcss/container-queries')
    // function ({ addUtilities, theme }) {
    //   const utilities = {
    //     '.bg-stripes': {
    //       backgroundImage:
    //         'linear-gradient(45deg, var(--stripes-color) 12.50%, transparent 12.50%, transparent 50%, var(--stripes-color) 50%, var(--stripes-color) 62.50%, transparent 62.50%, transparent 100%)',
    //       backgroundSize: '5.66px 5.66px'
    //     }
    //   }

    //   const addColor = (name, color) =>
    //     (utilities[`.bg-stripes-${name}`] = { '--stripes-color': color })

    //   const colors = flattenColorPalette(theme('backgroundColor'))
    //   for (let name in colors) {
    //     try {
    //       const [r, g, b, a] = toRgba(colors[name])
    //       if (a !== undefined) {
    //         addColor(name, colors[name])
    //       } else {
    //         addColor(name, `rgba(${r}, ${g}, ${b}, 0.4)`)
    //       }
    //     } catch (_) {
    //       addColor(name, colors[name])
    //     }
    //   }

    //   addUtilities(utilities)
    // }
  ],
  corePlugins: {
    preflight: false
  },
  darkMode: 'class'
}
