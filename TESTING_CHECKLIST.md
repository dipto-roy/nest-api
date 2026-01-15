# ✅ Complete Testing Checklist

Use this checklist to verify all functionality works correctly.

## 📋 Pre-Testing Setup

- [ ] PostgreSQL is running
- [ ] Database `nest_api_db` is created
- [ ] `.env` file is configured with correct credentials
- [ ] Dependencies installed (`npm install`)
- [ ] Application builds without errors (`npm run build`)
- [ ] Application is running (`npm run start:dev`)
- [ ] Postman is installed
- [ ] Postman collection imported (`postman_collection.json`)

---

## 🔐 Authentication Tests

### User Registration
- [ ] **Valid Registration**: Register with valid data
  - Expected: 201 Created
  - Response includes user object without password
  
- [ ] **Duplicate Email**: Try to register with same email
  - Expected: 409 Conflict
  - Error message: "Email already registered"

- [ ] **Invalid Email**: Register with invalid email format
  - Expected: 400 Bad Request
  - Validation error for email field

- [ ] **Short Password**: Password less than 6 characters
  - Expected: 400 Bad Request
  - Error: "Password must be at least 6 characters long"

- [ ] **Missing Fields**: Omit required fields
  - Expected: 400 Bad Request
  - Validation errors listed

### User Login
- [ ] **Valid Login**: Login with correct credentials
  - Expected: 200 OK
  - Response includes accessToken and user object
  - Token is saved to Postman variable

- [ ] **Invalid Password**: Login with wrong password
  - Expected: 401 Unauthorized
  - Error: "Invalid credentials"

- [ ] **Non-existent User**: Login with unregistered email
  - Expected: 401 Unauthorized
  - Error: "Invalid credentials"

- [ ] **Missing Fields**: Omit email or password
  - Expected: 400 Bad Request

### Protected Profile Endpoint
- [ ] **With Valid Token**: GET /auth/me with token
  - Expected: 200 OK
  - Returns current user data

- [ ] **Without Token**: GET /auth/me without Authorization header
  - Expected: 401 Unauthorized

- [ ] **With Invalid Token**: Use malformed or expired token
  - Expected: 401 Unauthorized

---

## 🛍️ Products Tests

### Create Product (Protected)
- [ ] **Valid Product**: Create with all fields
  - Expected: 201 Created
  - Product ID saved to variable

- [ ] **Without Auth**: Create without token
  - Expected: 401 Unauthorized

- [ ] **Negative Price**: Try negative or zero price
  - Expected: 400 Bad Request
  - Validation error

- [ ] **Missing Required Fields**: Omit name or price
  - Expected: 400 Bad Request

### List Active Products (Public)
- [ ] **List Products**: GET /products without auth
  - Expected: 200 OK
  - Returns array of active products only

- [ ] **Empty List**: Before creating any products
  - Expected: 200 OK
  - Returns empty array

### List All Products (Protected)
- [ ] **List All**: GET /products/all with token
  - Expected: 200 OK
  - Returns all products (active and inactive)

- [ ] **Without Auth**: Try without token
  - Expected: 401 Unauthorized

### Get Product by ID
- [ ] **Valid ID**: GET /products/:id with real UUID
  - Expected: 200 OK
  - Returns single product

- [ ] **Invalid ID**: GET /products/invalid-uuid
  - Expected: 400 Bad Request or 404 Not Found

- [ ] **Non-existent ID**: GET with valid UUID that doesn't exist
  - Expected: 404 Not Found

---

## 📦 Orders Tests

### Create Order (Protected)
- [ ] **Valid Order**: Create with valid product ID
  - Expected: 201 Created
  - Order status is PENDING
  - Order ID saved to variable
  - Amount matches product price

- [ ] **Without Auth**: Create without token
  - Expected: 401 Unauthorized

- [ ] **Invalid Product ID**: Use non-existent product ID
  - Expected: 404 Not Found

- [ ] **Inactive Product**: Create order with inactive product
  - Expected: 404 Not Found or 400 Bad Request
  - Error: "Product is not available"

