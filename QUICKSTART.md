# Quick Start Guide

## Prerequisites

- Node.js v18+ installed
- PostgreSQL installed and running
- Stripe account (free test mode)
- Postman or similar API client

## Installation

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Database

**Option A: Using the setup script**
```bash
./scripts/setup-db.sh
```

**Option B: Manual setup**
```bash
# Login to PostgreSQL
sudo -u postgres psql

# Create database
CREATE DATABASE nest_api_db;

# Exit
\q
```

### 3. Configure Environment Variables

Copy the example environment file:
```bash
cp .env.example .env
```

Edit `.env` and update with your credentials:

```env
# Database - Update with your PostgreSQL credentials
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=your_password
DATABASE_NAME=nest_api_db

# JWT - Generate a strong random secret
JWT_SECRET=your-super-secret-jwt-key-change-this
JWT_EXPIRES_IN=7d

# Stripe - Get from https://dashboard.stripe.com/test/apikeys
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Application
PORT=3000
NODE_ENV=development
```

**Important**: 
- Generate a strong JWT secret (use `openssl rand -base64 32`)
- Get Stripe test keys from your Stripe dashboard

### 4. Build the Application

```bash
npm run build
```

### 5. Start the Server

**Development mode (with auto-reload)**:
```bash
npm run start:dev
```

**Production mode**:
```bash
npm run start:prod
```

Server will start at: `http://localhost:3000`

---

## Quick Test

### Using cURL

1. **Register a user**:
```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123"
  }'
```

2. **Login**:
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

Save the `accessToken` from the response.

3. **Get profile**:
```bash
curl http://localhost:3000/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

4. **List products** (public endpoint):
```bash
curl http://localhost:3000/products
```

### Using Postman

1. Import `postman_collection.json` into Postman
2. Update collection variables if needed
3. Run requests in order:
   - Register User
   - Login (token auto-saves)
   - Create Product
   - Create Order
   - Create Checkout Session

---

## Stripe Webhook Setup (Local Development)

### 1. Install Stripe CLI

**macOS**:
```bash
brew install stripe/stripe-cli/stripe
```

**Linux**:
```bash
wget https://github.com/stripe/stripe-cli/releases/download/v1.19.4/stripe_1.19.4_linux_x86_64.tar.gz
tar -xvf stripe_1.19.4_linux_x86_64.tar.gz
sudo mv stripe /usr/local/bin/
```

**Windows**:
Download from [Stripe CLI releases](https://github.com/stripe/stripe-cli/releases)

### 2. Login to Stripe

```bash
stripe login
```

This will open a browser to authorize.

### 3. Forward Webhooks to Local Server

```bash
stripe listen --forward-to localhost:3000/webhooks/stripe
```

**Important**: Copy the webhook signing secret (starts with `whsec_`) and update your `.env`:

```env
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
```

### 4. Restart Your Application

```bash
# Stop the server (Ctrl+C)
# Then restart
npm run start:dev
```

### 5. Test Webhook

In another terminal:
```bash
stripe trigger checkout.session.completed
```

Check your application logs to see the webhook being processed.

---

## Testing the Complete Flow

### End-to-End Test

1. **Register and Login**
```bash
# Register
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@test.com","password":"test123"}'

# Login and save token
TOKEN=$(curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123"}' \
  | jq -r '.accessToken')
```

2. **Create Product**
```bash
PRODUCT_ID=$(curl -X POST http://localhost:3000/products \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Product","description":"Test","price":99.99,"isActive":true}' \
  | jq -r '.id')
```

3. **Create Order**
```bash
ORDER_ID=$(curl -X POST http://localhost:3000/orders \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"productId\":\"$PRODUCT_ID\"}" \
  | jq -r '.id')
```

4. **Create Checkout Session**
```bash
curl -X POST http://localhost:3000/payments/create-checkout-session \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"orderId\":\"$ORDER_ID\"}"
```

5. **Visit the checkout URL** and complete payment with test card:
   - Card: `4242 4242 4242 4242`
   - Expiry: Any future date
   - CVC: Any 3 digits

6. **Verify order status updated to PAID**:
```bash
curl http://localhost:3000/orders/$ORDER_ID \
  -H "Authorization: Bearer $TOKEN"
```

---

## Common Issues

### Port Already in Use

```bash
# Find process using port 3000
lsof -ti:3000

# Kill the process
kill -9 $(lsof -ti:3000)
```

Or change port in `.env`:
```env
PORT=3001
```

### Database Connection Failed

Check if PostgreSQL is running:
```bash
sudo systemctl status postgresql
```

Start if not running:
```bash
sudo systemctl start postgresql
```

Verify credentials:
```bash
psql -h localhost -U postgres -d nest_api_db
```

### Stripe Webhook Errors

1. Verify webhook secret is correct
2. Check Stripe CLI is running
3. Ensure application is running
4. Check logs for errors

### JWT Token Invalid

1. Check JWT_SECRET matches in .env
2. Ensure token hasn't expired
3. Verify Authorization header format: `Bearer <token>`

---

## Project Structure

```
src/
├── auth/              # Authentication (register, login, JWT)
├── products/          # Product management
├── orders/            # Order management
├── payments/          # Stripe payment integration
├── webhooks/          # Stripe webhook handler
├── users/             # User entity
├── common/            # Shared utilities
├── config/            # Configuration files
├── app.module.ts      # Root module
└── main.ts            # Application entry point
```

---

## Available Scripts

```bash
npm run start          # Start in production mode
npm run start:dev      # Start in development mode with watch
npm run start:debug    # Start in debug mode
npm run build          # Build for production
```

---

## API Endpoints Summary

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /auth/register | No | Register new user |
| POST | /auth/login | No | Login and get JWT |
| GET | /auth/me | Yes | Get current user profile |
| POST | /products | Yes | Create product |
| GET | /products | No | List active products |
| GET | /products/all | Yes | List all products |
| GET | /products/:id | No | Get product by ID |
| POST | /orders | Yes | Create order |
| GET | /orders/my-orders | Yes | Get user's orders |
| GET | /orders/:id | Yes | Get order by ID |
| POST | /payments/create-checkout-session | Yes | Create Stripe checkout |
| POST | /webhooks/stripe | No | Stripe webhook (public) |

---

## Next Steps

1. ✅ Test all endpoints with Postman
2. ✅ Complete a payment flow
3. ✅ Verify webhook updates order status
4. 📚 Read [TESTING.md](TESTING.md) for detailed testing guide
5. 🚀 Read [DEPLOYMENT.md](DEPLOYMENT.md) for deployment guide
6. 📖 Review code and architecture

---

## Support

- Check [README.md](README.md) for full documentation
- See [TESTING.md](TESTING.md) for testing guide
- See [DEPLOYMENT.md](DEPLOYMENT.md) for deployment guide

## Resources

- [NestJS Documentation](https://docs.nestjs.com)
- [Stripe Test Cards](https://stripe.com/docs/testing)
- [TypeORM Documentation](https://typeorm.io)
- [Postman Documentation](https://learning.postman.com)

---

**🎉 You're all set! Start building amazing APIs!**
