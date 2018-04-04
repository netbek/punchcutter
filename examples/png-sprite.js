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
          dist: 'dist/poly/glyph/png/24/',
          scale: 24 / 512
        },
        {
          type: PNG,
          dist: 'dist/poly/glyph/png/32/',
          scale: 32 / 512
        },
        {
          type: PNG,
          dist: 'dist/poly/glyph/png/48/',
          scale: 48 / 512
        }
      ]
    },
    {
      type: PNG_SPRITE,
      algorithm: 'binary-tree', // https://github.com/Ensighten/spritesmith#algorithms
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
          dist: 'dist/poly/png-sprite/img/poly-mdpi.png' // Can be a file or directory. If a directory, add a trailing slash.
          // relativeSpritePath: '' // Path from stylesheet to PNG sprite. If empty, the path will be computed.
        },
        {
          dppx: 1.5,
          src: ['dist/poly/glyph/png/24/*.png'],
          dist: 'dist/poly/png-sprite/img/poly-hdpi.png' // Can be a file or directory. If a directory, add a trailing slash.
          // relativeSpritePath: '' // Path from stylesheet to PNG sprite. If empty, the path will be computed.
        },
        {
          dppx: 2,
          src: ['dist/poly/glyph/png/32/*.png'],
          dist: 'dist/poly/png-sprite/img/poly-xhdpi.png' // Can be a file or directory. If a directory, add a trailing slash.
          // relativeSpritePath: '' // Path from stylesheet to PNG sprite. If empty, the path will be computed.
        },
        {
          dppx: 3,
          src: ['dist/poly/glyph/png/48/*.png'],
          dist: 'dist/poly/png-sprite/img/poly-xxhdpi.png' // Can be a file or directory. If a directory, add a trailing slash.
          // relativeSpritePath: '' // Path from stylesheet to PNG sprite. If empty, the path will be computed.
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
