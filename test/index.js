const chai = require('chai');
const {assert} = chai;
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
const fs = require('fs-extra');
const globby = require('globby');
const Promise = require('bluebird');
const {
  build,
  GLYPH,
  JS_FONT,
  PNG_SPRITE,
  SVG_SPRITE,
  WEB_FONT,
  PNG,
  SVG,
  WOFF,
  TTF
} = require('..');

describe('Punchcutter', function () {
  const testDir = __dirname.substring(process.cwd().length + 1) + '/';

  const config = {
    fonts: [
      // Mono
      {
        name: 'mono',
        src: [testDir + 'data/src/mono/*.svg'],
        builds: [
          {
            type: GLYPH,
            builds: [
              {
                type: SVG,
                dist: testDir + 'data/dist/mono/glyph/svg/'
              }
            ]
          },
          {
            type: SVG_SPRITE,
            monochrome: true,
            builds: [
              {
                dist: testDir + 'data/dist/mono/svg-sprite/',
                idPrefix: 'mono--'
              }
            ]
          }
        ]
      },
      // Poly
      {
        name: 'poly',
        src: [testDir + 'data/src/poly/*.svg'],
        builds: [
          {
            type: WEB_FONT,
            css: {
              dist: testDir + 'data/dist/poly/font/'
            },
            font: {
              dist: testDir + 'data/dist/poly/font/'
            },
            order: [WOFF, TTF],
            stylesheets: ['scss'],
            syntax: 'bem',
            templateOptions: {
              baseClass: 'poly',
              classPrefix: 'poly--'
            },
            types: [WOFF, TTF]
          },
          {
            type: GLYPH,
            colors: {
              blue: '#00f',
              red: '#f00'
            },
            builds: [
              {
                type: SVG,
                dist: testDir + 'data/dist/poly/glyph/svg/'
              },
              {
                type: PNG,
                dist: testDir + 'data/dist/poly/glyph/png/@1x/',
                scale: 1
              },
              {
                type: PNG,
                dist: testDir + 'data/dist/poly/glyph/png/@2x/',
                scale: 2
              }
            ]
          },
          {
            type: JS_FONT,
            dist: testDir + 'data/dist/poly/js/'
          },
          {
            type: PNG_SPRITE,
            css: {
              dist: testDir + 'data/dist/poly/png-sprite/css/'
            },
            rules: [
              {
                dppx: 1,
                src: [testDir + 'data/dist/poly/glyph/png/@1x/blue/*.png'],
                dist: testDir + 'data/dist/poly/png-sprite/@1x/' // Output to directory
              },
              {
                dppx: 1.5,
                src: [testDir + 'data/dist/poly/glyph/png/@2x/blue/*.png'],
                dist: testDir + 'data/dist/poly/png-sprite/img/poly@2x.png' // Output to file
              }
            ],
            stylesheets: ['scss'],
            templateOptions: {
              baseClass: 'poly',
              classPrefix: 'poly--'
            }
          },
          {
            type: SVG_SPRITE,
            builds: [
              {
                dist: testDir + 'data/dist/poly/svg-sprite/'
              }
            ]
          }
        ]
      }
    ]
  };

  const setup = function (done) {
    // Delete test output.
    fs.remove(testDir + 'data/dist/').then(function () {
      done();
    });
  };

  beforeEach(setup);
  after(setup);

  describe('build', function () {
    it('Should build', function () {
      this.timeout(10000);

      const actual = () =>
        Promise.mapSeries(config.fonts, (font) => build(font))
          .then(() => globby([testDir + 'data/dist/**/*'], {onlyFiles: true}))
          .then((files) => Promise.resolve(files.sort()));

      const expected = [
        testDir + 'data/dist/mono/glyph/svg/erlenmeyer-flask.svg',
        testDir + 'data/dist/mono/glyph/svg/eye.svg',
        testDir + 'data/dist/mono/svg-sprite/mono.svg',
        testDir + 'data/dist/poly/font/_poly.scss',
        testDir + 'data/dist/poly/font/poly.ttf',
        testDir + 'data/dist/poly/font/poly.woff',
        testDir + 'data/dist/poly/glyph/png/@1x/blue/erlenmeyer-flask.png',
        testDir + 'data/dist/poly/glyph/png/@1x/blue/eye.png',
        testDir + 'data/dist/poly/glyph/png/@1x/red/erlenmeyer-flask.png',
        testDir + 'data/dist/poly/glyph/png/@1x/red/eye.png',
        testDir + 'data/dist/poly/glyph/png/@2x/blue/erlenmeyer-flask.png',
        testDir + 'data/dist/poly/glyph/png/@2x/blue/eye.png',
        testDir + 'data/dist/poly/glyph/png/@2x/red/erlenmeyer-flask.png',
        testDir + 'data/dist/poly/glyph/png/@2x/red/eye.png',
        testDir + 'data/dist/poly/glyph/svg/blue/erlenmeyer-flask.svg',
        testDir + 'data/dist/poly/glyph/svg/red/erlenmeyer-flask.svg',
        testDir + 'data/dist/poly/glyph/svg/blue/eye.svg',
        testDir + 'data/dist/poly/glyph/svg/red/eye.svg',
        testDir + 'data/dist/poly/js/poly.js',
        testDir + 'data/dist/poly/png-sprite/@1x/poly.png',
        testDir + 'data/dist/poly/png-sprite/img/poly@2x.png',
        testDir + 'data/dist/poly/png-sprite/css/_poly.scss',
        testDir + 'data/dist/poly/svg-sprite/poly.svg'
      ].sort();

      return assert.eventually.deepEqual(actual(), expected);
    });
  });
});
