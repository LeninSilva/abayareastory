#!/bin/sh
# Downloads the open datasets the city is built from into raw/ (not committed).
set -e
mkdir -p raw
curl -sSL -o raw/hoods.geojson https://raw.githubusercontent.com/codeforgermany/click_that_hood/main/public/data/san-francisco.geojson
curl -sSL -o raw/sfcontour.json https://raw.githubusercontent.com/keplergl/kepler.gl-data/master/sfcontour/data.json
curl -sSL -o raw/trees.csv https://raw.githubusercontent.com/keplergl/kepler.gl-data/master/sftrees/data.csv
