module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
    'postcss-import': {},
    'tailwindcss/nesting': 'postcss-nested',
    ...(process.env.NODE_ENV === 'production' ? { cssnano: {} } : {})
  }
}
