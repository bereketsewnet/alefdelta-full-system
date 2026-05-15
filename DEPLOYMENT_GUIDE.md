# ALEF-DELTA SACCO - Deployment Guide

## 🚀 Quick Deployment

### All Services in One Command

```bash
./start.sh
```

This script will:
1. ✅ Check for required .env files
2. ✅ Verify Docker is running
3. ✅ Build all Docker images
4. ✅ Start all containers
5. ✅ Run database migrations
6. ✅ Display service URLs

## 📦 Services Overview

| Service | Container Name | Port | URL |
|---------|---------------|------|-----|
| **Staff Portal** | `alefdelta_frontend` | 5175 | http://localhost:5175 |
| **Member Portal** | `alefdelta_member_portal` | 7070 | http://localhost:7070 |
| **Backend API** | `alefdelta_api` | 4001 | http://localhost:4001 |
| **MySQL Database** | `alefdelta_mysql` | 3308 | localhost:3308 |
| **Adminer (DB GUI)** | `alefdelta_adminer` | 8082 | http://localhost:8082 |

## 🔧 Manual Deployment Steps

### 1. Prerequisites

Ensure you have:
- Docker Engine 20.10+
- Docker Compose 2.0+
- At least 2GB free RAM
- At least 5GB free disk space

Check versions:
```bash
docker --version
docker-compose --version
```

### 2. Environment Configuration

**Backend** (`alef_delta_sacco_backend/.env`):
```env
# Database Configuration
DB_HOST=mysql
DB_PORT=3306
DB_NAME=alef_delta_sacco
DB_USER=alefdelta_admin
DB_PASSWORD=~HNiBgmo56wag~y3

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=24h

# Server Configuration
PORT=4000
NODE_ENV=production

# SMS Configuration (Optional)
SMS_API_KEY=your_sms_api_key
SMS_SENDER_ID=ALEFDELTA
```

**Staff Portal** (`alef-delta-hub/.env`):
```env
VITE_API_BASE_URL=http://157.173.127.142:4001/api
```

**Member Portal** (`alef_delta_sacco_member_portal/.env`):
```env
VITE_API_BASE_URL=http://157.173.127.142:4001/api
```

### 3. Build Services

Build all services:
```bash
docker-compose build
```

Build specific service:
```bash
docker-compose build frontend
docker-compose build member_portal
docker-compose build api
```

### 4. Start Services

Start all services:
```bash
docker-compose up -d
```

Start specific service:
```bash
docker-compose up -d frontend
docker-compose up -d member_portal
docker-compose up -d api
```

### 5. Verify Deployment

Check service status:
```bash
docker-compose ps
```

Expected output:
```
NAME                     STATUS         PORTS
alefdelta_api            Up (healthy)   0.0.0.0:4001->4000/tcp
alefdelta_frontend       Up             0.0.0.0:5175->80/tcp
alefdelta_member_portal  Up             0.0.0.0:7070->80/tcp
alefdelta_mysql          Up (healthy)   0.0.0.0:3308->3306/tcp
alefdelta_adminer        Up             0.0.0.0:8082->8080/tcp
```

### 6. Initialize Database

Seed admin user:
```bash
docker-compose exec api npm run seed:admin
```

Default admin credentials:
- Email: `admin@alefdelta.com`
- Password: `Admin@123`

### 7. Test Services

Test API health:
```bash
curl http://localhost:4001/api/health
```

Expected response:
```json
{"status":"ok"}
```

Test Staff Portal:
```bash
curl -I http://localhost:5175
```

Test Member Portal:
```bash
curl -I http://localhost:7070
```

## 🔄 Service Management

### View Logs

All services:
```bash
docker-compose logs -f
```

Specific service:
```bash
docker-compose logs -f api
docker-compose logs -f frontend
docker-compose logs -f member_portal
```

Last 100 lines:
```bash
docker-compose logs --tail=100 api
```

### Restart Services

All services:
```bash
docker-compose restart
```

Specific service:
```bash
docker-compose restart api
docker-compose restart frontend
docker-compose restart member_portal
```

### Stop Services

All services:
```bash
./stop.sh
# or
docker-compose down
```

Stop but keep data:
```bash
docker-compose stop
```

Stop and remove volumes (⚠️ deletes all data):
```bash
docker-compose down -v
```

### Update Services

After code changes:
```bash
# Rebuild and restart specific service
docker-compose up -d --build --no-deps frontend
docker-compose up -d --build --no-deps member_portal
docker-compose up -d --build --no-deps api
```

## 🗄️ Database Management

### Access MySQL CLI

```bash
docker-compose exec mysql mysql -u alefdelta_admin -p alef_delta_sacco
```

### Backup Database

