# ALEF-DELTA SACCO Management System - Docker Setup

This document describes the Docker containerization setup for the ALEF-DELTA SACCO Management System, similar to the betting transaction system.

## Node.js Version Requirements

**Important:** This project requires **Node.js 20.18.1** and **npm 10.8.2** for both frontend and backend development.

See [NODE_VERSION_SETUP.md](./NODE_VERSION_SETUP.md) for detailed setup instructions.

Quick setup:
```bash
# Install and use Node.js 20.18.1
./setup-node-version.sh

# Or manually with nvm
nvm install 20.18.1
nvm use 20.18.1
```

## Architecture

The system consists of 4 main services:

1. **MySQL Database** - Stores all application data
2. **Adminer** - Web-based database management GUI
3. **Backend API** - Node.js/Express REST API
4. **Frontend UI** - React/Vite SPA application

## Services & Ports

| Service | Container Name | Host Port | Description |
|---------|---------------|-----------|-------------|
| MySQL | `alefdelta_mysql` | 3308 | Database server |
| Adminer | `alefdelta_adminer` | 8082 | Database GUI |
| Backend API | `alefdelta_api` | 4001 | REST API server |
| Frontend | `alefdelta_frontend` | 5175 | Web application |

## Quick Start

### Prerequisites
- Docker and Docker Compose installed
- Backend `.env` file configured in `alef_delta_sacco_backend/.env`

### Starting the Stack

```bash
cd /var/www/alefdelta
./start.sh
```

This will:
1. Build all Docker images
2. Start all containers
3. Wait for MySQL to be ready
4. Run database migrations automatically
5. Start all services

### Stopping the Stack

```bash
./stop.sh
```

## Access URLs

### Local Development
- **Frontend**: http://localhost:5175
- **Backend API**: http://localhost:4001/api
- **API Health Check**: http://localhost:4001/api/health
- **Swagger Documentation**: http://localhost:4001/api-docs
- **Adminer (Database GUI)**: http://localhost:8082

### Production (Public)
- **Frontend**: http://157.173.127.142:5175
- **Backend API**: http://157.173.127.142:4001/api
- **Swagger Documentation**: http://157.173.127.142:4001/api-docs
- **Adminer**: http://157.173.127.142:8082

## Configuration

### Backend Environment Variables

The backend `.env` file is located at `alef_delta_sacco_backend/.env` and has been configured for Docker:

```env
NODE_ENV=production
PORT=4000
DB_HOST=mysql              # Docker service name
DB_PORT=3306
DB_USER=alefdelta_admin
DB_PASSWORD=~HNiBgmo56wag~y3
DB_NAME=alef_delta_sacco
BACKEND_BASE_URL=http://157.173.127.142:4001/api
API_BASE_URL=http://157.173.127.142:4001/api
```

### Frontend Environment Variables

The frontend `.env` file is located at `alef-delta-hub/.env`:

```env
VITE_API_BASE_URL=http://157.173.127.142:4001/api
```

## Database Management

### Connecting via Adminer

1. Open http://localhost:8082 (or public URL)
2. Login credentials:
   - **System**: MySQL
   - **Server**: mysql (or use `alefdelta_mysql` container name)
   - **Username**: `alefdelta_admin` (or `root`)
   - **Password**: `~HNiBgmo56wag~y3` (or root password from docker-compose.yml)
   - **Database**: `alef_delta_sacco`

### Running Migrations

Migrations run automatically on container startup via the `docker-entrypoint.sh` script.

**Migration Tracking System:**
- The system maintains a `schema_migrations` table that tracks which migrations have been applied
- Only new migrations (not yet in the tracking table) will be executed
- Already-applied migrations are automatically skipped
- This prevents duplicate index errors and makes migrations idempotent

To run migrations manually:

```bash
docker-compose exec api npm run migrate
```

The migration system will show:
- ✅ Applied migrations (newly run)
- ⏭️ Skipped migrations (already applied)
- Summary with counts

### Seeding Data

To seed admin user and sample data:

```bash
# Seed admin user (generates credentials in scripts/admin_credentials.txt)
docker-compose exec api npm run seed:admin

# Seed all sample data
docker-compose exec api npm run db:seedall
```

### Database Reset

To reset the database (WARNING: Deletes all data):

```bash
docker-compose exec api npm run db:reset
```

## Common Commands

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f api
docker-compose logs -f frontend
docker-compose logs -f mysql
```

### Rebuild Services

```bash
# Rebuild all
docker-compose up -d --build

# Rebuild specific service
docker-compose up -d --build api
docker-compose up -d --build frontend
```

### Execute Commands in Containers

```bash
# Backend container
docker-compose exec api sh
docker-compose exec api npm run migrate

# Frontend container
docker-compose exec frontend sh

# MySQL container
docker-compose exec mysql mysql -u root -p
```

## Volumes

Data persistence is handled via Docker volumes and bind mounts:

- `mysql_data` - MySQL database files (Docker volume)
- `./alef_delta_sacco_backend/uploads` - Backend uploaded files (bind mount to host directory)

Uploaded files are stored on the host at:
```
/var/www/alefdelta/alef_delta_sacco_backend/uploads/
```

### Accessing Uploaded Images

Uploaded images are served at the `/uploads` endpoint (NOT `/api/uploads`):

- **Correct URL**: `http://157.173.127.142:4001/uploads/transactions/general/filename.png`
- **Incorrect URL**: `http://157.173.127.142:4001/api/uploads/transactions/general/filename.png`