### Get My Orders (Protected)
- [ ] **List User Orders**: GET /orders/my-orders with token
  - Expected: 200 OK
  - Returns array of user's orders only

- [ ] **Without Auth**: Try without token
  - Expected: 401 Unauthorized

- [ ] **Empty List**: New user with no orders
  - Expected: 200 OK
  - Returns empty array

### Get Order by ID (Protected)
- [ ] **Valid Order ID**: GET /orders/:id
  - Expected: 200 OK
  - Returns order with user and product relations

- [ ] **Without Auth**: Try without token
  - Expected: 401 Unauthorized

- [ ] **Different User's Order**: Try to access another user's order
  - Implementation dependent (currently allowed)

- [ ] **Non-existent Order**: Use valid UUID that doesn't exist
  - Expected: 404 Not Found

---

## 💳 Payment Tests

### Create Checkout Session (Protected)
- [ ] **Valid Checkout**: Create session with valid order ID
  - Expected: 200 OK
  - Response includes checkoutUrl (Stripe URL)
  - Response includes sessionId (cs_test_...)
  - Order is updated with stripeSessionId

- [ ] **Without Auth**: Try without token
  - Expected: 401 Unauthorized

- [ ] **Invalid Order ID**: Use non-existent order ID
  - Expected: 404 Not Found

- [ ] **Different User's Order**: Try with order from different user
  - Expected: 400 Bad Request
  - Error: "Order does not belong to user"

- [ ] **Already Paid Order**: Try creating session for PAID order
  - Expected: 400 Bad Request
  - Error: "Order is already PAID"

- [ ] **Invalid Stripe Key**: Test with wrong Stripe key (env)
  - Expected: 400 Bad Request
  - Error about Stripe authentication

---

## 🎣 Webhook Tests

### Prerequisites
- [ ] Stripe CLI installed
- [ ] Stripe CLI authenticated (`stripe login`)
- [ ] Webhook listener running
  ```bash
  stripe listen --forward-to localhost:3000/webhooks/stripe
  ```
- [ ] Webhook secret copied to .env
- [ ] Application restarted after adding webhook secret

### Webhook Signature Verification
- [ ] **Valid Signature**: Stripe CLI triggered event
  - Expected: 200 OK
  - Application logs show event received
  - Order status updated

- [ ] **Invalid Signature**: Manual POST without signature
  - Expected: 400 Bad Request
  - Error: "Missing stripe-signature header" or signature verification failed

- [ ] **Wrong Signature**: POST with incorrect signature
  - Expected: 400 Bad Request
  - Error: "Webhook Error: ..."

### Checkout Session Completed
- [ ] **Successful Payment**: Complete checkout with test card
  - Test Card: 4242 4242 4242 4242
  - Expected: 
    - Webhook received
    - Order status changes from PENDING to PAID
    - Application logs show success

- [ ] **Failed Payment**: Use declined test card
  - Test Card: 4000 0000 0000 0002
  - Expected: Payment fails at Stripe level

### Manual Webhook Trigger
- [ ] **Trigger Test Event**:
  ```bash
  stripe trigger checkout.session.completed
  ```
  - Expected: Webhook processed, logs show event

---

## 🔄 Complete End-to-End Flow

Execute this complete user journey:

1. - [ ] **Register New User**
   - POST /auth/register
   - Save email and password

2. - [ ] **Login**
   - POST /auth/login
   - Token auto-saved

3. - [ ] **Verify Authentication**
   - GET /auth/me
   - Confirms logged in

4. - [ ] **Create Product**
   - POST /products
   - Product ID auto-saved

5. - [ ] **Verify Product Listed**
   - GET /products
   - New product appears

6. - [ ] **Create Order**
   - POST /orders with product ID
   - Order ID auto-saved
   - Status is PENDING

7. - [ ] **Verify Order Created**
   - GET /orders/my-orders
   - New order appears with PENDING status

8. - [ ] **Create Checkout Session**
   - POST /payments/create-checkout-session
   - Receive checkout URL

