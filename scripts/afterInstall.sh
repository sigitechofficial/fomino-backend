#!/bin/bash
# Install Node.js 16
curl -sL https://rpm.nodesource.com/setup_16.x | sudo bash -
sudo yum install -y nodejs

# Install PM2
sudo npm install -g pm2

# Navigate to the project directory
cd /home/ubuntu/fomino

# Install project dependencies
npm install -f
