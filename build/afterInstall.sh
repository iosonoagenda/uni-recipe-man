#!/bin/bash
if [ -z "$URM_SUDO" ]; then
  URM_SUDO=0
fi
URM_FILES_CHECK=$(find . -name "x-uni.*.xml" | wc -l)
if [ "$URM_FILES_CHECK" -eq 0 ]; then
  exit 1
fi
if [ "$URM_SUDO" -eq 1 ]; then
  sudo xdg-mime install x-uni.langs+urmlang.xml --mode system
  sudo xdg-mime install x-uni.recipes+urmrecipe.xml --mode system
  sudo update-mime-database /usr/share/mime
else
  xdg-mime install x-uni.langs+urmlang.xml
  xdg-mime install x-uni.recipes+urmrecipe.xml
  update-mime-database ~/.local/share/mime
fi
if [ "$URM_FILES_CHECK" -gt 0 ]; then
  rm -f x-uni.*.xml
fi
