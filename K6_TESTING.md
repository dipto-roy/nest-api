# k6 Load Testing Guide

## Installation

### Linux/macOS
```bash
# Ubuntu/Debian
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6

# macOS
brew install k6
```

### Windows
```bash
choco install k6
```

Or download from: https://k6.io/docs/get-started/installation/

---

## Running Tests

### 1. Load Test (Gradual Ramp-up)
Tests the complete user journey with gradual load increase.

```bash
# Basic run
k6 run k6-load-test.js

# With custom base URL
k6 run --env BASE_URL=http://localhost:3000 k6-load-test.js

# Save results to file
k6 run k6-load-test.js --out json=load-test-results.json
```

**What it tests:**
- User registration
- Login with JWT
- Protected routes
- Product creation
- Order creation
- Checkout session creation

**Load Profile:**
- Ramps up to 10 users (30s)
- Sustains 10 users (1m)
- Ramps up to 50 users (30s)
- Sustains 50 users (1m)
- Ramps down (30s)

---

### 2. Spike Test (Sudden Traffic Surge)
Tests how API handles sudden traffic spikes.

```bash
k6 run k6-spike-test.js
```

**Load Profile:**
- 10 users (10s)
- **Sudden spike to 100 users** (10s)
- Sustained at 100 users (30s)
- Back to 10 users (10s)

---

### 3. Stress Test (Find Breaking Point)
Gradually increases load to find system limits.

```bash
k6 run k6-stress-test.js
```

**Load Profile:**
- Gradually increases from 0 → 50 → 100 → 200 users
- Each level sustained for 5 minutes
- Helps identify breaking point

---

## Understanding Results

### Key Metrics

```
✓ http_req_duration..........: avg=150ms p(95)=450ms
  - Average response time: 150ms
  - 95th percentile: 450ms (95% of requests under 450ms)

✓ http_req_failed............: 2.5%
  - 2.5% of requests failed

✓ http_reqs..................: 15000
  - Total HTTP requests made

✓ iterations.................: 1500
  - Complete test iterations

✓ vus........................: 50
  - Virtual users (concurrent)
```

### Threshold Interpretation

- ✅ **Green/Passing**: API meets performance criteria
- ❌ **Red/Failing**: API exceeds thresholds

---

## Custom Test Scenarios

### Quick Smoke Test (1 minute)
```bash
k6 run --duration 1m --vus 5 k6-load-test.js
```

### Heavy Load Test (10 users, 10 minutes)
```bash
k6 run --duration 10m --vus 10 k6-load-test.js
```

### Stress with More Users
```bash
k6 run --vus 100 --duration 5m k6-load-test.js
```

---

## Performance Benchmarks

### Expected Results (Development)

| Metric | Target | Acceptable |
|--------|--------|------------|
| Avg Response Time | <200ms | <500ms |
| P95 Response Time | <500ms | <1000ms |
| Error Rate | <1% | <5% |
| Requests/sec | >100 | >50 |

### Production Targets

| Metric | Target |
|--------|--------|
| Avg Response Time | <100ms |
| P95 Response Time | <300ms |
| Error Rate | <0.1% |
| Requests/sec | >500 |

---

## Monitoring During Tests

### Watch Application Logs
```bash
# In another terminal
npm run start:dev
```

### Monitor System Resources
```bash
# CPU and Memory
htop

# Database connections
sudo -u postgres psql -d nest_api_db -c "SELECT count(*) FROM pg_stat_activity;"
```

---

## Troubleshooting

### High Error Rates

**Database Connection Pool:**
- Increase connection pool size in TypeORM config
- Check database max connections

**Memory Issues:**
- Monitor Node.js heap usage
- Check for memory leaks

**Timeout Errors:**
- Increase request timeout
- Optimize slow queries
- Add caching

### Slow Response Times

**Database Queries:**
```bash
# Enable query logging
# Check src/app.module.ts - set logging: true
```

**Indexes:**
```sql
-- Add indexes to frequently queried columns
CREATE INDEX idx_orders_user_id ON orders(userId);
CREATE INDEX idx_orders_status ON orders(status);
```

---

## Advanced Options

### Custom Thresholds
```javascript
export const options = {
  thresholds: {
    http_req_duration: ['p(99)<1000'], // 99th percentile
    http_req_failed: ['rate<0.01'],    // 1% error rate
    http_reqs: ['rate>100'],           // Min 100 req/s
  },
};
```

### Multiple Scenarios
```javascript
export const options = {
  scenarios: {
    register_users: {
      executor: 'constant-vus',
      vus: 10,
      duration: '1m',
      exec: 'registerUser',
    },
    browse_products: {
      executor: 'constant-vus',
      vus: 50,
      duration: '1m',
      exec: 'browseProducts',
    },
  },
};
```

### Export Results
```bash
# JSON format
k6 run --out json=results.json k6-load-test.js

# InfluxDB (for Grafana)
k6 run --out influxdb=http://localhost:8086/k6 k6-load-test.js

# CSV
k6 run --out csv=results.csv k6-load-test.js
```

---

## CI/CD Integration

### GitHub Actions
```yaml
- name: Run k6 Load Test
  run: |
    k6 run k6-load-test.js
```

### Fail on Threshold Breach
```bash
# Exit with error if thresholds fail
k6 run --no-thresholds k6-load-test.js || exit 1
```

---

## Best Practices

1. ✅ **Start Small**: Begin with smoke tests, then increase load
2. ✅ **Realistic Data**: Use production-like test data
3. ✅ **Monitor Resources**: Watch CPU, memory, database
4. ✅ **Test Incrementally**: Don't jump to max load immediately
5. ✅ **Cleanup**: Remove test data after tests
6. ✅ **Baseline**: Establish performance baseline
7. ✅ **Regular Testing**: Run load tests on every release

---

## Next Steps

1. Run basic load test to establish baseline
2. Identify bottlenecks from results
3. Optimize slow endpoints
4. Add database indexes
5. Implement caching if needed
6. Re-run tests to validate improvements

---

**🚀 Happy Load Testing!**
