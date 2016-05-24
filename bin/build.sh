#!/bin/bash

path=$(dirname $0)
path=${path/\./$(pwd)}

cd $path/..

./bin/stop.sh
echo 'Starting to build ... '
node_modules/.bin/easy release -v 0.12
