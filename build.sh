#! /bin/bash

npm install

mkdir -p build/usr/share/h264-live-player
mkdir -p build/etc/systemd/system

cp -r lib build/usr/share/h264-live-player/
cp -r public build/usr/share/h264-live-player/
cp -r samples build/usr/share/h264-live-player/
cp -r vendor build/usr/share/h264-live-player/
cp -r *.js build/usr/share/h264-live-player/
cp -r DEBIAN build/
cp h264-live-player.service build/etc/systemd/system/
cp -r node_modules build/usr/share/h264-live-player/

mkdir -p out

VERSION="$(git describe)"

sed -i "s/VERSIONHERE/${VERSION}/g" build/DEBIAN/control

fakeroot dpkg-deb -b build out

rm -r build