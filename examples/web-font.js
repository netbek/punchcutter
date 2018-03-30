const {build, WEB_FONT, EOT, WOFF, TTF} = require('..');

build({
  name: 'poly', // Font name.
  src: ['src/poly/*.svg'],
  builds: [
    {
      type: WEB_FONT,
      css: {
        dist: 'dist/poly/web-fonts/css/'
      },
      font: {
        dist: 'dist/poly/web-fonts/fonts/'
      },
      // codepoints: {}, // https://github.com/sapegin/grunt-webfont#codepoints
      // codepointsFile: '', // https://github.com/sapegin/grunt-webfont#codepointsFile
      // embed: false, // https://github.com/sapegin/grunt-webfont#embed
      // htmlDemo: true, // https://github.com/sapegin/grunt-webfont#htmlDemo
      order: [EOT, WOFF, TTF], // https://github.com/sapegin/grunt-webfont#order
      // relativeFontPath: '', // https://github.com/sapegin/grunt-webfont#relativeFontPath
      stylesheets: ['scss'], // https://github.com/sapegin/grunt-webfont#stylesheets
      syntax: 'bem', // https://github.com/sapegin/grunt-webfont#syntax
      templateOptions: {
        baseClass: 'poly',
        classPrefix: 'poly--'
      }, // https://github.com/sapegin/grunt-webfont#templateoptions
      types: [EOT, WOFF, TTF] // https://github.com/sapegin/grunt-webfont#types
    }
  ]
});
