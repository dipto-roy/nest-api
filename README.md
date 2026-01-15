# NestJS REST API - Backend Technical Assignment

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=flat&logo=nestjs&logoColor=white)](https://nestjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=flat&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Stripe](https://img.shields.io/badge/Stripe-008CDD?style=flat&logo=stripe&logoColor=white)](https://stripe.com/)
[![JWT](https://img.shields.io/badge/JWT-000000?style=flat&logo=jsonwebtokens&logoColor=white)](https://jwt.io/)

> 🎯 **Status**: ✅ Production-Ready | 📦 **Complete**: 100% | 🔒 **Secure**: Yes

A production-ready backend REST API built with NestJS, PostgreSQL, TypeORM, JWT authentication, and Stripe payment integration for a technical assignment.

---

## 🚀 Quick Start (5 Minutes)

```bash
# 1. Install dependencies
npm install

# 2. Setup database
./scripts/setup-db.sh

# 3. Configure environment
cp .env.example .env
# Edit .env with your credentials

# 4. Build and run
npm run build
npm run start:dev

# 5. Test with Postman
# Import postman_collection.json
```

📖 **Detailed Guide**: See [QUICKSTART.md](QUICKSTART.md)

- **Framework**: NestJS
- **Database**: PostgreSQL with TypeORM
- **Authentication**: JWT (JSON Web Tokens)
- **Payment Gateway**: Stripe (Test Mode)
- **Password Hashing**: bcrypt
- **Validation**: class-validator & class-transformer
- **Configuration**: dotenv

## 📋 Features

### ✅ Authentication Module
- User registration with bcrypt password hashing
- JWT-based login with access token
- Protected `/me` endpoint for user profile
- JWT strategy and auth guards

### ✅ Product/Plan Module
- Product entity with pricing
- Create product endpoint (protected)
- List all active products (public)
- Product activation status management

### ✅ Order Module
- Order creation with PENDING status
- Order-User-Product relationships
- Order history by user
- Status tracking (PENDING, PAID, FAILED)

### ✅ Payment Module (Stripe)
- Stripe Checkout Session creation
- Secure Stripe session ID storage
- Environment-based configuration

### ✅ Webhook Handler (CRITICAL)
- Stripe webhook signature verification
- Automatic order status updates
- Event handling for payment success/failure
- Source of truth for payment status

### ✅ Code Quality
- Modular NestJS architecture
- DTO validation decorators
- Centralized error handling
- Meaningful HTTP status codes
- Clean separation of concerns

## 🛠️ Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd nest-api
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment variables**
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
```env
# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=your_password
DATABASE_NAME=nest_api_db

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d

# Stripe (Test Mode)
STRIPE_SECRET_KEY=sk_test_your_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Application
PORT=3000
NODE_ENV=development
```

4. **Create PostgreSQL database**
```bash
createdb nest_api_db
```

5. **Run the application**
```bash
# Development mode
npm run start:dev

# Production mode
npm run build
npm run start:prod
```

## 📡 API Endpoints

### Authentication
```
POST   /auth/register          - Register new user
POST   /auth/login             - Login and get JWT token
GET    /auth/me                - Get current user profile (Protected)
```

### Products
```
POST   /products               - Create product (Protected)
GET    /products               - List all active products
GET    /products/all           - List all products (Protected)
GET    /products/:id           - Get product by ID
```

### Orders
```
POST   /orders                 - Create new order (Protected)
GET    /orders/my-orders       - Get user's orders (Protected)
GET    /orders/:id             - Get order by ID (Protected)
```

### Payments
```
POST   /payments/create-checkout-session   - Create Stripe checkout (Protected)
```

### Webhooks
```
POST   /webhooks/stripe        - Stripe webhook endpoint (Public)
```

## 🧪 Testing with Postman

### 1. Register User
```json
POST http://localhost:3000/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

### 2. Login
```json
POST http://localhost:3000/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}

Response:
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {...}
}
```

### 3. Create Product
```json
POST http://localhost:3000/products
Authorization: Bearer <your-jwt-token>
Content-Type: application/json

{
  "name": "Premium Plan",
  "description": "Access to all features",
  "price": 99.99,
  "isActive": true
}
```

### 4. Create Order
```json
POST http://localhost:3000/orders
Authorization: Bearer <your-jwt-token>
Content-Type: application/json

{
  "productId": "product-uuid-here"
}
```

### 5. Create Payment Session
```json
POST http://localhost:3000/payments/create-checkout-session
Authorization: Bearer <your-jwt-token>
Content-Type: application/json

{
  "orderId": "order-uuid-here"
}

Response:
{
  "checkoutUrl": "https://checkout.stripe.com/...",
  "sessionId": "cs_test_..."
}
```

## 🔐 Stripe Webhook Setup

### Local Development (Using Stripe CLI)

1. **Install Stripe CLI**
```bash
# macOS
brew install stripe/stripe-cli/stripe

# Linux
wget https://github.com/stripe/stripe-cli/releases/download/v1.19.4/stripe_1.19.4_linux_x86_64.tar.gz
tar -xvf stripe_1.19.4_linux_x86_64.tar.gz
sudo mv stripe /usr/local/bin/
```

2. **Login to Stripe**
```bash
stripe login
```

3. **Forward webhooks to local server**
```bash
stripe listen --forward-to localhost:3000/webhooks/stripe
```

This will give you a webhook signing secret (whsec_...) - add it to your `.env`:
```env
STRIPE_WEBHOOK_SECRET=whsec_your_local_secret_here
```

4. **Test webhook**
```bash
stripe trigger checkout.session.completed
```

### Production Deployment

1. Deploy your app to Render/Railway
2. Get your public URL (e.g., `https://your-app.onrender.com`)
3. In Stripe Dashboard:
   - Go to Developers → Webhooks
   - Add endpoint: `https://your-app.onrender.com/webhooks/stripe`
   - Select events: `checkout.session.completed`, `payment_intent.succeeded`, `payment_intent.payment_failed`
   - Copy the signing secret to your environment variables

## 🚢 Deployment

### Deploy to Render

1. **Create `render.yaml`** (already configured)
2. **Push to GitHub**
3. **Connect to Render**:
   - Go to render.com
   - New → Web Service
   - Connect repository
   - Render will use `render.yaml` configuration
4. **Set environment variables** in Render dashboard
5. **Add PostgreSQL database** (Render provides free PostgreSQL)

### Deploy to Railway

1. **Install Railway CLI**
```bash
npm install -g @railway/cli
```

2. **Login and deploy**
```bash
railway login
railway init
railway up
```

3. **Add PostgreSQL**
```bash
railway add
# Select PostgreSQL
```

4. **Set environment variables**
```bash
railway variables set STRIPE_SECRET_KEY=sk_test_...
railway variables set STRIPE_WEBHOOK_SECRET=whsec_...
```

## 🏗️ Project Structure

```
src/
├── auth/                      # Authentication module
│   ├── dto/                   # Data transfer objects
│   ├── guards/                # JWT auth guard
│   ├── strategies/            # JWT strategy
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   └── auth.module.ts
├── products/                  # Products module
│   ├── dto/
│   ├── entities/
│   ├── products.controller.ts
│   ├── products.service.ts
│   └── products.module.ts
├── orders/                    # Orders module
│   ├── dto/
│   ├── entities/
│   ├── enums/
│   ├── orders.controller.ts
│   ├── orders.service.ts
│   └── orders.module.ts
├── payments/                  # Stripe payments module
│   ├── dto/
│   ├── payments.controller.ts
│   ├── payments.service.ts
│   └── payments.module.ts
├── webhooks/                  # Stripe webhook handler
│   ├── webhooks.controller.ts
│   └── webhooks.module.ts
├── users/                     # User entity
│   └── entities/
├── common/                    # Shared utilities
│   └── filters/
├── config/                    # Configuration files
│   └── database.config.ts
├── app.module.ts
└── main.ts
```

## 🔑 Best Practices Implemented

1. **Security**
   - Passwords hashed with bcrypt (salt rounds: 10)
   - JWT authentication for protected routes
   - Stripe webhook signature verification
   - Input validation with class-validator

2. **Architecture**
   - Modular structure with feature modules
   - Service layer for business logic
   - DTO validation at controller level
   - Entity relationships with TypeORM

3. **Database**
   - TypeORM with proper entity relations
   - `synchronize: false` recommended for production
   - Use migrations for schema changes in production

4. **Error Handling**
   - Centralized exception filter
   - Meaningful HTTP status codes
   - Descriptive error messages

5. **Configuration**
   - Environment variables for sensitive data
   - Separate configs for development/production
   - CORS enabled for deployment

## 📝 Environment Variables

See [.env.example](.env.example) for complete list of required environment variables.

## 🐛 Troubleshooting

### Database Connection Issues
```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Create database if not exists
createdb nest_api_db
```

### Stripe Webhook Not Working
- Verify webhook secret is correct
- Check webhook endpoint is publicly accessible
- Review Stripe CLI output for errors
- Ensure raw body is preserved for signature verification

### JWT Token Invalid
- Check JWT_SECRET matches between generation and validation
- Verify token expiration (JWT_EXPIRES_IN)
- Ensure Bearer token format in Authorization header

## 📚 Additional Resources

- [NestJS Documentation](https://docs.nestjs.com)
- [Stripe API Reference](https://stripe.com/docs/api)
- [TypeORM Documentation](https://typeorm.io)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

## 📄 License

ISC

## 👤 Author

Backend Developer Technical Assignment
