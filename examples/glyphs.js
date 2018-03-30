const {build, GLYPHS, PNG, SVG} = require('..');

build({
  name: 'poly', // Font name.
  src: ['src/poly/*.svg'],
  builds: [
    {
      type: GLYPHS,
      colors: {
        blue: '#00f',
        red: '#f00'
      }, // Colorizes SVGs. Remove the `colors` key to skip this.
      builds: [
        {
          type: SVG,
          dist: 'dist/poly/glyphs/svg/'
        },
        {
          type: PNG,
          dist: 'dist/poly/glyphs/png/@1x/',
          scale: 1 // Scales SVG before converting to PNG.
        },
        {
          type: PNG,
          dist: 'dist/poly/glyphs/png/@2x/',
          scale: 2 // Scales SVG before converting to PNG.
        }
      ]
    }
  ]
});
