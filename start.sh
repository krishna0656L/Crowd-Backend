#!/bin/bash

# Exit on any error
set -e

# Log function
log() {
  echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1"
}

# Start Node.js server in the background
log "Starting Node.js server..."
node index.js > node.log 2>&1 &
NODE_PID=$!
log "Node.js server started with PID: $NODE_PID"

# Start Python server in the background
log "Starting Python server..."
gunicorn app:app -c gunicorn_config.py > python.log 2>&1 &
PYTHON_PID=$!
log "Python server started with PID: $PYTHON_PID"

# Function to check if process is running
is_running() {
  kill -0 $1 2>/dev/null
  return $?
}

# Function to handle shutdown
shutdown_servers() {
  log "Shutting down servers..."
  [ -n "$NODE_PID" ] && is_running $NODE_PID && kill $NODE_PID
  [ -n "$PYTHON_PID" ] && is_running $PYTHON_PID && kill $PYTHON_PID
  exit 0
}

# Trap signals
trap 'shutdown_servers' SIGTERM SIGINT SIGQUIT

# Monitor processes
while true; do
  if ! is_running $NODE_PID; then
    log "Node.js server (PID: $NODE_PID) is not running. Check node.log for details."
    shutdown_servers
  fi
  
  if ! is_running $PYTHON_PID; then
    log "Python server (PID: $PYTHON_PID) is not running. Check python.log for details."
    shutdown_servers
  fi
  
  sleep 5
done
