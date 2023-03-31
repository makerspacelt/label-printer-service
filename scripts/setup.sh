#!/bin/sh -e

cd "$(dirname "$0")"

sudo hostnamectl set-hostname label.lan
sudo apt-get update
sudo apt-get install -qq \
    imagemagick \
    php-cli \
    php-gd \
    python3-aiohttp \
    python-is-python3 \
    python3-pil \
    python3-serial \
    python3-venv \
    rsync \

python -m venv ~/label-printer-service/venv --system-site-packages
# for image conversion to tiff format for brother p-touch label printer
~/label-printer-service/venv/bin/pip install --upgrade packbits

sudo gpasswd -a user lp # for ESIM USB printer

sudo install -m0644 \
  ../systemd-services/rfcomm0.service \
  ../systemd-services/esim-web.service \
  ../systemd-services/label-lan.service \
  /etc/systemd/system/

sudo systemctl --now enable rfcomm0.service label-lan.service esim-web.service
