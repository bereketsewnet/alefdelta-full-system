#!/bin/sh
set -e

echo "Waiting for MySQL to be ready..."
# Wait for MySQL to be ready
until nc -z mysql 3306; do
  echo "MySQL is unavailable - sleeping"
  sleep 2
done

echo "MySQL is up - executing migrations..."

# Run migrations
npm run migrate || echo "Migrations failed or already applied"

# Run seed data (optional - comment out if you don't want to seed on every start)
# npm run db:seedall || echo "Seeding failed or already applied"

# Start the application
echo "Starting API server..."
exec npm start

