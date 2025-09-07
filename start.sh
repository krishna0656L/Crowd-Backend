#!/bin/bash

# Exit on any error
set -e

# Set default environment variables
export NODE_ENV=${NODE_ENV:-production}
export PORT=${PORT:-10000}
export PYTHON_PORT=${PYTHON_PORT:-10000}
export FLASK_ENV=${FLASK_ENV:-production}
export FLASK_APP=${FLASK_APP:-app.py}

# Log function
log() {
  echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1"
}

# Create logs directory if it doesn't exist
mkdir -p logs

# Start Node.js server in the background
log "Starting Node.js server on port $PORT..."
node index.js > logs/node.log 2>&1 &
NODE_PID=$!
log "Node.js server started with PID: $NODE_PID"

# Start Python server in the background
log "Starting Python server on port $PYTHON_PORT..."
gunicorn app:app -c gunicorn_config.py > logs/python.log 2>&1 &
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
    log "Node.js server (PID: $NODE_PID) is not running. Check logs/node.log for details."
    cat logs/node.log
    shutdown_servers
  fi
  
  if ! is_running $PYTHON_PID; then
    log "Python server (PID: $PYTHON_PID) is not running. Check logs/python.log for details."
    cat logs/python.log
    shutdown_servers
  fi
  
  sleep 5
done
