#!/bin/bash

# Exit on any error
set -e

# Start Node.js server in the background
node index.js &
NODE_PID=$!

# Start Python server in the background
gunicorn app:app -c gunicorn_config.py &
PYTHON_PID=$!

# Function to handle shutdown
shutdown_servers() {
  echo "Shutting down servers..."
  kill $NODE_PID $PYTHON_PID 2>/dev/null
  exit 0
}

# Trap SIGTERM and SIGINT
trap 'shutdown_servers' SIGTERM SIGINT

# Keep the script running
wait $NODE_PID $PYTHON_PID
