#!/bin/bash

# This scripts builds ttfautohint from source. This is required in Ubuntu 15-16
# because ttfautohint 0.97-x throws `malloc(): memory corruption` error.

sudo apt-get purge -y libharfbuzz* ttfautohint

sudo apt-get install -y autoconf automake bison flex git pkg-config gcc g++ libglib2.0-dev libcairo2-dev libtool libc6 libfreetype6 libgcc1 libqtcore4 libqtgui4 libstdc++6 libqt4-dev libfreetype6-dev pandoc pkg-config texlive-xetex help2man

cd ~
wget https://www.freedesktop.org/software/harfbuzz/release/harfbuzz-1.4.2.tar.bz2
tar -xjf harfbuzz-1.4.2.tar.bz2
rm harfbuzz-1.4.2.tar.bz2
cd harfbuzz-1.4.2
./configure
make
sudo make install

cd ~
git clone http://repo.or.cz/ttfautohint.git
cd ttfautohint
./bootstrap
./configure --with-doc=no --with-qt=no
make
sudo make install
