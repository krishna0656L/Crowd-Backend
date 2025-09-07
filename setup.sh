#!/bin/bash
set -e

log() {
  echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1"
}

# Install Python dependencies
log "Installing Python dependencies..."
pip install -r requirements.txt

# Install Node.js dependencies
log "Installing Node.js dependencies..."
npm install --production=false

# Make scripts executable
chmod +x start.sh

log "Setup completed successfully!"
