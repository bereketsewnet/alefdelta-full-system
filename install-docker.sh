#!/bin/bash

# Complete Docker Installation Script
# This script removes Docker snap and installs Docker via apt

set -e  # Exit on error

echo "=========================================="
echo "Docker Installation Script"
echo "=========================================="
echo ""

# Step 1: Remove Docker Snap
echo "[1/10] Checking for Docker snap..."
if snap list | grep -q docker; then
    echo "  → Removing Docker snap..."
    sudo snap remove docker
    echo "  ✓ Docker snap removed"
else
    echo "  ✓ No Docker snap found"
fi

# Step 2: Stop existing Docker (if running)
echo ""
echo "[2/10] Stopping existing Docker services..."
sudo systemctl stop docker docker.socket 2>/dev/null || true
echo "  ✓ Services stopped"

# Step 3: Remove old Docker packages (optional)
echo ""
echo "[3/10] Removing old Docker packages (if any)..."
sudo apt-get remove -y docker docker-engine docker.io containerd runc docker-compose 2>/dev/null || true
echo "  ✓ Old packages removed"

# Step 4: Install prerequisites
echo ""
echo "[4/10] Installing prerequisites..."
sudo apt-get update -qq
sudo apt-get install -y ca-certificates curl gnupg lsb-release
echo "  ✓ Prerequisites installed"

# Step 5: Add Docker GPG key
echo ""
echo "[5/10] Adding Docker GPG key..."
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc
echo "  ✓ GPG key added"

# Step 6: Add Docker repository
echo ""
echo "[6/10] Adding Docker repository..."
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update -qq
echo "  ✓ Repository added"

# Step 7: Install Docker
echo ""
echo "[7/10] Installing Docker Engine and Docker Compose..."
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin docker-compose
echo "  ✓ Docker installed"

# Step 8: Start and enable Docker
echo ""
echo "[8/10] Starting Docker service..."
sudo systemctl start docker
sudo systemctl enable docker
sudo systemctl enable docker.socket
echo "  ✓ Docker service started"

# Step 9: Add user to docker group
echo ""
echo "[9/10] Adding user to docker group..."
CURRENT_USER=${SUDO_USER:-$USER}
if [ "$CURRENT_USER" = "root" ]; then
    CURRENT_USER=$(who am i | awk '{print $1}')
fi
if [ -z "$CURRENT_USER" ]; then
    CURRENT_USER=$USER
fi

sudo usermod -aG docker "$CURRENT_USER"
echo "  ✓ User '$CURRENT_USER' added to docker group"
echo "  ⚠  You need to log out and log back in, or run: newgrp docker"

# Step 10: Verify installation
echo ""
echo "[10/10] Verifying installation..."
sleep 2
docker --version
docker-compose --version
echo "  ✓ Installation verified"

# Fix directory permissions
echo ""
echo "Fixing directory permissions..."
sudo chown -R "$CURRENT_USER:$CURRENT_USER" /var/www/alefdelta 2>/dev/null || true
echo "  ✓ Permissions fixed"

echo ""
echo "=========================================="
echo "Installation Complete!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Log out and log back in, OR run: newgrp docker"
echo "2. Test Docker: docker run hello-world"
echo "3. Start your project: docker-compose up -d"
echo ""

