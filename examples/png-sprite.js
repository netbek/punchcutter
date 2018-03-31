const {build, GLYPH, PNG_SPRITE, SVG, PNG} = require('..');

build({
  name: 'poly', // Font name.
  src: ['src/poly/*.svg'],
  builds: [
    {
      type: GLYPH,
      builds: [
        {
          type: SVG,
          dist: 'dist/poly/glyph/svg/'
        },
        {
          type: PNG,
          dist: 'dist/poly/glyph/png/16/',
          scale: 16 / 512
        },
        {
          type: PNG,
          dist: 'dist/poly/glyph/png/32/',
          scale: 32 / 512
        },
        {
          type: PNG,
          dist: 'dist/poly/glyph/png/64/',
          scale: 64 / 512
        }
      ]
    },
    {
      type: PNG_SPRITE,
      css: {
        dist: 'dist/poly/png-sprite/css/'
      },
      htmlDemo: true,
      idPrefix: 'poly-',
      rules: [
        {
          dpr: 1,
          src: ['dist/poly/glyph/png/16/*.png'],
          dist: 'dist/poly/png-sprite/@1x/'
          // relativeSpritePath: ''
        },
        {
          dpr: 1.5,
          src: ['dist/poly/glyph/png/32/*.png'],
          dist: 'dist/poly/png-sprite/@2x/'
          // relativeSpritePath: ''
        },
        {
          dpr: 2.5,
          src: ['dist/poly/glyph/png/64/*.png'],
          dist: 'dist/poly/png-sprite/@3x/'
          // relativeSpritePath: ''
        }
      ],
      stylesheets: ['css', 'scss']
    }
  ]
});
