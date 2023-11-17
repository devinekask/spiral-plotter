#!/bin/bash
export PATH="/home/pi/.config/nvm/versions/node/v18.18.0/bin:${PATH}"

cd /home/pi/spiral-plotter
zx main.mjs &

# Disable screen blanking
DISPLAY=:0 xset s noblank
DISPLAY=:0 xset s off
DISPLAY=:0 xset -dpms

# hide the mouse cursor
unclutter -idle 0.5 -root &


# dont show warnings etc
sed -i 's/"exited_cleanly":false/"exited_cleanly":true/' /home/$USER/.config/chromium/Default/Preferences
sed -i 's/"exit_type":"Crashed"/"exit_type":"Normal"/' /home/$USER/.config/chromium/Default/Preferences

# kiosk it!
/usr/bin/chromium-browser --noerrdialogs --disable-infobars --kiosk http://localhost:3005
