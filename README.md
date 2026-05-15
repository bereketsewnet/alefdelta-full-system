# ALEF-DELTA SACCO Management System

A comprehensive microfinance management system with three main components:

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    ALEF-DELTA SACCO System                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────┐  │
│  │ Staff Portal │  │Member Portal │  │   Backend API   │  │
│  │   (React)    │  │   (React)    │  │   (Node.js)     │  │
│  │   Port 5175  │  │   Port 7070  │  │   Port 4001     │  │
│  └──────────────┘  └──────────────┘  └─────────────────┘  │
│         │                 │                    │            │
│         └─────────────────┴────────────────────┘            │
│                           │                                 │
│                  ┌────────▼────────┐                        │
│                  │   MySQL 8.0     │                        │
│                  │   Port 3308     │                        │
│                  └─────────────────┘                        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## 📦 Components

### 1. **Staff Portal** (`alef-delta-hub/`)
- **Technology**: React + TypeScript + Vite
- **Port**: 5175
- **Users**: Admin, Manager, Teller, Credit Officer
- **Features**:
  - Member management
  - Account operations (deposits, withdrawals)
  - Loan processing and approval
  - Transaction history
  - System configuration
  - Reports and analytics

### 2. **Member Portal** (`alef_delta_sacco_member_portal/`)
- **Technology**: React + TypeScript + Vite
- **Port**: 7070
- **Users**: SACCO Members
- **Features**:
  - View account balance
  - View transaction history
  - View loan details
  - Request deposits/withdrawals
  - Apply for loans
  - Profile management

### 3. **Backend API** (`alef_delta_sacco_backend/`)
- **Technology**: Node.js + Express
- **Port**: 4001
- **Database**: MySQL 8.0
- **Features**:
  - RESTful API
  - JWT authentication
  - Role-based access control
  - Automated jobs (penalties, interest, lifecycle)
  - SMS notifications
  - File uploads
  - Comprehensive logging

### 4. **Database**
- **Technology**: MySQL 8.0
- **Port**: 3308
- **GUI**: Adminer (Port 8082)

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose
- Git

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd alefdelta
```

2. **Configure environment variables**
```bash
# Backend configuration
cp alef_delta_sacco_backend/.env.example alef_delta_sacco_backend/.env
# Edit the .env file with your settings

# Frontend configuration (if needed)
cp alef-delta-hub/.env.example alef-delta-hub/.env
```

3. **Start all services**
```bash
chmod +x start.sh
./start.sh
```

This will:
- Build all Docker images
- Start all containers
- Run database migrations
- Initialize the system

### Access Points

After starting, access the services at:

| Service | URL | Description |
|---------|-----|-------------|
| **Staff Portal** | http://localhost:5175 | Internal staff web application |
| **Member Portal** | http://localhost:7070 | Member-facing web application |
| **API** | http://localhost:4001/api | Backend REST API |
| **API Health** | http://localhost:4001/api/health | Health check endpoint |
| **API Docs** | http://localhost:4001/api-docs | Swagger documentation |
| **Adminer** | http://localhost:8082 | Database management GUI |

### Default Credentials

**Admin User:**
- Email: `admin@alefdelta.com`
- Password: `Admin@123`

To seed the admin user:
```bash
docker-compose exec api npm run seed:admin
```

## 🛠️ Development

### Running in Development Mode

**Backend:**
```bash
cd alef_delta_sacco_backend
npm install
npm run dev
```

**Staff Portal:**
```bash
cd alef-delta-hub
npm install
npm run dev
```

**Member Portal:**
```bash
cd alef_delta_sacco_member_portal
npm install
npm run dev
```

### Building for Production

All services are automatically built when using Docker Compose:
```bash
docker-compose up -d --build
```

### Database Migrations

Migrations run automatically on container startup. To run manually:
```bash
docker-compose exec api npm run migrate
```

## 📋 Management Scripts

### Start Services
```bash
./start.sh
```

### Stop Services
```bash
./stop.sh
```

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f api
docker-compose logs -f frontend
docker-compose logs -f member_portal
```

