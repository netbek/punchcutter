const _ = require('lodash');
const chai = require('chai');
const {assert} = chai;
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
const del = require('del');
const Promise = require('bluebird');
const {multiGlob} = require('../lib/util');
const {Punchcutter} = require('..');

describe('Punchcutter', function() {
  const testDir = __dirname.substring(process.cwd().length + 1) + '/';

  const config = {
    fonts: [
      // Mono
      {
        name: 'mono',
        src: [testDir + 'data/src/mono/*.svg'],
        dist: testDir + 'data/dist/',
        types: ['sprite'],
        sprite: {
          monochrome: true,
          svg: {
            dist: testDir + 'data/dist/mono/sprite/',
            idPrefix: 'mono--'
          }
        }
      },
      // Poly
      {
        name: 'poly',
        src: [testDir + 'data/src/poly/*.svg'],
        dist: testDir + 'data/dist/',
        types: ['font', 'glyph', 'js', 'sprite'],
        font: {
          order: ['eot', 'woff', 'ttf'],
          stylesheets: ['scss'],
          syntax: 'bem',
          templateOptions: {
            baseClass: 'poly',
            classPrefix: 'poly--'
          },
          types: ['eot', 'woff', 'ttf']
        },
        glyph: {
          colors: {
            black: '#000000'
          }
        }
      }
    ]
  };

  const punchcutter = new Punchcutter();

  const setup = function(done) {
    // Delete test output.
    del(
      _.map(config.fonts, function(font) {
        return font.dist;
      })
    ).then(function() {
      done();
    });
  };

  beforeEach(setup);
  after(setup);

  describe('build', function() {
    it('Should build', function() {
      this.timeout(5000);

      const actual = function() {
        return Promise.mapSeries(config.fonts, function(font) {
          return punchcutter.build(font);
        })
          .then(function() {
            return multiGlob(
              _.uniq(
                _.map(config.fonts, function(config) {
                  return config.dist + '**/*';
                })
              ),
              {
                nodir: true
              }
            );
          })
          .then(function(files) {
            return Promise.resolve(files.sort());
          });
      };

      const expected = [
        testDir + 'data/dist/mono/sprite/mono.svg',
        testDir + 'data/dist/poly/font/_poly.scss',
        testDir + 'data/dist/poly/font/poly.eot',
        testDir + 'data/dist/poly/font/poly.ttf',
        testDir + 'data/dist/poly/font/poly.woff',
        testDir + 'data/dist/poly/glyph/png/black/erlenmeyer-flask.png',
        testDir + 'data/dist/poly/glyph/png/black/eye.png',
        testDir + 'data/dist/poly/glyph/svg/black/erlenmeyer-flask.svg',
        testDir + 'data/dist/poly/glyph/svg/black/eye.svg',
        testDir + 'data/dist/poly/js/poly.js',
        testDir + 'data/dist/poly/sprite/poly.svg'
      ].sort();

      return assert.eventually.deepEqual(actual(), expected);
    });
  });
});
