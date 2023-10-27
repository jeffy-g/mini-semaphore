#!/bin/bash -x
#
# version 1.0 - 2022/03/19
# version 2.0 - 2023/10/23
#
shift-extension() {

  if [ "$1" = "" ]; then
    cat <<_EOT_
- - - - - - - - - - shift-extension: help - - - - - - - - - -

 shift-extension <file pattern> <before extension> <after extension> [<apply command>]
 
     about <apply command>: e.g - "git mv" or "mv" etc ...?

- - - - - - - - - - shift-extension: help - - - - - - - - - -
_EOT_
    return 0
  fi

  local debug=

  local re_origin_ext="\.${1}$"
  # NEED a double quote to expand vars
  local re_oring2after="s/(.*)$re_origin_ext/\1\.$2/"

  local transformer=$3

  [ ! -z $debug ] && echo re_origin_ext=$re_origin_ext   # OK
  [ ! -z $debug ] && echo re_oring2after=$re_oring2after # OK

  shift 3
  if [ ! -z "$transformer" ]; then
    # or below
    # if [[ ! -z $transformer ]]; then
    echo "[shift-extension] terget files: $*"
    for f in $*; do
      if [[ $f =~ $re_origin_ext ]]; then
        local after=$(echo $f | sed -E $re_oring2after)
        local command="$transformer $f $after"
        eval "$command"
      fi
      # [[ $f =~ $re_origin_ext ]] && echo $(echo $f | sed -E $re_oring2after)
    done
  else
    for f in $*; do
      if [[ $f =~ $re_origin_ext ]]; then
        local after=$(echo $f | sed -E $re_oring2after)
        echo "$f $after"
      fi
    done
  fi
}

#
# test: 2023-10-23 - OK
#
# $ bash scripts/shift-ext.sh "js" "mjs" "mv" ./dist/{esm,webpack-esm}/*.js
# echo "run shift-extension $*"
# shift-extension $*
