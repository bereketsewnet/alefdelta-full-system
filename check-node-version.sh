#!/bin/bash
echo "=== Node.js Version Check ==="
echo "Current Node version: $(node -v 2>/dev/null || echo 'Not found')"
echo "Current npm version: $(npm -v 2>/dev/null || echo 'Not found')"
echo ""
echo "Expected: Node v20.18.1 and npm 10.8.2"
echo ""
if [ -f .nvmrc ]; then
  echo ".nvmrc file found: $(cat .nvmrc)"
  echo "To use this version, run: nvm use"
fi
