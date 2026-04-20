#!/bin/bash
set -e

export PORT=5000
export API_PORT=3001
export BASE_PATH=/
export NODE_ENV=production

echo "Starting API server on port $API_PORT..."
cd /home/runner/workspace/artifacts/api-server
PORT=$API_PORT node --enable-source-maps ./dist/index.mjs &
API_PID=$!

echo "Serving frontend on port $PORT..."
cd /home/runner/workspace/artifacts/tiktok-inspector
pnpm run serve

wait $API_PID
