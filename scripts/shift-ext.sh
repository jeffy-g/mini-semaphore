#!/bin/bash

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

  local pattern="$1"
  local re_origin_ext="\.${2}$"
  # NEED a double quote to expand vars
  local re_oring2after="s/(.*)$re_origin_ext/\1\.$3/"

  local transformer=$4

  [ ! -z $debug ] && echo re_origin_ext=$re_origin_ext   # OK
  [ ! -z $debug ] && echo re_oring2after=$re_oring2after #OK

  if [ ! -z "$transformer" ]; then
    # or below
    # if [[ ! -z $transformer ]]; then
    for f in $pattern; do
      if [[ $f =~ $re_origin_ext ]]; then
        local after=$(echo $f | sed -E $re_oring2after)
        local command="$transformer $f $after"
        eval "$command"
      fi
      # [[ $f =~ $re_origin_ext ]] && echo $(echo $f | sed -E $re_oring2after)
    done
  else
    for f in $pattern; do
      if [[ $f =~ $re_origin_ext ]]; then
        local after=$(echo $f | sed -E $re_oring2after)
        echo "$f $after"
      fi
    done
  fi
}
