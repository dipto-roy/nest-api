# Testing Guide

> ⚡ **Haven't set up the project yet?** Start with **[QUICKSTART.md](QUICKSTART.md)** first!

This guide walks you through testing the complete API flow using Postman.

## Prerequisites

1. PostgreSQL database running
2. Application running on `http://localhost:3000`
3. Postman installed
4. Stripe CLI installed (for webhook testing)

## Setup

### 1. Import Postman Collection

Import the `postman_collection.json` file into Postman:
- Open Postman
- Click "Import" button
- Select `postman_collection.json`
- Collection will be imported with all endpoints

### 2. Configure Environment Variables

The collection uses variables that auto-populate:
- `base_url`: http://localhost:3000 (change if deployed)
- `jwt_token`: Auto-set after login
- `user_id`: Auto-set after registration/login
- `product_id`: Auto-set after creating a product
- `order_id`: Auto-set after creating an order

## Testing Flow

### Step 1: User Registration

**Endpoint**: POST `/auth/register`

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

**Expected Response** (201 Created):
```json
{
  "message": "User registered successfully",
  "user": {
    "id": "uuid-here",
    "name": "John Doe",
    "email": "john@example.com",
    "createdAt": "2024-01-16T..."
  }
}
```

✅ **Verifies**: Password hashing, user creation, validation

---

### Step 2: User Login

**Endpoint**: POST `/auth/login`