```bash
docker-compose exec mysql mysqldump -u root -p alef_delta_sacco > backup_$(date +%Y%m%d_%H%M%S).sql
```

### Restore Database

```bash
docker-compose exec -T mysql mysql -u root -p alef_delta_sacco < backup.sql
```

### Access Adminer GUI

1. Open http://localhost:8082
2. Login with:
   - System: `MySQL`
   - Server: `mysql`
   - Username: `alefdelta_admin`
   - Password: `~HNiBgmo56wag~y3`
   - Database: `alef_delta_sacco`

## 🔐 Security Checklist

Before production deployment:

- [ ] Change all default passwords
- [ ] Update JWT_SECRET to a strong random value
- [ ] Configure firewall rules
- [ ] Enable HTTPS/SSL
- [ ] Set up regular backups
- [ ] Configure SMS provider
- [ ] Review and update CORS settings
- [ ] Enable rate limiting
- [ ] Set up monitoring and alerts
- [ ] Review file upload restrictions

## 🌐 Production Deployment

### Update API URLs

For production, update the API URLs in:

**Staff Portal** (`.env`):
```env
VITE_API_BASE_URL=https://api.yourdomain.com/api
```

**Member Portal** (`.env`):
```env
VITE_API_BASE_URL=https://api.yourdomain.com/api
```

### SSL/HTTPS Setup

Add nginx reverse proxy with SSL:

```yaml
# docker-compose.yml
services:
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./nginx/ssl:/etc/nginx/ssl
    depends_on:
      - frontend
      - member_portal
      - api
```

### Environment-Specific Builds

Development:
```bash
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d
```

Production:
```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

## 📊 Monitoring

### Health Checks

API health:
```bash
curl http://localhost:4001/api/health
```

Database health:
```bash
docker-compose exec mysql mysqladmin ping -h localhost -u root -p
```

### Resource Usage

```bash
docker stats
```

### Container Inspection

```bash
docker inspect alefdelta_api
docker inspect alefdelta_frontend
docker inspect alefdelta_member_portal
```

## 🐛 Troubleshooting

### Port Already in Use

```bash
# Find process using port
lsof -i :5175
lsof -i :7070
lsof -i :4001

# Kill process
kill -9 <PID>

# Or change port in docker-compose.yml
```

### Container Won't Start

```bash
# Check logs
docker-compose logs <service_name>

# Remove and recreate
docker-compose rm -f <service_name>
docker-compose up -d <service_name>
```

### Database Connection Issues

```bash
# Check MySQL is healthy
docker-compose ps mysql

# Restart MySQL
docker-compose restart mysql

# Check MySQL logs
docker-compose logs mysql
```

### Frontend Build Errors

```bash
# Clear build cache
docker-compose build --no-cache frontend
docker-compose build --no-cache member_portal

# Check for syntax errors
docker-compose logs frontend
docker-compose logs member_portal
```

### API Not Responding

```bash
# Check API logs
docker-compose logs api

# Check if migrations ran
docker-compose exec api ls -la /app/migrations

# Manually run migrations
docker-compose exec api npm run migrate
```

## 🔄 Update Procedure

### 1. Pull Latest Changes

```bash
git pull origin main
```

### 2. Backup Database

```bash
docker-compose exec mysql mysqldump -u root -p alef_delta_sacco > backup_before_update.sql
```

### 3. Rebuild Services

```bash
docker-compose build
```

### 4. Update Services

```bash
docker-compose up -d
```

### 5. Run Migrations

```bash
docker-compose exec api npm run migrate
```

### 6. Verify

```bash
docker-compose ps
curl http://localhost:4001/api/health
```

## 📋 Maintenance Tasks

### Daily
- Monitor logs for errors
- Check disk space
- Verify backups completed

### Weekly
- Review security logs
- Update dependencies
- Test backup restoration

### Monthly
- Review and rotate logs
- Update Docker images
- Security audit

## 🆘 Emergency Procedures

### Complete System Restart

```bash
./stop.sh
docker system prune -f
./start.sh
```

### Restore from Backup

```bash
# Stop services
docker-compose down

# Start only database
docker-compose up -d mysql

# Wait for MySQL to be ready
sleep 10

# Restore backup
docker-compose exec -T mysql mysql -u root -p alef_delta_sacco < backup.sql

# Start all services
docker-compose up -d
```

### Reset Everything (⚠️ DANGER)

```bash
# This will delete ALL data
docker-compose down -v
docker system prune -af --volumes
./start.sh
docker-compose exec api npm run seed:admin
```

## 📞 Support

For deployment issues:
1. Check logs: `docker-compose logs -f`
2. Check service status: `docker-compose ps`
3. Review this guide
4. Check USER_MANUAL.md for application issues

---

**Last Updated**: December 2025
**Version**: 1.0.0

