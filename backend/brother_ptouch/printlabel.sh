#!/bin/bash -e

cd "$(dirname "$0")"

if [ $# -ne 2 ]; then
   echo "Usage: $0 'label to print' /dev/rfcomm0"
   exit 1
fi

if [[ "$1" =~ ^[A-Z0-9\ -]+$ ]]; then
   convert -pointsize 86 -background white -bordercolor white label:"$1" -fill black -splice 0x5 -border 10x10 label.png # UPPERCASE BLOCK
   echo "UPPERCASE MODE (bigger font)"
else
   convert -size x82 -gravity south -splice 0x15 -background white -bordercolor white label:"$1" -fill black label.png
   echo "standard mode"
fi

venv/bin/python labelmaker.py -i label.png "$2"
rm -f label.png
exit 0
