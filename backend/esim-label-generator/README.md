

run like this `./print.php path/to/file.png > /dev/usb/lp0`

or this `./print.php path/to/file.png | sudo tee /dev/usb/lp0 | hd`

Tested on Intermec PF8d label printer with ESim version 7, some others might work.

Protocol documentation https://www.mediaform.de/fileadmin/support/handbuecher/etikettendrucker/intermec/Int_ESim.pdf

It allso works from openwrt with `kmod-usb-print` installed


To start server directly on OpenWrt install dependencies
```
opkg install php7-cli php7-mod-fileinfo php7-mod-gd
```

and configure web server to start on bootup
```
cat > /etc/rc.local <<- 'EOF'
php-cli -S 0.0.0.0:80 /root/esim*/server.php 2>&1 | logger -t printing &
exit 0
EOF
```

