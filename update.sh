#!/bin/bash

git reset --hard HEAD
git pull --rebase
npm run build
chmod +x kiosk.sh
