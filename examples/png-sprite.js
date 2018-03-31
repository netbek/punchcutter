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
      autoprefixer: {
        browsers: ['last 2 versions'] // https://github.com/browserslist/browserslist#queries
      },
      css: {
        dist: 'dist/poly/png-sprite/css/'
      },
      htmlDemo: true, // If true, a HTML file will be generated in the `css.dist` directory for proofing.
      rules: [
        {
          dppx: 1,
          src: ['dist/poly/glyph/png/16/*.png'],
          dist: 'dist/poly/png-sprite/@1x/'
          // relativeSpritePath: '' // Path from stylesheet to PNG sprite. If empty, the path will be computed automatically.
        },
        {
          dppx: 1.5,
          src: ['dist/poly/glyph/png/32/*.png'],
          dist: 'dist/poly/png-sprite/@2x/'
          // relativeSpritePath: '' // Path from stylesheet to PNG sprite. If empty, the path will be computed automatically.
        },
        {
          dppx: 2.5,
          src: ['dist/poly/glyph/png/64/*.png'],
          dist: 'dist/poly/png-sprite/@3x/'
          // relativeSpritePath: '' // Path from stylesheet to PNG sprite. If empty, the path will be computed automatically.
        }
      ],
      stylesheets: ['css', 'scss'], // Stylesheet types to generate. Options: css, scss
      templateOptions: {
        baseClass: 'poly',
        classPrefix: 'poly--'
      } // Class names in stylesheets.
    }
  ]
});
