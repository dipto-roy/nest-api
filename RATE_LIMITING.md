# 🛡️ Rate Limiting Configuration

## Overview

Rate limiting is now active to protect the API from abuse during traffic spikes. This implements the **Token Bucket** algorithm via `@nestjs/throttler`.

---

## Current Configuration

```typescript
ThrottlerModule.forRoot([{
  ttl: 60000,        // Time window: 60 seconds
  limit: 100,        // Max 100 requests per minute per IP
}])
```

### What This Means:
- Each IP address can make **100 requests per minute**
- After 100 requests, the API returns **HTTP 429 (Too Many Requests)**
- The counter resets every 60 seconds
- Applied globally to all routes (except those marked with `@SkipThrottle()`)

---

## Exempted Endpoints

These endpoints skip rate limiting:

| Endpoint | Reason |
|----------|---------|
| `/webhooks/*` | Stripe webhooks have their own retry logic |
| `/health`, `/health/metrics`, `/health/db-performance` | Used by monitoring tools |

---

## How It Works

### Normal Traffic:
```
User makes 50 req/min → ✅ All pass
User makes 100 req/min → ✅ All pass
User makes 150 req/min → ✅ First 100 pass, ❌ Next 50 get 429
```

### During Spike:
```
100 users × 10 req/min = 1000 req/min total → ✅ All pass (distributed across IPs)
1 user × 150 req/min = 150 req/min → ❌ 50 requests rejected with 429
```

### Response When Limit Exceeded:
```json
{
  "statusCode": 429,
  "message": "ThrottlerException: Too Many Requests"
}
```

---

## k6 Test Impact

### Before Rate Limiting:
- 100 VUs could overwhelm connection pool
- P95: 2080ms (slow but no errors)
- System degraded gracefully

### After Rate Limiting:
- 100 VUs × 100 req/min = **10,000 req/min allowed**
- Each VU stays under 100 req/min → No 429 errors
- Connection pool protected from sudden overload
- P95: **Expected 1200-1500ms** (with pool increase)

---

## Customizing Rate Limits

### Per-Controller Limits:

```typescript
import { Throttle } from '@nestjs/throttler';

@Controller('auth')
export class AuthController {
  // More restrictive for login endpoint
  @Throttle({ default: { limit: 5, ttl: 60000 } })  // 5 req/min
  @Post('login')
  async login() {}
  
  // More lenient for profile
  @Throttle({ default: { limit: 200, ttl: 60000 } }) // 200 req/min
  @Get('profile')
  async getProfile() {}
}
```

### Skip for Specific Routes:

```typescript
import { SkipThrottle } from '@nestjs/throttler';

@Controller('public')
export class PublicController {
  @SkipThrottle()  // No rate limiting
  @Get('status')
  async getStatus() {}
}
```

---

## Production Recommendations

### By Endpoint Type:

| Endpoint | Limit | Reason |
|----------|-------|--------|
| `POST /auth/login` | 5/min | Prevent brute force |
| `POST /auth/register` | 3/min | Prevent spam accounts |
| `POST /orders` | 10/min | Prevent order spam |
| `GET /products` | 200/min | Read-heavy, allow more |
| `POST /payments/checkout` | 20/min | Allow legitimate checkouts |

### Implementation Example:

```typescript
// src/auth/auth.controller.ts
import { Throttle } from '@nestjs/throttler';

@Controller('auth')
export class AuthController {
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('login')
  async login() {}
  
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @Post('register')
  async register() {}
}
```

---

## Monitoring Rate Limits

### Check If User Hit Limit:

The response includes headers:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 47
X-RateLimit-Reset: 1642377600
```

### Log Rate Limit Hits:

```typescript
// Create custom exception filter
@Catch(ThrottlerException)
export class ThrottlerExceptionFilter implements ExceptionFilter {
  catch(exception: ThrottlerException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest();
    
    console.log(`Rate limit exceeded: ${request.ip} → ${request.url}`);
    
    ctx.getResponse().status(429).json({
      statusCode: 429,
      message: 'Too many requests, please try again later',
      retryAfter: 60,  // seconds
    });
  }
}
```

---

## Testing Rate Limiting

### Manual Test:

```bash
# Make 105 requests rapidly
for i in {1..105}; do
  curl http://localhost:3000/products
  echo "Request $i"
done

# First 100 → HTTP 200 ✅
# Last 5 → HTTP 429 ❌
```

### k6 Test:

```javascript
// Test rate limiting
import http from 'k6/http';
import { check } from 'k6';

export const options = {
  vus: 1,
  duration: '2m',
};

export default function () {
  const res = http.get('http://localhost:3000/products');
  
  check(res, {
    'not rate limited': (r) => r.status !== 429,
  });
  
  sleep(0.1);  // 10 req/sec = 600 req/min → Will hit 100/min limit
}
```

---

## Benefits

### 1. **Protection from Abuse** 🛡️
- Prevents DDoS attacks
- Stops brute force login attempts
- Blocks spammy users

### 2. **Graceful Degradation** 🎯
- Returns 429 instead of crashing
- User gets clear error message
- System stays responsive for others

### 3. **Resource Management** ⚡
- Connection pool stays healthy
- Database not overwhelmed
- CPU usage controlled

### 4. **Better k6 Results** 📊
- Expected: P95 from 2080ms → **1200-1500ms**
- No more connection pool saturation
- Predictable performance

---

## Next Steps

1. **Test Current Config**:
   ```bash
   npm run build && k6 run k6-spike-test.js
   ```

2. **Fine-tune Per Endpoint** (if needed):
   - Add stricter limits to auth endpoints
   - Relax limits for read-only endpoints

3. **Add Redis** (for distributed rate limiting):
   - Required if running multiple API instances
   - Shares rate limit counters across servers

4. **Monitor in Production**:
   - Track 429 error rate
   - Adjust limits based on real traffic

---

## Summary

✅ **Rate limiting active**: 100 req/min per IP  
✅ **Webhooks exempt**: Stripe can retry freely  
✅ **Health checks exempt**: Monitoring tools not blocked  
✅ **Expected improvement**: P95 ~1200-1500ms in spike test  
✅ **Production-ready**: Prevents abuse and overload
