#!/bin/bash

# ALEF-DELTA SACCO - Node.js Version Setup Script
# This script helps set up Node.js 20.18.1 and npm 10.8.2 for the project

set -e

REQUIRED_NODE_VERSION="20.18.1"
REQUIRED_NPM_VERSION="10.8.2"

echo "🔧 ALEF-DELTA SACCO - Node.js Version Setup"
echo "============================================"
echo ""

# Check if nvm is installed
if [ -s "$HOME/.nvm/nvm.sh" ]; then
    echo "✅ nvm found"
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
elif [ -s "/usr/local/opt/nvm/nvm.sh" ]; then
    echo "✅ nvm found (Homebrew)"
    export NVM_DIR="/usr/local/opt/nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
else
    echo "⚠️  nvm not found. Installing nvm..."
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
    
    # Load nvm after installation
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
    [ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"
    
    echo "✅ nvm installed and loaded"
fi

# Verify nvm is loaded
if ! command -v nvm &> /dev/null && [ -s "$NVM_DIR/nvm.sh" ]; then
    # Try to load nvm again if command not found
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
fi

# Check if nvm command is now available
if ! command -v nvm &> /dev/null; then
    echo "❌ Error: nvm is not available. Please run:"
    echo "   export NVM_DIR=\"\$HOME/.nvm\""
    echo "   [ -s \"\$NVM_DIR/nvm.sh\" ] && \. \"\$NVM_DIR/nvm.sh\""
    echo "   Then run this script again."
    exit 1
fi

# Check current Node version
CURRENT_NODE=$(node -v 2>/dev/null || echo "not installed")
CURRENT_NPM=$(npm -v 2>/dev/null || echo "not installed")

echo "Current Node version: $CURRENT_NODE"
echo "Current npm version: $CURRENT_NPM"
echo ""

# Install Node.js 20.18.1 if not already installed
if ! nvm list | grep -q "v$REQUIRED_NODE_VERSION"; then
    echo "📦 Installing Node.js $REQUIRED_NODE_VERSION..."
    nvm install $REQUIRED_NODE_VERSION
    echo "✅ Node.js $REQUIRED_NODE_VERSION installed"
else
    echo "✅ Node.js $REQUIRED_NODE_VERSION already installed"
fi

# Use Node.js 20.18.1
echo "🔄 Switching to Node.js $REQUIRED_NODE_VERSION..."
nvm use $REQUIRED_NODE_VERSION

# Verify Node version
INSTALLED_NODE=$(node -v)
INSTALLED_NPM=$(npm -v)

echo ""
echo "✅ Setup complete!"
echo "Node version: $INSTALLED_NODE"
echo "npm version: $INSTALLED_NPM"
echo ""

# Check if versions match
if [[ "$INSTALLED_NODE" == "v$REQUIRED_NODE_VERSION" ]]; then
    echo "✅ Node version matches requirement"
else
    echo "⚠️  Warning: Node version mismatch. Expected v$REQUIRED_NODE_VERSION, got $INSTALLED_NODE"
fi

if [[ "$INSTALLED_NPM" == "$REQUIRED_NPM_VERSION" ]]; then
    echo "✅ npm version matches requirement"
else
    echo "⚠️  Warning: npm version mismatch. Expected $REQUIRED_NPM_VERSION, got $INSTALLED_NPM"
    echo "   Updating npm to $REQUIRED_NPM_VERSION..."
    npm install -g npm@$REQUIRED_NPM_VERSION
    echo "✅ npm updated to $REQUIRED_NPM_VERSION"
fi

echo ""
echo "📝 Next steps:"
echo "1. Run 'nvm use' in any project directory to switch to Node 20.18.1"
echo "2. Install dependencies:"
echo "   - Backend: cd alef_delta_sacco_backend && npm install"
echo "   - Frontend: cd alef-delta-hub && npm install"
echo ""
echo "💡 Tip: Add this to your ~/.bashrc or ~/.zshrc to auto-switch:"
echo "   export NVM_DIR=\"\$HOME/.nvm\""
echo "   [ -s \"\$NVM_DIR/nvm.sh\" ] && \. \"\$NVM_DIR/nvm.sh\""
echo ""