The backend automatically generates URLs using the `toPublicUrl()` function which creates paths like `/uploads/{entity}/{entityId}/{filename}`.

**Important for Frontend Development:**
- The backend returns relative paths like `/uploads/transactions/{entityId}/filename.png`
- These paths should be accessed directly without the `/api` prefix
- When constructing image URLs in the frontend, use the base URL without `/api`: `http://157.173.127.142:4001/uploads/...`
- Do NOT concatenate the API base URL (`http://157.173.127.142:4001/api`) with image paths

Example frontend code:
```javascript
// ❌ Wrong - Don't do this:
const imageUrl = `${API_BASE_URL}/uploads/transactions/123/image.png`; 
// Results in: http://157.173.127.142:4001/api/uploads/... (WRONG)

// ✅ Correct - Use base URL without /api for images:
const imageUrl = `${API_BASE_URL.replace('/api', '')}/uploads/transactions/123/image.png`;
// Or better: const IMAGE_BASE_URL = 'http://157.173.127.142:4001';
// const imageUrl = `${IMAGE_BASE_URL}${relativePath}`; // relativePath = /uploads/...
```

To backup volumes:

```bash
# Backup MySQL data
docker run --rm -v alefdelta_mysql_data:/data -v $(pwd):/backup alpine tar czf /backup/mysql_backup.tar.gz /data

# Backup uploads (already on host, just copy the directory)
tar czf uploads_backup.tar.gz ./alef_delta_sacco_backend/uploads/
```

## Troubleshooting

### Services Won't Start

1. Check Docker is running: `docker info`
2. Check logs: `docker-compose logs`
3. Verify ports are not in use: `netstat -tulpn | grep -E '3308|4001|5175|8082'`

### Database Connection Issues

1. Verify MySQL is healthy: `docker-compose ps mysql`
2. Check MySQL logs: `docker-compose logs mysql`
3. Verify .env file has correct DB_HOST=mysql

### Frontend Can't Connect to API

1. Verify API is running: `curl http://localhost:4001/api/health`
2. Check frontend .env has correct VITE_API_BASE_URL
3. Rebuild frontend: `docker-compose up -d --build frontend`

### Migration Errors (Duplicate Keys/Columns)

**Problem:** Error like "Duplicate key name" or "Duplicate column name"

**Cause:** Migration tracking system tracks which migrations have been applied. If you see this error, it means:
1. A migration was partially applied before tracking was implemented
2. Two migrations are trying to create the same index/column
3. The `schema_migrations` tracking table may be out of sync

**Solutions:**

Option 1 - Check migration tracking (recommended):
```bash
# View which migrations are tracked as applied
docker-compose exec mysql mysql -u root -p${MYSQL_ROOT_PASSWORD} alef_delta_sacco \
  -e "SELECT * FROM schema_migrations ORDER BY applied_at"
```

Option 2 - Clean slate (WARNING: deletes all data):
```bash
# Reset database completely
docker-compose down -v  # Remove volumes
docker-compose up --build -d  # Fresh start
```

Option 3 - Manual fix for specific migration:
```bash
# Mark a problematic migration as already applied (if it actually was)
docker-compose exec mysql mysql -u root -p${MYSQL_ROOT_PASSWORD} alef_delta_sacco \
  -e "INSERT INTO schema_migrations (migration_name) VALUES ('02_add_indexes.sql')"
```

### Migrations Not Running

1. Check entrypoint script: `docker-compose exec api cat docker-entrypoint.sh`
2. Run migrations manually: `docker-compose exec api npm run migrate`
3. Check database connection: `docker-compose exec api node -e "import('./src/core/db.js')"`
4. Check migration tracking: See "Migration Errors" section above

## Production Deployment

For production, ensure:

1. Update `.env` files with production secrets
2. Use strong passwords for MySQL root user
3. Configure proper CORS origins
4. Enable HTTPS via reverse proxy (nginx/traefik)
5. Set up proper backups for volumes
6. Configure log rotation
7. Use Docker secrets for sensitive data

## File Structure

```
alefdelta/
├── docker-compose.yml           # Main orchestration file
├── start.sh                     # Start script
├── stop.sh                      # Stop script
├── alef_delta_sacco_backend/
│   ├── Dockerfile
│   ├── docker-entrypoint.sh    # Handles migrations on startup
│   ├── .env                     # Backend configuration
│   └── .dockerignore
└── alef-delta-hub/
    ├── Dockerfile
    ├── nginx.conf              # Nginx configuration for SPA
    ├── .env                     # Frontend configuration
    └── .dockerignore
```

## Notes

- The backend automatically runs migrations on startup
- Seed data is commented out in docker-entrypoint.sh - uncomment if needed
- All services are on the same Docker network (`alefdelta_network`)
- Uploads are persisted in the `api_uploads` volume
- Database files are persisted in the `mysql_data` volume

