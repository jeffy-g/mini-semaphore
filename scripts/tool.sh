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
cpxopt=$([ -z $CI ] && echo "-v" || echo "")

distExtra() {
  npx concurrently -n "copy:lic,copy:js,orgpkg" -c "green,blue,red" "cpx $cpxopt \"./{README.md,LICENSE}\" dist"\
    "cpx $cpxopt \"./build/**/*.js\" dist"\
    "orgpkg -p -k defs, -o dist"
}

copytypes() {
  local cpx_pre="cpx $cpxopt src/index.d.ts"
  local -a commands=(
    "$cpx_pre ./dist"
  )
  local names=dts:dist
  local i=1
  # # output directories (by build target)
  # local dirs="cjs,esm,umd,webpack,webpack-esm"
  # # to array
  # dirs=(${dirs//,/ })
  local -a dirs=(cjs esm umd webpack webpack-esm)
  for dir in "${dirs[@]}"; do
    commands[((i++))]="$cpx_pre ./dist/${dir}"
    names+=",dts:dist/${dir}"
  done

  # echo "${commands[@]@Q}"
  npx concurrently -n "${names}" -c red,green,yellow,blue "${commands[@]@Q}" # need quote
}

webpack() {
  # npx rimraf "./dist/webpack/*" "./dist/umd/*" "./dist/webpack-esm/*"
  [ -z $CI ] && npx webpack || npx webpack>/dev/null
  echo
  # Revived `stripWebpack`
  node ./scripts/tools -cmd stripWebpack
}

build() {
  npx concurrently -n build:cjs,build:esm,webpack -c blue,yellow,green "tsc" "tsc -p src/tsconfig.json" "yarn fire:tool webpack"
}

if [ ! -z $1 ]; then
    [ "$1" = "patch_with_tag" ] && patch_with_tag $2 || $1
else
    echo "no parameters..."
fi
