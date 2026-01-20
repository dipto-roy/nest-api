# Railway Deployment Guide

## 🚀 Deploying NestJS API to Railway

### ⚠️ CRITICAL: Do These Steps in Order!

### Step 1: Add PostgreSQL Database FIRST
**This must be done BEFORE deploying your app!**

1. Go to [Railway.app](https://railway.app)
2. Create a new project OR open your existing project
3. Click "+ New" → Select "Database" → "PostgreSQL"
4. Wait for PostgreSQL to provision (takes ~30 seconds)
5. ✅ Railway automatically creates `DATABASE_URL` environment variable

### Step 2: Create/Connect Your App Service
1. In the same Railway project, click "+ New"
2. Select "GitHub Repo" → Choose `nest-api`
3. Railway will start building automatically (this will fail initially - that's OK!)

### Step 3: Configure Environment Variables
**CRITICAL:** Go to your app service → Variables tab and add:

```env
NODE_ENV=production
JWT_SECRET=<generate-with-command-below>
JWT_EXPIRES_IN=7d
STRIPE_SECRET_KEY=sk_test_your_stripe_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
```

**Generate JWT_SECRET:**
```bash
openssl rand -base64 32
```

**DO NOT ADD DATABASE_URL** - It's automatically shared from PostgreSQL service!

### Step 4: Link Database to App
1. In your app service settings, go to "Variables" tab
2. You should see `DATABASE_URL` as a "Referenced Variable"
3. If not, click "+ Reference" → Select your PostgreSQL database → `DATABASE_URL`

### Step 5: Deploy
1. Go to "Deployments" tab
2. Click "Redeploy" to trigger a new deployment
3. Watch the build logs for any errors
4. Wait for health check to pass (~2-3 minutes)

### Step 6: Verify Deployment
Once deployed, test these endpoints:

```bash
# Replace YOUR_APP_URL with your Railway URL
curl https://YOUR_APP_URL.railway.app/health
```

Expected response:
```json
{
  "status": "healthy",
  "database": {
    "connected": true
  }
}
```

### Troubleshooting

#### ❌ Healthcheck Failed - Service Unavailable
**Most common issue!** This means your app isn't starting. Check:

1. **Is PostgreSQL added?**
   - Go to your project → You should see TWO services (your app + PostgreSQL)
   - If PostgreSQL is missing, add it first!

2. **Is DATABASE_URL set?**
   - Go to app service → Variables tab
   - You should see `DATABASE_URL` (usually as a reference from PostgreSQL)
   - If missing, click "+ Reference" → Select PostgreSQL → `DATABASE_URL`

3. **Check deployment logs:**
   ```
   Look for these in Railway logs:
   ✅ "🔄 Starting application..."
   ✅ "💾 DATABASE_URL: SET ✅"
   ✅ "✅ Using DATABASE_URL for connection"
   ✅ "🚀 Application is running on: http://0.0.0.0:3000"
   
   ❌ If you see "DATABASE_URL: NOT SET ❌" → PostgreSQL not linked!
   ❌ If you see connection errors → Check DATABASE_URL is correct
   ```

4. **Verify environment variables:**
   - `NODE_ENV=production` ✅
   - `JWT_SECRET` is set ✅
   - `DATABASE_URL` exists (from PostgreSQL) ✅

#### ❌ Build Failures
```bash
# Common issues:
- Missing dependencies → Check package.json
- TypeScript errors → Run `npm run build` locally first
- Node version mismatch → Verify Node version in package.json
```

#### SSL Certificate Errors
The configuration already includes:
```typescript
ssl: { rejectUnauthorized: false }
```
This is required for Railway PostgreSQL connections.

### Monitoring
- Railway provides built-in logs and metrics
- Access logs: Project → Service → Logs
- Monitor database: Project → PostgreSQL → Metrics

### Cost
- **Free Tier**: $5 credit/month (enough for small projects)
- **Pro Plan**: $20/month + usage

### Support
- [Railway Documentation](https://docs.railway.app)
- [Railway Discord](https://discord.gg/railway)
