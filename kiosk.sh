#!/bin/bash
export PATH="/home/pi/.config/nvm/versions/node/v18.18.0/bin:/home/pi/.local/bin/vpype:${PATH}"

cd /home/pi/spiral-plotter
zx main.mjs &

# Disable screen blanking
export DISPLAY=:0
xset s noblank
xset s off
xset -dpms

# hide the mouse cursor
unclutter -idle 0.5 -root &

# dont show warnings etc
sed -i 's/"exited_cleanly":false/"exited_cleanly":true/' /home/$USER/.config/chromium/Default/Preferences
sed -i 's/"exit_type":"Crashed"/"exit_type":"Normal"/' /home/$USER/.config/chromium/Default/Preferences

# kiosk it!
/usr/bin/chromium-browser --noerrdialogs --disable-infobars --kiosk http://localhost:3005
