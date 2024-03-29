#!/bin/bash -x
#
#  The MIT License (MIT)
#
#  Copyright (c) 2022 jeffy-g hirotom1107@gmail.com
#
#  Permission is hereby granted, free of charge, to any person obtaining a copy
#  of this software and associated documentation files (the "Software"), to deal
#  in the Software without restriction, including without limitation the rights
#  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
#  copies of the Software, and to permit persons to whom the Software is
#  furnished to do so, subject to the following conditions:
#
#  The above copyright notice and this permission notice shall be included in
#  all copies or substantial portions of the Software.
#
#  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
#  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
#  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
#  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
#  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
#  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
#  THE SOFTWARE.
#
SCRIPT_DIR=$(cd $(dirname $0); pwd)
cpxopt=$([ -z $CI ] && echo "-v" || echo "")

jstool() {
  # shift 1 # `shift` is needless
  node "./scripts/tiny/tools.js" $*
}

patch_with_tag() {
  local ret=$(jstool -cmd "version" -extras "./src/index.ts," $1);
  local after=$(echo $ret | sed -E 's/.*version updated: ([0-9]+\.[0-9]+\.[0-9]+).*/\1/');
  echo version=[$after];
  git add -u;
  git commit -m v$after;
  git tag v$after
}

build() {
  npx concurrently -n build:cjs,build:esm,build:webpack -c blue,yellow,green "tsc" "tsc -p src/tsconfig.json" "bash ${0} webpack"
}

distExtra() {
  npx concurrently -n "dist:copy:lic,dist:copy:js,dist:orgpkg" -c "green,blue,red" "cpx $cpxopt \"./{README.md,LICENSE}\" dist"\
    "cpx $cpxopt \"./build/**/*.js\" dist"\
    "orgpkg -p -k defs"

  jstool -cmd rmc -rmc4ts -basePath "dist/cjs,dist/esm"
  # js to mjs
  makeMjs
  # Revived `stripWebpack`
  jstool -cmd stripWebpack
}

copytypes() {
  local cpx_pre="cpx $cpxopt src/index.d.ts"
  local -a commands=(
    "$cpx_pre ./dist"
  )
  local names=dts:dist
  # # output directories (by build target)
  # local dirs="cjs,esm,umd,webpack,webpack-esm"
  # # to array
  # dirs=(${dirs//,/ })
  local -a dirs=(cjs esm umd webpack webpack-esm)
  for dir in "${dirs[@]}"; do
    commands+=("$cpx_pre ./dist/${dir}")
    names+=",dts:dist/${dir}"
  done

  # echo "${commands[@]@Q}"
  npx concurrently -n "${names}" -c red,green,yellow,blue "${commands[@]@Q}" # need quote
  . ${SCRIPT_DIR}/shift-ext.sh
  # shopt -s extglob
  shift-extension "ts" "mts" "mv" ./dist/{webpack-,}esm/*d.ts
}

webpack() {
  # npx rimraf "./dist/webpack/*" "./dist/umd/*" "./dist/webpack-esm/*"
  [ -z $CI ] && npx webpack || npx webpack>/dev/null
}

makeMjs() {
  jstool -cmd "cjbm" -basePath "./dist/esm" -ext "mjs"
  . ${SCRIPT_DIR}/shift-ext.sh
  # shopt -s extglob
  shift-extension "js" "mjs" "mv" ./dist/{webpack-,}esm/*.js
  return 0
}

if [ ! -z $1 ]; then
  fname=$1
  shift
  $fname $*
else
  echo "[${0}]: no parameters..."
fi
