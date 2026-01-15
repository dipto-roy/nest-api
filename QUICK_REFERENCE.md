# 🎯 Quick Reference Card

## Essential Commands

```bash
# Installation
npm install

# Development
npm run start:dev          # Start with hot-reload
npm run build              # Build for production
npm run start:prod         # Run production build

# Database
./scripts/setup-db.sh      # Setup PostgreSQL database

# Stripe CLI (Webhooks)
stripe listen --forward-to localhost:3000/webhooks/stripe
```

---

## Environment Variables (.env)

```env
# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=<your-password>
DATABASE_NAME=nest_api_db

# JWT
JWT_SECRET=<generate-strong-secret>
JWT_EXPIRES_IN=7d

# Stripe (Test Mode)
STRIPE_SECRET_KEY=sk_test_<your-key>
STRIPE_WEBHOOK_SECRET=whsec_<your-secret>

# App
PORT=3000
NODE_ENV=development
CORS_ORIGINS=http://localhost:3000
```

---

## API Quick Reference

### Authentication
```bash
# Register
POST /auth/register
{"name":"John","email":"john@test.com","password":"test123"}

# Login
POST /auth/login
{"email":"john@test.com","password":"test123"}
# Returns: { accessToken, user }

# Profile
GET /auth/me
Headers: Authorization: Bearer <token>
```

### Products
```bash
# Create (Protected)
POST /products
Headers: Authorization: Bearer <token>
{"name":"Premium","description":"Plan","price":99.99,"isActive":true}

# List Active (Public)
GET /products

# Get by ID (Public)
GET /products/:id
```

### Orders
```bash
# Create (Protected)
POST /orders
Headers: Authorization: Bearer <token>
{"productId":"<uuid>"}

# My Orders (Protected)
GET /orders/my-orders
Headers: Authorization: Bearer <token>

# Get by ID (Protected)
GET /orders/:id
Headers: Authorization: Bearer <token>
```

### Payments
```bash
# Create Checkout (Protected)
POST /payments/create-checkout-session
Headers: Authorization: Bearer <token>
{"orderId":"<uuid>"}
# Returns: { checkoutUrl, sessionId }
```

---

## Stripe Test Cards

```
Success: 4242 4242 4242 4242
Decline: 4000 0000 0000 0002
3D Secure: 4000 0027 6000 3184

Expiry: Any future date
CVC: Any 3 digits
ZIP: Any 5 digits
```

---

## Order Status Flow

```
1. Create Order → status: PENDING
2. Create Checkout → stripeSessionId saved
3. Complete Payment → Stripe sends webhook
4. Webhook Handler → status: PAID or FAILED
```

---

## Troubleshooting

### Port in use
```bash
lsof -ti:3000
kill -9 $(lsof -ti:3000)
```

### Database connection
```bash
sudo systemctl status postgresql
psql -h localhost -U postgres -d nest_api_db
```

### JWT expired
```bash
# Login again to get new token
POST /auth/login
```

### Webhook not working
```bash
# Check Stripe CLI is running
stripe listen --forward-to localhost:3000/webhooks/stripe

# Verify webhook secret in .env
# Restart application
```

---

## File Locations

```
📁 Source Code:        src/
📁 Build Output:       dist/
📄 Environment:        .env
📄 Postman:            postman_collection.json
📄 Main Docs:          README.md
📄 Quick Setup:        QUICKSTART.md
📄 Testing Guide:      TESTING.md
📄 Deployment:         DEPLOYMENT.md
📄 Architecture:       ARCHITECTURE.md
📄 Summary:            PROJECT_SUMMARY.md
```

---

## HTTP Status Codes

```
200 OK              - Success (GET, PUT)
201 Created         - Resource created (POST)
400 Bad Request     - Validation error
401 Unauthorized    - Invalid/missing auth
404 Not Found       - Resource not found
409 Conflict        - Duplicate (email exists)
500 Server Error    - Internal error
```

---

## Entity Relationships

```
User (1) ←→ (M) Order (M) ←→ (1) Product

User:     id, name, email, password, createdAt
Product:  id, name, description, price, isActive, createdAt
Order:    id, userId, productId, amount, status, stripeSessionId, createdAt
```

---

## Security Checklist

- [x] Passwords hashed with bcrypt
- [x] JWT tokens with expiry
- [x] Input validation (DTOs)
- [x] Webhook signature verification
- [x] Environment variables for secrets
- [x] CORS enabled
- [x] Password excluded from responses

---

## Deployment URLs

```
Render:        https://<app-name>.onrender.com
Railway:       https://<app-name>.up.railway.app
Heroku:        https://<app-name>.herokuapp.com
```

---

## Documentation

| Doc | Purpose | Size |
|-----|---------|------|
| README.md | Complete guide | 9.6 KB |
| QUICKSTART.md | Fast setup | 7.8 KB |
| TESTING.md | Test guide | 7.7 KB |
| DEPLOYMENT.md | Deploy guide | 6.9 KB |
| ARCHITECTURE.md | Design docs | 15.2 KB |
| PROJECT_SUMMARY.md | Overview | 11.5 KB |

---

## Quick Test Flow

```bash
1. npm install
2. ./scripts/setup-db.sh
3. cp .env.example .env
4. Edit .env with credentials
5. npm run build
6. npm run start:dev
7. Import postman_collection.json
8. Run: Register → Login → Create Product → Create Order → Checkout
9. Complete payment with 4242 4242 4242 4242
10. Verify order status changed to PAID
```

---

## Need Help?

1. **Setup Issues**: See QUICKSTART.md
2. **API Testing**: See TESTING.md  
3. **Deployment**: See DEPLOYMENT.md
4. **Architecture**: See ARCHITECTURE.md
5. **Overview**: See PROJECT_SUMMARY.md

---

**🚀 Ready to Run! Import Postman Collection and Test!**
