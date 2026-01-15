# Architecture & Design Decisions

## System Architecture

### High-Level Overview

```
┌─────────────┐
│   Client    │ (Postman / Frontend)
│  (HTTP/S)   │
└──────┬──────┘
       │
       │ REST API
       ▼
┌─────────────────────────────────────┐
│        NestJS Application           │
│  ┌─────────────────────────────┐   │
│  │     API Controllers         │   │
│  │  (Auth, Products, Orders)   │   │
│  └──────────┬──────────────────┘   │
│             │                       │
│  ┌──────────▼──────────────────┐   │
│  │      Service Layer          │   │
│  │   (Business Logic)          │   │
│  └──────────┬──────────────────┘   │
│             │                       │
│  ┌──────────▼──────────────────┐   │
│  │     TypeORM Entities        │   │
│  │   (User, Product, Order)    │   │
│  └──────────┬──────────────────┘   │
└─────────────┼───────────────────────┘
              │
              ▼
      ┌───────────────┐
      │  PostgreSQL   │
      │   Database    │
      └───────────────┘

   ┌──────────────────┐
   │  Stripe Webhook  │ ──────────┐
   └──────────────────┘           │
                                  ▼
                         Webhook Controller
                         (Update Order Status)
```

---

## Module Structure

### 1. Authentication Module (`src/auth`)

**Purpose**: Handle user authentication and authorization

**Components**:
- `auth.controller.ts` - HTTP endpoints (register, login, /me)
- `auth.service.ts` - Business logic (user creation, JWT generation)
- `jwt.strategy.ts` - JWT token validation strategy
- `jwt-auth.guard.ts` - Route protection guard
- DTOs for validation

**Design Decisions**:
- ✅ **Password Hashing**: bcrypt with 10 salt rounds (industry standard)
- ✅ **JWT Strategy**: Stateless authentication, no session storage
- ✅ **Token Expiry**: 7 days (configurable via environment)
- ✅ **Password Exclusion**: Using `@Exclude()` decorator to never expose passwords

**Flow**:
```
Register → Hash Password → Save User → Return Success
Login → Verify Password → Generate JWT → Return Token
Protected Route → Verify JWT → Attach User to Request → Proceed
```

---

### 2. Products Module (`src/products`)

**Purpose**: Manage products/plans available for purchase

**Components**:
- `products.controller.ts` - CRUD endpoints
- `products.service.ts` - Business logic
- `product.entity.ts` - Database model
- DTOs for validation

**Design Decisions**:
- ✅ **Active Flag**: `isActive` boolean for soft deletion/hiding
- ✅ **Public Listing**: Active products are publicly accessible
- ✅ **Protected Creation**: Only authenticated users can create products
- ✅ **Price Storage**: Decimal type for precise currency handling

**Endpoints**:
- `POST /products` - Create (Protected)
- `GET /products` - List active (Public)
- `GET /products/all` - List all (Protected)
- `GET /products/:id` - Get by ID (Public)

---

### 3. Orders Module (`src/orders`)

**Purpose**: Manage order lifecycle and status

**Components**:
- `orders.controller.ts` - Order endpoints
- `orders.service.ts` - Order business logic
- `order.entity.ts` - Database model with relations
- `order-status.enum.ts` - Status enumeration

**Design Decisions**:
- ✅ **Status Enum**: PENDING → PAID → FAILED (clear lifecycle)
- ✅ **Initial Status**: All orders start as PENDING
- ✅ **Stripe Session ID**: Stored for webhook correlation
- ✅ **Relations**: Eager loading of User and Product for complete data
- ✅ **Amount Capture**: Copy product price at order creation (price history)

**Order Lifecycle**:
```
1. Create Order (status = PENDING)
2. Create Stripe Checkout (store session ID)
3. User completes payment
4. Webhook updates status (PAID or FAILED)
```

---

### 4. Payments Module (`src/payments`)

**Purpose**: Stripe payment integration

**Components**:
- `payments.controller.ts` - Payment endpoints
- `payments.service.ts` - Stripe SDK integration
- DTOs for checkout session

**Design Decisions**:
- ✅ **Checkout Session**: Using Stripe Checkout (hosted payment page)
- ✅ **Test Mode**: Configured for test mode via environment variables
- ✅ **Metadata**: Order ID and User ID stored in session metadata
- ✅ **Success/Cancel URLs**: Redirects after payment (frontend integration)
- ✅ **Price Conversion**: Converting to cents (Stripe requirement)

**Payment Flow**:
```
1. User creates order
2. Backend creates Stripe Checkout Session
3. User redirected to Stripe payment page
4. User enters payment details
5. Stripe processes payment
6. Webhook notifies backend of result
7. Backend updates order status
```

---

### 5. Webhooks Module (`src/webhooks`)

