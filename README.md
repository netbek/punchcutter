# Punchcutter [![CircleCI](https://circleci.com/gh/netbek/punchcutter.svg?style=svg)](https://circleci.com/gh/netbek/punchcutter)

Build web fonts, glyphs and sprites.

## Installation

### Ubuntu 18

1. Install system dependencies:

    ```shell
    sudo apt-get install fontforge g++ graphicsmagick pngquant ttfautohint
    ```

2. Install Node v10 or higher:

    ```shell
    curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.33.8/install.sh | bash
    source ~/.bashrc
    nvm install v12.18.2
    nvm alias default v12.18.2
    ```

### OS X

1. Install system dependencies:

    ```shell
    brew install fontforge
    brew install gcc48 --enable-cxx
    brew install graphicsmagick
    brew install pngquant
    brew install ttfautohint --with-qt
    ```

2. Install Node v10 or higher:

    ```shell
    curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.33.8/install.sh | bash
    source ~/.bashrc
    nvm install v12.18.2
    nvm alias default v12.18.2
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
