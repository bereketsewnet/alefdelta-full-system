#!/bin/bash

# ALEF-DELTA SACCO Management System - Docker Quick Start Script

set -e

echo "🚀 Starting ALEF-DELTA SACCO Management System Stack..."
echo ""

# Check if .env exists for backend
if [ ! -f ./alef_delta_sacco_backend/.env ]; then
    echo "⚠️  Backend .env file not found in alef_delta_sacco_backend/"
    echo "Please create .env file with required configuration."
    exit 1
fi

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker Desktop."
    exit 1
fi

# Build and start services
echo "📦 Building and starting services..."
docker-compose up -d --build

echo ""
echo "⏳ Waiting for services to be ready..."
sleep 15

# Check service status
echo ""
echo "📊 Service Status:"
docker-compose ps

echo ""
echo "✅ Services are starting!"
echo ""
echo "📍 Access your services:"
echo "   Staff Portal:    http://localhost:5175"
echo "   Member Portal:   http://localhost:7070"
echo "   API:             http://localhost:4001/api"
echo "   Health:          http://localhost:4001/api/health"
echo "   Swagger:         http://localhost:4001/api-docs"
echo "   Adminer:         http://localhost:8082"
echo ""
echo "📝 To seed admin user:"
echo "   docker-compose exec api npm run seed:admin"
echo ""
echo "📋 To view logs:"
echo "   docker-compose logs -f"
echo ""
echo "🛑 To stop services:"
echo "   ./stop.sh"
echo ""

