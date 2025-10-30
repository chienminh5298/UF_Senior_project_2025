
### 1. Create Environment File

Add to `webServer/.env`:
```env
DATABASE_URL="mysql://root:moneymachine@localhost:3307/moneymachine"
JWT_SECRET="your-secret-key-here"
```

### 3. Start Database
```bash
docker-compose up -d ufdatabase
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
npm run db:seed
```

### 6. Start Server
```bash
npm run dev
```

### 7. Docs
Go to http://localhost:3001/api-docs/
