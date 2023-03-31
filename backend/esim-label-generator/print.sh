#!/bin/bash

./print.php "$1" | nc -w1 print-label.lan 80


