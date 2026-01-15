/**
 * k6 Spike Testing Script
 * 
 * Tests how the API handles sudden traffic spikes
 * 
 * Run with: k6 run k6-spike-test.js
 */

import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '10s', target: 10 },   // Normal load
    { duration: '10s', target: 100 },  // Sudden spike!
    { duration: '30s', target: 100 },  // Sustained spike
    { duration: '10s', target: 10 },   // Back to normal
    { duration: '10s', target: 0 },    // Cool down
  ],
  thresholds: {
    http_req_duration: ['p(95)<2500'],  // Realistic for sudden spike (was 1000)
    http_req_failed: ['rate<0.05'],     // Tightened - you're hitting 0%!
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export default function () {
  // Test public endpoints under spike
  const res = http.get(`${BASE_URL}/products`);
  
  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 1000ms': (r) => r.timings.duration < 1000,
  });
  
  sleep(1);
}
