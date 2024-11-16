/* eslint no-console: 0 */
const _ = require('lodash');
const autoprefixer = require('autoprefixer');
const chalk = require('chalk');
const crypto = require('crypto');
const fs = require('fs-extra');
const globby = require('globby');
const path = require('path');
const postcss = require('postcss');
const Promise = require('bluebird');
const sass = require('sass-embedded');
const Spritesmith = require('spritesmith');
const nunjucks = require('nunjucks');
const packageJson = require('../package.json');

const md5 = crypto.createHash('md5');

/**
 *
 * @param   {Object} config
 * @returns {Promise}
 */
module.exports = function (config) {
  md5.update(packageJson.version);
  md5.update(JSON.stringify(config));

  return Promise.mapSeries(config.build.rules, (rule) =>
    globby(rule.src).then((glyphs) =>
      Promise.resolve(
        _.assign({}, rule, {
          src: glyphs.map((glyph) => ({
            basename: path.basename(glyph, path.extname(glyph)),
            path: glyph
          }))
        })
      )
    )
  )
    .then((rules) =>
      Promise.mapSeries(
        rules,
        (rule, i) =>
          new Promise(function (resolve, reject) {
            console.log(
              `Building PNG sprite [${i + 1}/${rules.length}]: ${chalk.cyan(
                config.name
              )}`
            );

            const {algorithm} = config.build;
            const src = rule.src.map((glyph) => glyph.path);

            Spritesmith.run({algorithm, src}, function (err, result) {
              if (err) {
                reject(err);
              } else {
                const distLastChar = rule.dist.substring(rule.dist.length - 1);
                const distIsDir = distLastChar === '/' || distLastChar === '\\';
                const dir = distIsDir ? rule.dist : path.dirname(rule.dist);
                const file = distIsDir
                  ? path.join(rule.dist, config.name + '.png')
                  : rule.dist;

                const sprite = _.assign({}, rule, {
                  sprite: _.assign(
                    _.pick(result, ['coordinates', 'properties']),
                    {
                      dir,
                      file
                    }
                  )
                });

                md5.update(result.image);

                fs.outputFile(file, result.image, 'binary').then(function () {
                  resolve(sprite);
                });
              }
            });
          })
      )
    )
    .then(function (rules) {
      const hash = md5.digest('hex');

      // Build stylesheet paths.
      const scssPath = path.join(config.build.css.dist, `_${config.name}.scss`);
      const cssPath = path.join(config.build.css.dist, `${config.name}.css`);

      // Build stylesheet data.
      const {sprite: baselineSprite} = rules[0];
      const {width: spriteWidth, height: spriteHeight} =
        baselineSprite.properties;
      const baselineRuleGlyphs = _.values(baselineSprite.coordinates);
      const {width: glyphWidth, height: glyphHeight} = baselineRuleGlyphs.length
        ? baselineRuleGlyphs[0]
        : {};
      const {baseClass} = config.build.templateOptions;

      const glyphsByDppx = _.groupBy(
        rules.reduce(
          (result, rule) =>
            result.concat(
              _.keys(rule.sprite.coordinates).map((glyph) => ({
                dppx: rule.dppx,
                class: `${
                  config.build.templateOptions.classPrefix
                }${path.basename(glyph, path.extname(glyph))}`,
                backgroundImage: {
                  url: `${path.join(
                    rule.relativeSpritePath ||
                      path.relative(config.build.css.dist, rule.sprite.dir),
                    path.basename(rule.sprite.file)
                  )}?${hash}`
                },
                backgroundPosition: {
                  x: -rule.sprite.coordinates[glyph].x,
                  y: -rule.sprite.coordinates[glyph].y
                }
              }))
            ),
          []
        ),
        'dppx'
      );

      const groups = _.uniq(rules.map((d) => d.dppx)).map((d) => ({
        dppx: d,
        glyphs: glyphsByDppx[d]
      }));

      return fs
        .readFile(path.join(__dirname, '../src/png-sprite.scss.njk'), 'utf-8')
        .then((data) =>
          Promise.resolve(
            nunjucks.renderString(data, {
              baseClass,
              spriteWidth,
              spriteHeight,
              glyphWidth,
              glyphHeight,
              groups
            })
          )
        )
        .then((data) =>
          Promise.mapSeries(config.build.stylesheets, function (stylesheet) {
            if (stylesheet === 'css') {
              return postcss([autoprefixer(config.build.autoprefixer)])
                .process(sass.compileString(data).css, {
                  from: undefined,
                  to: cssPath
                })
                .then((result) => fs.outputFile(cssPath, result.css, 'utf-8'));
            }

            if (stylesheet === 'scss') {
              return fs.outputFile(scssPath, data, 'utf-8');
            }

            return Promise.reject(
              new Error(`Stylesheet type "${stylesheet}" not supported`)
            );
          })
        )
        .then(() => Promise.resolve(rules));
    })
    .then(function (rules) {
      if (config.build.htmlDemo) {
        const htmlPath = path.join(
          config.build.css.dist,
          `${config.name}.html`
        );
        const htmlData = {
          css: `${config.name}.css`,
          baseClass: config.build.templateOptions.baseClass,
          glyphs: rules[0].src.map((glyph) => ({
            class: `${config.build.templateOptions.classPrefix}${glyph.basename}`
          }))
        };

        return fs
          .readFile(path.join(__dirname, '../src/png-sprite.html.njk'), 'utf-8')
          .then((data) =>
            Promise.resolve(nunjucks.renderString(data, htmlData))
          )
          .then((data) => fs.outputFile(htmlPath, data, 'utf-8'));
      }

      return Promise.resolve();
    });
};
