# API Specification - Automated Cryptocurrency Futures Trading System

## Base URL
```
http://localhost:3001/api
```

## Authentication
All protected endpoints require a valid JWT token in the Authorization header:
```
Authorization: Bearer <jwt_token>
```

---

## 1. Authentication Routes (`/api/auth/*`)
**No authentication required**

### POST `/api/auth/login`
**Purpose**: User authentication and JWT token generation

### POST `/api/auth/signup`
**Purpose**: User registration

### POST `/api/auth/logout`
**Purpose**: User logout

---

## 2. Public Routes (`/api/public/*`)
**No authentication required**

### GET `/api/public/health`
**Purpose**: System health check

### GET `/api/public/tokens`
**Purpose**: Get list of available trading tokens

---

## 3. User Routes (`/api/user/*`)
**Authentication required**

### GET `/api/user/landing`
**Purpose**: Get user's landing page data

### GET `/api/user/profile`
**Purpose**: Get current user's detailed information

### GET `/api/user/orders`
**Purpose**: List user's orders

### POST `/api/user/tokens`
**Purpose**: Add new token to user's portfolio

---

## 4. Admin Routes (`/api/admin/*`)
**Admin authentication required**

### GET `/api/admin/landing`
**Purpose**: Get admin dashboard landing data

### GET `/api/admin/users`
**Purpose**: List all users with basic info

### GET `/api/admin/orders`
**Purpose**: List all orders across users

### GET `/api/admin/bills`
**Purpose**: List all commission bills

---

## 5. Backtest Routes (`/api/backtest/*`)
**Authentication required**

### GET `/api/backtest/tokens`
**Purpose**: Get available token data for backtesting

### POST `/api/backtest/execute`
**Purpose**: Send backtest request and get results

---

## Error Handling

### Standard Error Response Format
```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error information (optional)"
}
```

### HTTP Status Codes
- `200` - Success
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error