```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Expected Response** (200 OK):
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid-here",
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

✅ **Verifies**: JWT generation, password verification

**Note**: Token is automatically saved to `{{jwt_token}}` variable

---

### Step 3: Get Profile (Protected Route)

**Endpoint**: GET `/auth/me`  
**Headers**: `Authorization: Bearer {{jwt_token}}`

**Expected Response** (200 OK):
```json
{
  "user": {
    "id": "uuid-here",
    "email": "john@example.com",
    "name": "John Doe"
  }
}
```

✅ **Verifies**: JWT authentication, protected routes

---

### Step 4: Create Product

**Endpoint**: POST `/products`  
**Headers**: `Authorization: Bearer {{jwt_token}}`

```json
{
  "name": "Premium Plan",
  "description": "Access to all premium features",
  "price": 99.99,
  "isActive": true
}
```

**Expected Response** (201 Created):
```json
{
  "id": "product-uuid-here",
  "name": "Premium Plan",
  "description": "Access to all premium features",
  "price": "99.99",
  "isActive": true,
  "createdAt": "2024-01-16T..."
}
```

✅ **Verifies**: Product creation, validation, authentication

---

### Step 5: List Active Products

**Endpoint**: GET `/products` (Public - no auth required)

**Expected Response** (200 OK):
```json
[
  {
    "id": "product-uuid-here",
    "name": "Premium Plan",
    "description": "Access to all premium features",
    "price": "99.99",
    "isActive": true,
    "createdAt": "2024-01-16T..."
  }
]
```

✅ **Verifies**: Public endpoint access, filtering active products

---

### Step 6: Create Order

**Endpoint**: POST `/orders`  
**Headers**: `Authorization: Bearer {{jwt_token}}`

```json
{
  "productId": "{{product_id}}"
}
```

**Expected Response** (201 Created):
```json
{
  "id": "order-uuid-here",
  "userId": "user-uuid",
  "productId": "product-uuid",
  "amount": "99.99",
  "status": "PENDING",
  "stripeSessionId": null,
  "createdAt": "2024-01-16T...",
  "user": { ... },
  "product": { ... }
}
```

✅ **Verifies**: Order creation with PENDING status, relationships

---

### Step 7: Create Stripe Checkout Session

**Endpoint**: POST `/payments/create-checkout-session`  
**Headers**: `Authorization: Bearer {{jwt_token}}`

```json
{
  "orderId": "{{order_id}}"
}
```

**Expected Response** (200 OK):
```json
{
  "checkoutUrl": "https://checkout.stripe.com/c/pay/cs_test_...",
  "sessionId": "cs_test_..."
}
```

✅ **Verifies**: Stripe integration, session creation, order validation

**Next Steps**:
1. Copy the `checkoutUrl`
2. Open in browser
3. Use Stripe test card: `4242 4242 4242 4242`
4. Expiry: Any future date
5. CVC: Any 3 digits
6. Complete payment

---

### Step 8: Verify Order Status Update (via Webhook)

**Endpoint**: GET `/orders/{{order_id}}`  
**Headers**: `Authorization: Bearer {{jwt_token}}`

**Expected Response** (200 OK):
```json
{
  "id": "order-uuid-here",
  "userId": "user-uuid",
  "productId": "product-uuid",
  "amount": "99.99",
  "status": "PAID",  // ← Status changed from PENDING
  "stripeSessionId": "cs_test_...",
  "createdAt": "2024-01-16T...",
  "user": { ... },
  "product": { ... }
}
```

✅ **Verifies**: Webhook processing, order status update

---

### Step 9: Get User's Order History

**Endpoint**: GET `/orders/my-orders`  
**Headers**: `Authorization: Bearer {{jwt_token}}`

**Expected Response** (200 OK):
```json
[
  {
    "id": "order-uuid-here",
    "status": "PAID",
    "amount": "99.99",
    ...
  }
]
```

✅ **Verifies**: Order history, user-specific data

---

## Webhook Testing (Local Development)

### Using Stripe CLI

1. **Start Stripe CLI listener**:
```bash
stripe listen --forward-to localhost:3000/webhooks/stripe
```

2. **Copy webhook signing secret** and update `.env`:
```env
STRIPE_WEBHOOK_SECRET=whsec_...
```

3. **Restart your application**

4. **Trigger test webhook**:
```bash
stripe trigger checkout.session.completed
```

5. **Verify order status** changed to PAID

---

## Error Testing

### Test Invalid Login
```json
POST /auth/login
{
  "email": "john@example.com",
  "password": "wrongpassword"
}
```
**Expected**: 401 Unauthorized

### Test Duplicate Registration
Register with same email twice  
**Expected**: 409 Conflict

### Test Unauthorized Access
```
GET /auth/me
(without Authorization header)
```
**Expected**: 401 Unauthorized

### Test Invalid Product ID
```json
POST /orders
{
  "productId": "invalid-uuid"
}
```
**Expected**: 400 Bad Request

### Test Validation Errors
```json
POST /auth/register
{
  "name": "",
  "email": "not-an-email",
  "password": "123"
}
```
**Expected**: 400 Bad Request with validation errors

---

## Complete Test Checklist

- [ ] User can register with valid data
- [ ] Duplicate email is rejected
- [ ] User can login with correct credentials
- [ ] Invalid credentials are rejected
- [ ] JWT token works for protected routes
- [ ] Product can be created (authenticated)
- [ ] Active products are listed publicly
- [ ] Order is created with PENDING status
- [ ] Stripe checkout session is created
- [ ] Webhook updates order status to PAID
- [ ] User can view order history
- [ ] Validation errors return meaningful messages
- [ ] HTTP status codes are appropriate

---

## Postman Tips

1. **Environment Variables**: The collection auto-saves tokens and IDs
2. **Test Scripts**: Responses auto-populate variables
3. **Run Collection**: Use Collection Runner for automated testing
4. **Save Responses**: Use Postman's "Save Response" for documentation

---

## Troubleshooting

### JWT Token Expired
- Login again to get new token
- Increase `JWT_EXPIRES_IN` in `.env`

### Webhook Not Triggering
- Check Stripe CLI is running
- Verify webhook secret matches
- Check application logs

### Order Status Not Updating
- Verify webhook endpoint is accessible
- Check webhook signature verification
- Review application logs for errors

---

## Production Testing

When deployed to Render/Railway:

1. Update `base_url` in Postman to your deployed URL
2. Configure Stripe webhook in dashboard
3. Use real webhook secret from Stripe dashboard
4. Test complete flow end-to-end

---

## Support

For issues or questions:
- Check application logs
- Review Stripe dashboard logs
- Verify environment variables
- Check database connections