**Purpose**: Handle Stripe webhook events (CRITICAL)

**Components**:
- `webhooks.controller.ts` - Webhook endpoint and handlers

**Design Decisions**:
- ✅ **Signature Verification**: REQUIRED for security (prevents fake webhooks)
- ✅ **Raw Body**: Express raw body parser enabled for signature verification
- ✅ **Public Endpoint**: No authentication (Stripe signature is the auth)
- ✅ **Event Handling**: Supports checkout completion and payment intent events
- ✅ **Logging**: Comprehensive logging for debugging
- ✅ **Source of Truth**: Webhook is authoritative for payment status

**Security**:
```typescript
// Verify webhook signature
const event = stripe.webhooks.constructEvent(
  rawBody,
  signature,
  webhookSecret
);
// Only proceed if signature is valid
```

**Why Webhooks are Critical**:
- User might close browser before payment completes
- Direct payment confirmation is unreliable
- Webhooks guarantee you're notified of all payment events
- Required for production payment systems

---

## Database Schema

### Entity Relationships

```
User (1) ─────< (M) Order (M) >───── (1) Product

User:
- id (UUID, PK)
- name (string)
- email (unique, string)
- password (hashed, string)
- createdAt (timestamp)

Product:
- id (UUID, PK)
- name (string)
- description (text, nullable)
- price (decimal 10,2)
- isActive (boolean, default true)
- createdAt (timestamp)

Order:
- id (UUID, PK)
- userId (UUID, FK)
- productId (UUID, FK)
- amount (decimal 10,2)
- status (enum: PENDING, PAID, FAILED)
- stripeSessionId (string, nullable)
- createdAt (timestamp)
```

### TypeORM Configuration

**Development**:
```typescript
synchronize: true  // Auto-sync schema with entities
logging: true      // Log all queries
```

**Production** (Recommended):
```typescript
synchronize: false // Use migrations instead
logging: false     // Disable query logging
```

**Why Migrations in Production**:
- Prevents accidental schema changes
- Version control for database schema
- Allows rollback if needed
- Ensures consistency across environments

---

## Security Considerations

### 1. Authentication Security

- ✅ **Password Hashing**: bcrypt with salt rounds
- ✅ **JWT Signing**: Secret key from environment
- ✅ **Token Expiry**: Prevents indefinite access
- ✅ **Bearer Token**: Standard Authorization header

### 2. Input Validation

- ✅ **class-validator**: Automatic DTO validation
- ✅ **Whitelist**: Strip unknown properties
- ✅ **Transform**: Auto-convert types
- ✅ **Email Validation**: Built-in email validation

### 3. Webhook Security

- ✅ **Signature Verification**: Prevents fake webhooks
- ✅ **Raw Body**: Required for signature validation
- ✅ **Secret Management**: Webhook secret from environment
- ✅ **Event Validation**: Only handle known event types

### 4. Environment Variables

- ✅ **dotenv**: Separate configuration from code
- ✅ **No Hardcoding**: All secrets in .env
- ✅ **.gitignore**: .env excluded from version control
- ✅ **.env.example**: Template for required variables

### 5. CORS Configuration

- ✅ **Explicit Origins**: Not using wildcard in production
- ✅ **Credentials**: Enabled for authenticated requests
- ✅ **Environment-based**: Different origins per environment

---

## Error Handling

### HTTP Status Codes

```typescript
200 OK           - Successful GET, PUT, PATCH
201 Created      - Successful POST (resource created)
400 Bad Request  - Validation errors, invalid input
401 Unauthorized - Missing/invalid authentication
404 Not Found    - Resource doesn't exist
409 Conflict     - Duplicate resource (email already exists)
500 Internal     - Server errors
```

### Exception Filters

```typescript
AllExceptionsFilter (optional):
- Catches all unhandled exceptions
- Formats error responses consistently
- Logs errors for debugging
```

### Validation Errors

```json
{
  "statusCode": 400,
  "message": [
    "password must be longer than or equal to 6 characters"
  ],
  "error": "Bad Request"
}
```

---

## Performance Considerations

### 1. Database Queries

- ✅ **Eager Loading**: Load relations when needed
- ✅ **Indexes**: UUID primary keys are indexed
- ✅ **Email Index**: Unique constraint creates index

### 2. Password Hashing

- ✅ **Async Operations**: Non-blocking bcrypt
- ✅ **Appropriate Cost**: 10 rounds (balance security/performance)

### 3. JWT Tokens

- ✅ **Stateless**: No database lookups for validation
- ✅ **Efficient**: Fast to verify
- ✅ **Cacheable**: Can cache user data in token

---

## Scalability Considerations

### Horizontal Scaling

✅ **Stateless Application**: Can run multiple instances
✅ **Database Pooling**: TypeORM connection pool
✅ **Shared Sessions**: JWT (no session store needed)