### Restart a Service
```bash
docker-compose restart api
docker-compose restart frontend
docker-compose restart member_portal
```

### Rebuild a Service
```bash
docker-compose up -d --build --no-deps frontend
docker-compose up -d --build --no-deps member_portal
docker-compose up -d --build --no-deps api
```

## 🔧 Configuration

### Environment Variables

**Backend** (`alef_delta_sacco_backend/.env`):
```env
# Database
DB_HOST=mysql
DB_PORT=3306
DB_NAME=alef_delta_sacco
DB_USER=alefdelta_admin
DB_PASSWORD=your_password

# JWT
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=24h

# Server
PORT=4000
NODE_ENV=production

# SMS (optional)
SMS_API_KEY=your_sms_api_key
SMS_SENDER_ID=ALEFDELTA
```

**Frontend** (`alef-delta-hub/.env`):
```env
VITE_API_BASE_URL=http://157.173.127.142:4001/api
```

**Member Portal** (`alef_delta_sacco_member_portal/.env`):
```env
VITE_API_BASE_URL=http://157.173.127.142:4001/api
```

### Docker Compose Configuration

Edit `docker-compose.yml` to:
- Change ports
- Adjust resource limits
- Configure networks
- Add volumes

## 📚 Features

### Automated Jobs
The system runs automated jobs daily:
- **Penalty Processing**: Calculates and applies penalties for overdue loans
- **Interest Posting**: Posts monthly interest on savings accounts
- **Member Lifecycle**: Updates member status based on activity

### Security
- JWT-based authentication
- Role-based access control (RBAC)
- Password hashing with bcrypt
- SQL injection prevention
- XSS protection
- CORS configuration

### File Uploads
Supported file types:
- Images: JPG, PNG, GIF
- Documents: PDF, DOC, DOCX
- Max size: 5MB per file

### SMS Notifications
- Loan approval notifications
- Payment confirmations
- Penalty alerts
- Balance updates

## 🧪 Testing

### API Health Check
```bash
curl http://localhost:4001/api/health
```

### Database Connection
```bash
mysql -h 127.0.0.1 -P 3308 -u alefdelta_admin -p alef_delta_sacco
```

## 📖 Documentation

- **User Manual**: See `USER_MANUAL.md` for detailed user guides
- **API Documentation**: http://localhost:4001/api-docs (when running)
- **Database Schema**: See `alef_delta_sacco_backend/migrations/`

## 🐛 Troubleshooting

### Services won't start
```bash
# Check Docker is running
docker info

# Check logs
docker-compose logs

# Rebuild from scratch
docker-compose down -v
docker-compose up -d --build
```

### Database connection errors
```bash
# Check MySQL is healthy
docker-compose ps

# Restart MySQL
docker-compose restart mysql

# Check MySQL logs
docker-compose logs mysql
```

### Frontend not loading
```bash
# Clear browser cache
# Check browser console for errors

# Rebuild frontend
docker-compose up -d --build --no-deps frontend
```

### Port already in use
```bash
# Find process using port
lsof -i :5175
lsof -i :7070
lsof -i :4001

# Kill process or change port in docker-compose.yml
```

## 🔄 Backup & Restore

### Backup Database
```bash
docker-compose exec mysql mysqldump -u root -p alef_delta_sacco > backup.sql
```

### Restore Database
```bash
docker-compose exec -T mysql mysql -u root -p alef_delta_sacco < backup.sql
```

### Backup Uploads
```bash
tar -czf uploads_backup.tar.gz alef_delta_sacco_backend/uploads/
```

## 📝 Version Information

- **Node.js**: 20.18.1
- **MySQL**: 8.0
- **React**: 18.3.1
- **Vite**: 5.4.19

## 🤝 Support

For issues and questions:
1. Check the User Manual (`USER_MANUAL.md`)
2. Review logs: `docker-compose logs -f`
3. Check database: http://localhost:8082

## 📄 License

Proprietary - ALEF-DELTA SACCO

---

**Built with ❤️ for ALEF-DELTA SACCO**

 to remove unnessery cash
 sudo docker system prune -a --volumes -f