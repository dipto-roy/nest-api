/**
 * k6 Load Testing Script for NestJS REST API
 * 
 * This script tests the complete user journey:
 * 1. User Registration
 * 2. User Login
 * 3. Create Product
 * 4. Create Order
 * 5. Create Checkout Session
 * 
 * Run with: k6 run k6-load-test.js
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');

// Test configuration
export const options = {
  stages: [
    { duration: '30s', target: 10 },  // Ramp up to 10 users over 30s
    { duration: '1m', target: 10 },   // Stay at 10 users for 1 minute
    { duration: '30s', target: 50 },  // Ramp up to 50 users
    { duration: '1m', target: 50 },   // Stay at 50 users for 1 minute
    { duration: '30s', target: 0 },   // Ramp down to 0
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests should be below 500ms
    http_req_failed: ['rate<0.1'],    // Error rate should be below 10%
    errors: ['rate<0.1'],
  },
};

// Base URL - change if needed
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

// Test data
function generateTestData() {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000);
  return {
    user: {
      name: `Test User ${random}`,
      email: `test${timestamp}_${random}@example.com`,
      password: 'password123',
    },
    product: {
      name: `Product ${random}`,
      description: 'Test product for load testing',
      price: 99.99,
      isActive: true,
    },
  };
}

export default function () {
  const testData = generateTestData();
  let authToken = '';
  let productId = '';
  let orderId = '';

  // 1. Register User
  const registerRes = http.post(
    `${BASE_URL}/auth/register`,
    JSON.stringify(testData.user),
    {
      headers: { 'Content-Type': 'application/json' },
      tags: { name: 'Register' },
    }
  );

  const registerSuccess = check(registerRes, {
    'register status is 201': (r) => r.status === 201,
    'register returns user': (r) => r.json('user') !== undefined,
  });
  errorRate.add(!registerSuccess);

  if (!registerSuccess) {
    console.error(`Registration failed: ${registerRes.status} - ${registerRes.body}`);
    return;
  }

  sleep(1);

  // 2. Login User
  const loginRes = http.post(
    `${BASE_URL}/auth/login`,
    JSON.stringify({
      email: testData.user.email,
      password: testData.user.password,
    }),
    {
      headers: { 'Content-Type': 'application/json' },
      tags: { name: 'Login' },
    }
  );

  const loginSuccess = check(loginRes, {
    'login status is 200': (r) => r.status === 200,
    'login returns token': (r) => r.json('accessToken') !== undefined,
  });
  errorRate.add(!loginSuccess);

  if (!loginSuccess) {
    console.error(`Login failed: ${loginRes.status} - ${loginRes.body}`);
    return;
  }

  authToken = loginRes.json('accessToken');
  sleep(1);

  // 3. Get Profile (Protected Route Test)
  const profileRes = http.get(`${BASE_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${authToken}` },
    tags: { name: 'GetProfile' },
  });

  check(profileRes, {
    'profile status is 200': (r) => r.status === 200,
    'profile returns user': (r) => r.json('user') !== undefined,
  });

  sleep(1);

  // 4. Create Product
  const productRes = http.post(
    `${BASE_URL}/products`,
    JSON.stringify(testData.product),
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      tags: { name: 'CreateProduct' },
    }
  );

  const productSuccess = check(productRes, {
    'product creation status is 201': (r) => r.status === 201,
    'product has id': (r) => r.json('id') !== undefined,
  });
  errorRate.add(!productSuccess);

  if (!productSuccess) {
    console.error(`Product creation failed: ${productRes.status}`);
    return;
  }

  productId = productRes.json('id');
  sleep(1);

  // 5. List Active Products (Public Endpoint)
  const listProductsRes = http.get(`${BASE_URL}/products`, {
    tags: { name: 'ListProducts' },
  });

  check(listProductsRes, {
    'list products status is 200': (r) => r.status === 200,
    'products is array': (r) => Array.isArray(r.json()),
  });

  sleep(1);

  // 6. Get Product by ID
  const getProductRes = http.get(`${BASE_URL}/products/${productId}`, {
    tags: { name: 'GetProduct' },
  });

  check(getProductRes, {
    'get product status is 200': (r) => r.status === 200,
    'product matches id': (r) => r.json('id') === productId,
  });

  sleep(1);

  // 7. Create Order
  const orderRes = http.post(
    `${BASE_URL}/orders`,
    JSON.stringify({ productId }),
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      tags: { name: 'CreateOrder' },
    }
  );

  const orderSuccess = check(orderRes, {
    'order creation status is 201': (r) => r.status === 201,
    'order has id': (r) => r.json('id') !== undefined,
    'order status is PENDING': (r) => r.json('status') === 'PENDING',
  });
  errorRate.add(!orderSuccess);

  if (!orderSuccess) {
    console.error(`Order creation failed: ${orderRes.status}`);
    return;
  }

  orderId = orderRes.json('id');
  sleep(1);

  // 8. Get My Orders
  const myOrdersRes = http.get(`${BASE_URL}/orders/my-orders`, {
    headers: { Authorization: `Bearer ${authToken}` },
    tags: { name: 'GetMyOrders' },
  });

  check(myOrdersRes, {
    'my orders status is 200': (r) => r.status === 200,
    'orders is array': (r) => Array.isArray(r.json()),
  });

  sleep(1);

  // 9. Get Order by ID
  const getOrderRes = http.get(`${BASE_URL}/orders/${orderId}`, {
    headers: { Authorization: `Bearer ${authToken}` },
    tags: { name: 'GetOrder' },
  });

  check(getOrderRes, {
    'get order status is 200': (r) => r.status === 200,
    'order matches id': (r) => r.json('id') === orderId,
  });

  sleep(1);

  // 10. Create Checkout Session
  const checkoutRes = http.post(
    `${BASE_URL}/payments/create-checkout-session`,
    JSON.stringify({ orderId }),
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      tags: { name: 'CreateCheckout' },
    }
  );

  const checkoutSuccess = check(checkoutRes, {
    'checkout creation status is 200': (r) => r.status === 200,
    'checkout has URL': (r) => r.json('checkoutUrl') !== undefined,
    'checkout has session ID': (r) => r.json('sessionId') !== undefined,
  });
  errorRate.add(!checkoutSuccess);

  sleep(2);
}

// Summary function called at the end of the test
export function handleSummary(data) {
  return {
    'k6-summary.json': JSON.stringify(data),
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
  };
}

function textSummary(data, options) {
  const indent = options.indent || '';
  let output = '\n';
  
  output += `${indent}✓ Test Run Complete\n\n`;
  output += `${indent}Duration: ${data.state.testRunDurationMs / 1000}s\n`;
  output += `${indent}Iterations: ${data.metrics.iterations.values.count}\n`;
  output += `${indent}VUs: ${data.metrics.vus.values.value}\n\n`;
  
  output += `${indent}HTTP Metrics:\n`;
  output += `${indent}  - Requests: ${data.metrics.http_reqs.values.count}\n`;
  output += `${indent}  - Duration (avg): ${data.metrics.http_req_duration.values.avg.toFixed(2)}ms\n`;
  output += `${indent}  - Duration (p95): ${data.metrics.http_req_duration.values['p(95)'].toFixed(2)}ms\n`;
  output += `${indent}  - Failed: ${(data.metrics.http_req_failed.values.rate * 100).toFixed(2)}%\n`;
  
  return output;
}
