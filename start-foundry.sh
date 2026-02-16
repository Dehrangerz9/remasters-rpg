#!/usr/bin/env bash
set -euo pipefail

NODE_BIN="/home/yume/.nvm/versions/node/v22.14.0/bin/node "
FOUNDRY_APP="/media/yume/ssd-1/Foundry/FoundryVTT-Linux-13.348/resources/app"
FOUNDRY_PORT="30000"
FOUNDRY_DATA_PATH="/home/yume/3 - Resources/RPG/Foundry Data Path"

gnome-terminal -- bash -lc "\"$NODE_BIN\" \"$FOUNDRY_APP\" --port=$FOUNDRY_PORT --dataPath=\"$FOUNDRY_DATA_PATH\"; exec bash"

sleep 5

# 3) Open Firefox tab to Foundry
firefox --new-tab "http://localhost:30000" &
