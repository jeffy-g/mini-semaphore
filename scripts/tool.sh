#!/bin/bash -x
# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
#  Copyright (C) 2022 jeffy-g <hirotom1107@gmail.com>
#  Released under the MIT license
#  https://opensource.org/licenses/mit-license.php
# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

export reset="\033[0m"
export red="\033[31m"
export green="\033[32m"
export yellow="\033[33m"
export blue="\033[34m"
export purple="\033[35m"
export cyan="\033[36m"
export white="\033[37m"

SCRIPT_DIR=$(cd $(dirname $0); pwd)
cpxopt=$([ -z $CI ] && echo "-v" || echo "")

jstool() {
  # shift 1 # `shift` is needless
  node "./scripts/tiny/tools.js" $*
}

force_push() {
  local branch_name=$(git branch --contains=HEAD)
  branch_name=${branch_name/* /}
  for remote in $(git remote); do
    echo "- - - - brach [${branch_name}], remote: [$remote] - - - -"
    git push --tags --force --progress $remote ${branch_name}:${branch_name}
  done
}

patch_with_tag() {
  local ret=$(jstool -cmd "version" -extras "./src/index.ts," $1);
  local after=$(echo $ret | sed -E 's/.*version updated: ([0-9]+\.[0-9]+\.[0-9]+(-\w+)?).*/\1/');
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
  make_mjs
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
  fire_shift_ext ts mts d.ts
  return $?
}

webpack() {
  # npx rimraf "./dist/webpack/*" "./dist/umd/*" "./dist/webpack-esm/*"
  [ -z $CI ] && npx webpack || npx webpack >/dev/null
}

make_mjs() {
  jstool -cmd "cjbm" -basePath "./dist/esm" -ext "mjs"
  fire_shift_ext js mjs js
  # "./index" to "./index.mjs"
  sed -i -E 's/"(\.\/index)"/"\1.mjs"/' ./dist/esm/*.mjs
  return $?
}

fire_shift_ext() {
  . ${SCRIPT_DIR}/shift-ext.sh
  # shopt -s extglob
  shift_extension $1 $2 "mv" ./dist/{webpack-,}esm/*.$3
  return $?
}

if [ ! -z $1 ]; then
  fname=$1
  shift
  $fname "$@"
else
  echo "[${0}]: no parameters..."
fi
