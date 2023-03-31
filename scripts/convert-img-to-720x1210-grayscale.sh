#!/bin/sh

if [ ! "$1" ]; then
    echo "Convert given image/pdf to a format suted for the Intermec PF8d label printer"
    echo "usage: $0 img-file"
    exit 1
fi

src="$1"
dst="$1.converted.png"

convert \
    -density 600 \
    -quality 100 \
    -define png:compression-level=9 -define png:compression-strategy=3 -define png:exclude-chunk=all \
    -colorspace Gray \
    -resize '780x1210>' \
    -background white \
    -extent 780x1210 \
    "$src" \
    "$dst"

echo "$dst"
