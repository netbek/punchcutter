# Punchcutter [![CircleCI](https://circleci.com/gh/netbek/punchcutter.svg?style=svg)](https://circleci.com/gh/netbek/punchcutter)

Build web fonts, glyphs and sprites.

## Installation

### Ubuntu 14-16

1. Install system dependencies:

    ```
    sudo apt-get install fontforge g++ graphicsmagick pngquant
    ```

2. Install ttfautohint:

    ```
    bash ./scripts/install-ttfautohint.sh
    ```

### OS X

1. Install system dependencies:

    ```
    brew install fontforge
    brew install gcc48 --enable-cxx
    brew install graphicsmagick
    brew install pngquant
    brew install ttfautohint --with-qt
    ```

## Usage

### Web fonts

See [examples/web-font.js](https://github.com/netbek/punchcutter/blob/master/examples/web-font.js). Run the example: `cd examples && node web-font.js`

### SVG and PNG glyphs

See [examples/glyph.js](https://github.com/netbek/punchcutter/blob/master/examples/glyph.js). Run the example: `cd examples && node glyph.js`

### JS font

See [examples/js-font.js](https://github.com/netbek/punchcutter/blob/master/examples/js-font.js). Run the example: `cd examples && node js-font.js`

### PNG sprite

See [examples/png-sprite.js](https://github.com/netbek/punchcutter/blob/master/examples/png-sprite.js). Run the example: `cd examples && node png-sprite.js`

### SVG sprite

See [examples/svg-sprite.js](https://github.com/netbek/punchcutter/blob/master/examples/svg-sprite.js). Run the example: `cd examples && node svg-sprite.js`

## Credit

Test font: [Ionicons](https://github.com/driftyco/ionicons) (MIT license)

## License

Copyright (c) 2016 Hein Bekker. Licensed under the GNU Affero General Public License, version 3.
