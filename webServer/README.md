# Senior Project Setup

## Prerequisites
- Node.js (v18+)
- Docker
- Git

## Setup Steps

### 1. Clone Repository
```bash
git clone <your-repo-url>
cd SeniorProject
```

### 2. Create Environment File
```bash
cd webServer
touch .env
```

Add to `webServer/.env`:
```env
DATABASE_URL="mysql://root:moneymachine@localhost:3307/moneymachine"
JWT_SECRET="your-secret-key-here"
PORT=3000
```

### 3. Start Database
```bash
# From root directory
docker-compose up -d database
```

### 4. Install Dependencies
```bash
cd webServer
npm install
```

### 5. Setup Database
```bash
npx prisma generate
npx prisma db push
```

### 6. Start Server
```bash
npm run dev
```

## Access Points
- **API**: http://localhost:3000
- **Documentation**: http://localhost:3000/api-docs
- **Health Check**: http://localhost:3000/health

## Quick Test
```bash
# Create test user
curl -X POST http://localhost:3000/api/auth/create-test-user

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

## Available Scripts
- `npm run dev` - Start development server
- `npm test` - Run tests
- `npm run lint` - Check code style
- `npm run db:seed` - Seed database
