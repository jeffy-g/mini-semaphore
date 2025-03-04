#!/bin/bash -x
#
# version 1.0 - 2022/03/19
# version 2.0 - 2023/10/23
# version 3.0 - 2025/1/31
#
shift_extension() {

  if [ "$1" = "" ]; then
    cat <<_EOT_
- - - - - - - - - - shift_extension: help - - - - - - - - - -

 shift_extension <before extension> <after extension> [<apply command>] <file pattern>
 
     about <apply command>: e.g - "git mv" or "mv" etc ...?

- - - - - - - - - - shift_extension: help - - - - - - - - - -
_EOT_
    return 0
  fi

  local debug=

  local re_origin_ext="\.${1}$"
  # NEED a double quote to expand vars
  local re_oring2after="s/(.*)$re_origin_ext/\1\.$2/"

  for f in "$3"; do
    which $f>/dev/null # 2>&1
  done
  if [ $? -eq 0 ]; then
    local transformer=$3
  fi

  [ ! -z $debug ] && echo re_origin_ext=$re_origin_ext   # OK
  [ ! -z $debug ] && echo re_oring2after=$re_oring2after # OK

  shift 3
  if [ ! -z "$transformer" ]; then
    # or below
    # if [[ ! -z $transformer ]]; then
    files=${*// /\x0a}
    printf "${green}[shift_extension] terget files:$reset\n" $files
    printf "${purple}%s$reset\n" $files
    for f in $*; do
      if [[ $f =~ $re_origin_ext ]]; then
        local after=$(echo $f | sed -E $re_oring2after)
        local command="$transformer $f $after"
        eval "$command"
      fi
      # [[ $f =~ $re_origin_ext ]] && echo $(echo $f | sed -E $re_oring2after)
    done
  else
    # ${yellow}yellow$reset
    printf "${red}[shift_extension:DEBUG] ${yellow}terget files: $*  $reset\n"
    for f in $*; do
      if [[ $f =~ $re_origin_ext ]]; then
        local after=$(echo $f | sed -E $re_oring2after)
        printf "${yellow}$f $after\n"
      fi
    done
  fi
}

#
# test: 2023-10-23 - OK
#
# $ bash scripts/shift-ext.sh "js" "mjs" "mv" ./dist/{esm,webpack-esm}/*.js
# echo "run shift_extension $*"
# shift_extension $*
