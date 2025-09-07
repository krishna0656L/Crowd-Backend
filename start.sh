#!/bin/bash

# Exit on any error
set -e

# Install Node.js dependencies if node_modules is missing
if [ ! -d "node_modules" ]; then
    echo "Installing Node.js dependencies..."
    npm install --production
fi

# Set default environment variables
export NODE_ENV=${NODE_ENV:-production}
export PORT=${PORT:-10000}
# Use a different default to avoid port conflicts with Node
export PYTHON_PORT=${PYTHON_PORT:-10001}
export FLASK_ENV=${FLASK_ENV:-production}
export FLASK_APP=${FLASK_APP:-app.py}

# Add Python user bin to PATH if it exists
if [ -d "$HOME/.local/bin" ]; then
    export PATH="$HOME/.local/bin:$PATH"
fi

# Log function
log() {
  echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1"
}

# Create logs directory and ensure it's writable
LOG_DIR="logs"
mkdir -p "$LOG_DIR"
chmod 777 "$LOG_DIR" || true  # Continue even if chmod fails (e.g., on Windows)

# Clear old logs to avoid surfacing stale errors on restart
: > logs/node.log || true
: > logs/python.log || true

# Start Node.js server in the background
start_node() {
  log "Starting Node.js server on port $PORT..."
  node index.js >> logs/node.log 2>&1 &
  NODE_PID=$!
  log "Node.js server started with PID: $NODE_PID"
}
start_node

# Start Python server in the background
start_python() {
  log "Starting Python server on port $PYTHON_PORT..."
  # Use python -m gunicorn to ensure we're using the correct Python environment
  python -m gunicorn app:app -c gunicorn_config.py >> logs/python.log 2>&1 &
  PYTHON_PID=$!
  log "Python server started with PID: $PYTHON_PID"
}

# Optionally skip starting Python (e.g., when no egress/network)
if [ "${SKIP_PY}" = "1" ]; then
  log "SKIP_PY=1 set: skipping Python server startup"
  PYTHON_PID=""
else
  start_python
fi

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
    log "Node.js server (PID: $NODE_PID) is not running. Attempting restart..."
    tail -n 100 logs/node.log || true
    start_node
  fi
  
  if [ -n "$PYTHON_PID" ] && ! is_running $PYTHON_PID; then
    log "Python server (PID: $PYTHON_PID) is not running. Attempting restart..."
    tail -n 100 logs/python.log || true
    start_python
  fi
  
  sleep 5
done