9. - [ ] **Complete Payment**
   - Open checkout URL in browser
   - Enter test card: 4242 4242 4242 4242
   - Complete payment

10. - [ ] **Verify Webhook Received**
    - Check application logs
    - Should see "checkout.session.completed" event

11. - [ ] **Verify Order Status Updated**
    - GET /orders/:id
    - Status should be PAID (not PENDING)

12. - [ ] **Verify Order History**
    - GET /orders/my-orders
    - Order shows PAID status

---

## 🚨 Error Handling Tests

- [ ] **Invalid JSON**: Send malformed JSON
  - Expected: 400 Bad Request

- [ ] **Extra Fields**: Send DTOs with extra fields
  - Expected: 400 Bad Request (forbidNonWhitelisted)

- [ ] **Wrong Content-Type**: Send without application/json
  - Expected: 400 Bad Request

- [ ] **Expired JWT**: Use expired token (wait for expiry)
  - Expected: 401 Unauthorized

- [ ] **Non-existent Endpoints**: GET /nonexistent
  - Expected: 404 Not Found

---

## 🌐 CORS Tests

- [ ] **Same Origin**: Request from same domain
  - Expected: Works normally

- [ ] **Allowed Origin**: Request from CORS_ORIGINS domain
  - Expected: Works with CORS headers

- [ ] **Disallowed Origin**: Request from non-whitelisted domain
  - Expected: CORS error in browser

---

## 📊 Data Validation Tests

### User Entity
- [ ] Password is hashed (not plain text in database)
- [ ] Email is unique (enforced by database)
- [ ] Password never returned in responses
- [ ] Timestamps are automatically set

### Product Entity
- [ ] Price stored with 2 decimal places
- [ ] isActive defaults to true
- [ ] Negative prices rejected

### Order Entity
- [ ] Status defaults to PENDING
- [ ] Relations load correctly (eager loading)
- [ ] Amount copied from product (not reference)
- [ ] stripeSessionId nullable

---

## 🔍 Database Tests

- [ ] **Connection**: Application connects to database
- [ ] **Tables Created**: All tables exist (users, products, orders)
- [ ] **Relations**: Foreign keys work correctly
- [ ] **UUIDs**: All IDs are valid UUIDs
- [ ] **Timestamps**: createdAt set automatically

---

## 📈 Performance Tests (Optional)

- [ ] Multiple concurrent requests
- [ ] Large product list (100+ products)
- [ ] Multiple orders per user
- [ ] Webhook processing speed

---

## 🚀 Deployment Tests (When Deployed)

- [ ] **Application Accessible**: Public URL works
- [ ] **Database Connected**: Queries work
- [ ] **Environment Variables**: Loaded correctly
- [ ] **HTTPS Enabled**: SSL certificate valid
- [ ] **Webhook Endpoint Public**: Stripe can reach webhook
- [ ] **Webhook Signature**: Works with production secret
- [ ] **Complete Flow**: End-to-end test on deployed app

---

## ✅ Final Verification

- [ ] All endpoints respond correctly
- [ ] Authentication works as expected
- [ ] Order status lifecycle works (PENDING → PAID)
- [ ] Webhooks update order status
- [ ] Error messages are clear and helpful
- [ ] No sensitive data exposed
- [ ] Logs show important events
- [ ] Application handles errors gracefully

---

## 📝 Test Results Summary

```
Authentication:    __/__  tests passed
Products:          __/__  tests passed
Orders:            __/__  tests passed
Payments:          __/__  tests passed
Webhooks:          __/__  tests passed
End-to-End:        __/__  tests passed
Error Handling:    __/__  tests passed
```

---

## 🐛 Issues Found

| Issue | Severity | Status | Notes |
|-------|----------|--------|-------|
| | | | |

---

**Testing completed on**: _________________  
**Tested by**: _________________  
**Environment**: [ ] Local [ ] Development [ ] Staging [ ] Production

---

**📌 Note**: Keep this checklist for future testing and regression tests!
