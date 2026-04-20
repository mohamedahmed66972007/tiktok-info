#!/bin/bash
set -e

export PORT=5000
export API_PORT=3001
export BASE_PATH=/
export NODE_ENV=development

echo "Building API server..."
cd /home/runner/workspace/artifacts/api-server
pnpm run build

echo "Starting API server on port $API_PORT..."
PORT=$API_PORT node --enable-source-maps ./dist/index.mjs &
API_PID=$!

echo "Starting frontend on port $PORT..."
cd /home/runner/workspace/artifacts/tiktok-inspector
pnpm run dev

wait $API_PID
