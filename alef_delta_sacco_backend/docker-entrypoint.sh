#!/bin/sh
set -e

echo "Waiting for MySQL to be ready..."
# Wait for MySQL to be ready
until nc -z mysql 3306; do
  echo "MySQL is unavailable - sleeping"
  sleep 2
done

echo "MySQL is up - executing migrations..."

# Never start the financial API against a partially migrated schema.
npm run migrate

# Start the application
echo "Starting API server..."
exec npm start
