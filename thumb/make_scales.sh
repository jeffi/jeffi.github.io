#!/bin/bash

if [[ "$#" != 2 ]] ; then
    echo "Expected 2 arguments: input output_base"
    echo "Example: $0 name.png name"
    exit 1
fi

input="$1"
base="$2"

for s in 1 2 ; do
    w=$((80*s))
    convert "$input" \
            -thumbnail "${w}x${w}>" \
            -background white \
            -gravity center \
            -extent "${w}x${w}" \
            "${base}@${s}x.png"
    optipng -o8 "${base}@${s}x.png"
done
