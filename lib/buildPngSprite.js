/* eslint no-console: 0 */
const _ = require('lodash');
const autoprefixer = require('autoprefixer');
const chalk = require('chalk');
const crypto = require('crypto');
const fs = require('fs-extra');
const path = require('path');
const postcss = require('postcss');
const Promise = require('bluebird');
const sass = require('node-sass');
const Spritesmith = require('spritesmith');
const nunjucks = require('nunjucks');
const multiGlob = require('./multiGlob');
const packageJson = require('../package.json');

Promise.promisifyAll(fs);

const md5 = crypto.createHash('md5');

/**
 *
 * @param   {Object} config
 * @returns {Promise}
 */
module.exports = function(config) {
  md5.update(packageJson.version);
  md5.update(JSON.stringify(config));

  return Promise.mapSeries(config.build.rules, rule =>
    multiGlob(rule.src).then(files =>
      Promise.resolve(
        _.assign({}, rule, {
          src: files.map(file => ({
            basename: path.basename(file, path.extname(file)),
            path: file
          }))
        })
      )
    )
  )
    .then(rules =>
      Promise.mapSeries(
        rules,
        (rule, i) =>
          new Promise(function(resolve, reject) {
            console.log(
              `Building PNG sprite [${i + 1}/${rules.length}]: ${chalk.cyan(
                config.name
              )}`
            );

            const src = rule.src.map(file => file.path);

            Spritesmith.run({src}, function(err, result) {
              if (err) {
                reject(err);
              } else {
                const spritePath = path.join(rule.dist, config.name + '.png');
                const sprite = _.assign({}, rule, {
                  sprite: _.assign(
                    _.pick(result, ['coordinates', 'properties']),
                    {
                      path: spritePath
                    }
                  )
                });

                md5.update(result.image);

                fs
                  .outputFileAsync(spritePath, result.image, 'binary')
                  .then(function() {
                    resolve(sprite);
                  });
              }
            });
          })
      )
    )
    .then(function(rules) {
      const hash = md5.digest('hex');
      const scssPath = path.join(config.build.css.dist, `_${config.name}.scss`);
      const cssPath = path.join(config.build.css.dist, `${config.name}.css`);
      const cssData = {
        name: config.name,
        groups: _.values(
          _.groupBy(
            rules.reduce(
              (result, rule) =>
                result.concat(
                  _.keys(rule.sprite.coordinates).map(file => ({
                    dpr: rule.dpr,
                    name: `${config.build.idPrefix}${path.basename(
                      file,
                      path.extname(file)
                    )}`,
                    url: `${path.join(
                      rule.relativeSpritePath ||
                        path.relative(config.build.css.dist, rule.dist),
                      path.basename(rule.sprite.path)
                    )}?${hash}`,
                    x: -rule.sprite.coordinates[file].x,
                    y: -rule.sprite.coordinates[file].y,
                    width: rule.sprite.coordinates[file].width,
                    height: rule.sprite.coordinates[file].height,
                    spriteWidth: rule.sprite.properties.width,
                    spriteHeight: rule.sprite.properties.height
                  }))
                ),
              []
            ),
            'dpr'
          )
        ).map(group => ({dpr: group[0].dpr, files: group}))
      };

      return fs
        .readFileAsync(
          path.join(__dirname, '../src/png-sprite.scss.njk'),
          'utf8'
        )
        .then(str => Promise.resolve(nunjucks.renderString(str, cssData)))
        .then(str =>
          Promise.mapSeries(config.build.stylesheets, function(stylesheet) {
            switch (stylesheet) {
              case 'css':
                return postcss([
                  autoprefixer({
                    browsers: [
                      'last 2 versions',
                      'ie >= 8',
                      'ff >= 5',
                      'chrome >= 20',
                      'opera >= 12',
                      'safari >= 4',
                      'ios >= 6',
                      'android >= 2',
                      'bb >= 6'
                    ]
                  })
                ])
                  .process(
                    sass
                      .renderSync({
                        data: str
                      })
                      .css.toString(),
                    {
                      from: undefined,
                      to: cssPath
                    }
                  )
                  .then(result =>
                    Promise.resolve(
                      fs.outputFileAsync(cssPath, result.css, 'utf8')
                    )
                  );

              case 'scss':
                return Promise.resolve(
                  fs.outputFileAsync(scssPath, str, 'utf8')
                );
            }

            return Promise.reject(
              new Error(`Stylesheet "${stylesheet}" not supported`)
            );
          })
        )
        .then(() => Promise.resolve(rules));
    })
    .then(function(rules) {
      if (config.htmlDemo) {
        const htmlPath = path.join(
          config.build.css.dist,
          `${config.name}.html`
        );
        const htmlData = {
          css: `${config.name}.css`,
          name: config.name,
          glyphs: rules[0].src.map(
            file => `${config.build.idPrefix}${file.basename}`
          )
        };

        return fs
          .readFileAsync(
            path.join(__dirname, '../src/png-sprite.html.njk'),
            'utf8'
          )
          .then(str => Promise.resolve(nunjucks.renderString(str, htmlData)))
          .then(str => fs.outputFileAsync(htmlPath, str, 'utf8'));
      }

      return Promise.resolve();
    });
};
