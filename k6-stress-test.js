/**
 * k6 Stress Testing Script
 * 
 * Gradually increases load to find breaking point
 * 
 * Run with: k6 run k6-stress-test.js
 */

import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '2m', target: 50 },    // Ramp up to 50 users
    { duration: '5m', target: 50 },    // Stay at 50
    { duration: '2m', target: 100 },   // Ramp to 100
    { duration: '5m', target: 100 },   // Stay at 100
    { duration: '2m', target: 200 },   // Ramp to 200
    { duration: '5m', target: 200 },   // Stay at 200
    { duration: '2m', target: 0 },     // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export default function () {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 100000);
  
  // Register
  const registerRes = http.post(
    `${BASE_URL}/auth/register`,
    JSON.stringify({
      name: `User ${random}`,
      email: `stress${timestamp}_${random}@test.com`,
      password: 'test123',
    }),
    { headers: { 'Content-Type': 'application/json' } }
  );
  
  check(registerRes, {
    'register successful': (r) => r.status === 201,
  });
  
  sleep(2);
  
  // Login
  const loginRes = http.post(
    `${BASE_URL}/auth/login`,
    JSON.stringify({
      email: `stress${timestamp}_${random}@test.com`,
      password: 'test123',
    }),
    { headers: { 'Content-Type': 'application/json' } }
  );
  
  check(loginRes, {
    'login successful': (r) => r.status === 200,
  });
  
  sleep(3);
}
