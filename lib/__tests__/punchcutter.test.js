import fs from 'fs-extra';
import globby from 'globby';
import path from 'path';
import {describe, expect, test} from 'vitest';
import {
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
} from '../punchcutter';

const dir = import.meta.dirname;

describe('Punchcutter', () => {
  test('build', async () => {
    await fs.remove(path.join(dir, 'data/dist'));

    const config = {
      fonts: [
        // Mono
        {
          name: 'mono',
          src: [path.join(dir, 'data/src/mono/*.svg')],
          builds: [
            {
              type: GLYPH,
              builds: [
                {
                  type: SVG,
                  dist: path.join(dir, 'data/dist/mono/glyph/svg') + path.sep
                }
              ]
            },
            {
              type: SVG_SPRITE,
              monochrome: true,
              builds: [
                {
                  dist: path.join(dir, 'data/dist/mono/svg-sprite') + path.sep,
                  idPrefix: 'mono--'
                }
              ]
            }
          ]
        },
        // Poly
        {
          name: 'poly',
          src: [path.join(dir, 'data/src/poly/*.svg')],
          builds: [
            {
              type: WEB_FONT,
              css: {
                dist: path.join(dir, 'data/dist/poly/font') + path.sep
              },
              font: {
                dist: path.join(dir, 'data/dist/poly/font') + path.sep
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
                  dist: path.join(dir, 'data/dist/poly/glyph/svg') + path.sep
                },
                {
                  type: PNG,
                  dist:
                    path.join(dir, 'data/dist/poly/glyph/png/@1x') + path.sep,
                  scale: 1
                },
                {
                  type: PNG,
                  dist:
                    path.join(dir, 'data/dist/poly/glyph/png/@2x') + path.sep,
                  scale: 2
                }
              ]
            },
            {
              type: JS_FONT,
              dist: path.join(dir, 'data/dist/poly/js') + path.sep
            },
            {
              type: PNG_SPRITE,
              css: {
                dist: path.join(dir, 'data/dist/poly/png-sprite/css') + path.sep
              },
              rules: [
                {
                  dppx: 1,
                  src: [
                    path.join(dir, 'data/dist/poly/glyph/png/@1x/blue/*.png')
                  ],
                  dist:
                    path.join(dir, 'data/dist/poly/png-sprite/@1x') + path.sep // Output to directory
                },
                {
                  dppx: 1.5,
                  src: [
                    path.join(dir, 'data/dist/poly/glyph/png/@2x/blue/*.png')
                  ],
                  dist: path.join(
                    dir,
                    'data/dist/poly/png-sprite/img/poly@2x.png'
                  ) // Output to file
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
                  dist: path.join(dir, 'data/dist/poly/svg-sprite') + path.sep
                }
              ]
            }
          ]
        }
      ]
    };

    for (const font of config.fonts) {
      await build(font);
    }

    const actual = (
      await globby([path.join(dir, 'data/dist')], {
        onlyFiles: true
      })
    ).sort();

    const expected = [
      path.join(dir, 'data/dist/mono/glyph/svg/erlenmeyer-flask.svg'),
      path.join(dir, 'data/dist/mono/glyph/svg/eye.svg'),
      path.join(dir, 'data/dist/mono/svg-sprite/mono.svg'),
      path.join(dir, 'data/dist/poly/font/_poly.scss'),
      path.join(dir, 'data/dist/poly/font/poly.ttf'),
      path.join(dir, 'data/dist/poly/font/poly.woff'),
      path.join(dir, 'data/dist/poly/glyph/png/@1x/blue/erlenmeyer-flask.png'),
      path.join(dir, 'data/dist/poly/glyph/png/@1x/blue/eye.png'),
      path.join(dir, 'data/dist/poly/glyph/png/@1x/red/erlenmeyer-flask.png'),
      path.join(dir, 'data/dist/poly/glyph/png/@1x/red/eye.png'),
      path.join(dir, 'data/dist/poly/glyph/png/@2x/blue/erlenmeyer-flask.png'),
      path.join(dir, 'data/dist/poly/glyph/png/@2x/blue/eye.png'),
      path.join(dir, 'data/dist/poly/glyph/png/@2x/red/erlenmeyer-flask.png'),
      path.join(dir, 'data/dist/poly/glyph/png/@2x/red/eye.png'),
      path.join(dir, 'data/dist/poly/glyph/svg/blue/erlenmeyer-flask.svg'),
      path.join(dir, 'data/dist/poly/glyph/svg/red/erlenmeyer-flask.svg'),
      path.join(dir, 'data/dist/poly/glyph/svg/blue/eye.svg'),
      path.join(dir, 'data/dist/poly/glyph/svg/red/eye.svg'),
      path.join(dir, 'data/dist/poly/js/poly.js'),
      path.join(dir, 'data/dist/poly/png-sprite/@1x/poly.png'),
      path.join(dir, 'data/dist/poly/png-sprite/img/poly@2x.png'),
      path.join(dir, 'data/dist/poly/png-sprite/css/_poly.scss'),
      path.join(dir, 'data/dist/poly/svg-sprite/poly.svg')
    ].sort();

    expect(actual).toEqual(expected);

    await fs.remove(path.join(dir, 'data/dist'));
  });
});