### Database Scaling

- Connection pooling (default with TypeORM)
- Read replicas (configure in TypeORM)
- Query optimization (eager/lazy loading)

### Caching (Future Enhancement)

```typescript
// Can add Redis for:
- Session storage (if switching from JWT)
- Product listings cache
- Rate limiting
```

---

## Deployment Architecture

### Production Environment

```
┌─────────────────┐
│  Load Balancer  │ (Optional)
└────────┬────────┘
         │
    ┌────┴─────┬─────────┐
    │          │         │
┌───▼───┐  ┌──▼──┐  ┌──▼──┐
│App #1 │  │App #2│  │App #3│ (Multiple instances)
└───┬───┘  └──┬──┘  └──┬──┘
    │         │        │
    └─────────┼────────┘
              │
      ┌───────▼────────┐
      │   PostgreSQL   │
      │   (Managed)    │
      └────────────────┘

External:
- Stripe Webhooks
- Environment Variables (secure vault)
```

### Deployment Platforms

**Render** (Recommended):
- Automatic HTTPS
- Managed PostgreSQL
- Auto-deploys from Git
- Free tier available

**Railway**:
- Simple deployment
- Built-in PostgreSQL
- Automatic scaling

**Heroku**:
- Mature platform
- Add-ons ecosystem
- Easy scaling

---

## Testing Strategy

### Manual Testing (Postman)

1. ✅ Import provided collection
2. ✅ Auto-saves tokens and IDs
3. ✅ Test all endpoints
4. ✅ Verify error handling

### Integration Testing (Future)

```typescript
// Example test structure
describe('Orders', () => {
  it('should create order with PENDING status', async () => {
    // Test implementation
  });
  
  it('should update order to PAID via webhook', async () => {
    // Test implementation
  });
});
```

### Load Testing (Future)

- Use tools like Apache Bench, k6, or Artillery
- Test concurrent order creation
- Verify webhook handling under load

---

## Monitoring & Logging

### Application Logging

```typescript
Logger.log('Order created successfully');
Logger.error('Payment processing failed', error);
```

### Webhook Logging

```typescript
Logger.log(`Received webhook event: ${event.type}`);
Logger.log(`Order ${orderId} marked as PAID`);
```

### Production Monitoring (Recommended)

- Application logs (Render/Railway dashboards)
- Database performance metrics
- Stripe dashboard for payment monitoring
- Error tracking (Sentry, optional)

---

## Best Practices Followed

### Code Organization

- ✅ **Modular Structure**: Feature-based modules
- ✅ **Separation of Concerns**: Controller → Service → Repository
- ✅ **DRY Principle**: Reusable services
- ✅ **TypeScript**: Strong typing throughout

### API Design

- ✅ **RESTful**: Standard HTTP methods and status codes
- ✅ **Consistent Naming**: Plural resource names
- ✅ **Meaningful Responses**: Clear error messages
- ✅ **Pagination Ready**: Can add pagination to list endpoints

### Security

- ✅ **Environment Variables**: No hardcoded secrets
- ✅ **Validation**: Input validation on all endpoints
- ✅ **Authentication**: Protected sensitive endpoints
- ✅ **Webhook Verification**: Signature validation

### Documentation

- ✅ **README**: Comprehensive setup guide
- ✅ **QUICKSTART**: Get up and running fast
- ✅ **TESTING**: Detailed testing instructions
- ✅ **DEPLOYMENT**: Multiple deployment options
- ✅ **Comments**: Code comments where needed

---

## Future Enhancements

### Phase 2 Features

1. **Email Notifications**
   - Send order confirmation emails
   - Payment success/failure notifications
   - Use SendGrid or AWS SES

2. **Admin Dashboard**
   - View all orders
   - Manage products
   - User management

3. **Refunds**
   - Implement refund endpoint
   - Update order status to REFUNDED
   - Stripe refund API integration

4. **Subscription Support**
   - Recurring payments
   - Subscription management
   - Usage-based billing

5. **Rate Limiting**
   - Prevent API abuse
   - Per-user rate limits
   - Redis-based implementation

6. **API Versioning**
   - /v1/products
   - Maintain backwards compatibility

7. **Testing**
   - Unit tests for services
   - E2E tests for complete flows
   - Webhook testing automation

8. **Monitoring**
   - Application Performance Monitoring (APM)
   - Real-time error tracking
   - Custom metrics dashboard

---

## Conclusion

This architecture follows production-ready best practices:

- ✅ Secure authentication
- ✅ Proper error handling
- ✅ Clean code structure
- ✅ Scalable design
- ✅ Webhook reliability
- ✅ Deployment ready
- ✅ Well documented

The system is ready for technical assessment and can be extended for production use with monitoring, testing, and additional features as needed.
