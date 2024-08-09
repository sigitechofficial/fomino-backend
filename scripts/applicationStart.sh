#!/bin/bash

# Navigate to the project directory

mkdir -p /home/ubuntu/fomino-backend
cd /home/ubuntu/fomino-backend

# Start the application using PM2

pm2 start fomino.js

