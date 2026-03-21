module.exports = {
  content: ['./src/**/*.{jsx,js}'],
  theme: {
    extend: {
      colors: {
        paper: '#fdfbf7',
        pencil: '#2d2d2d',
        muted: '#e5e0d8',
        accent: '#ff4d4d',
        blue: '#2d5da1',
        postit: '#fff9c4',
      },
      fontFamily: {
        heading: ['Kalam', 'cursive'],
        body: ['Patrick Hand', 'cursive'],
      },
      borderRadius: {
        wobbly: '255px 15px 225px 15px / 15px 225px 15px 255px',
        wobblyMd: '15px 225px 15px 255px / 225px 15px 255px 15px',
      },
      boxShadow: {
        hard: '4px 4px 0px 0px #2d2d2d',
        hardLg: '8px 8px 0px 0px #2d2d2d',
        hardSm: '2px 2px 0px 0px #2d2d2d',
        hardRed: '4px 4px 0px 0px #ff4d4d',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
      animation: {
        fadeIn: 'fadeIn 0.3s ease-out forwards',
      },
    },
  },
}
