# Railway Deployment Guide

## 🚀 Deploying NestJS API to Railway

### Prerequisites
- GitHub repository connected to Railway
- Railway account

### Step 1: Create New Project in Railway
1. Go to [Railway.app](https://railway.app)
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose your repository: `nest-api`

### Step 2: Add PostgreSQL Database
1. In your Railway project, click "+ New"
2. Select "Database" → "PostgreSQL"
3. Railway will automatically create a `DATABASE_URL` environment variable

### Step 3: Configure Environment Variables
Go to your service settings and add these variables:

```env
NODE_ENV=production
JWT_SECRET=<generate-a-secure-random-string>
JWT_EXPIRES_IN=7d
STRIPE_SECRET_KEY=<your-stripe-secret-key>
STRIPE_WEBHOOK_SECRET=<your-stripe-webhook-secret>
PORT=3000
```

**Important Notes:**
- ✅ `DATABASE_URL` is automatically provided by Railway when you add Postgres
- ✅ `PORT` is also automatically set by Railway, but you can override it
- ⚠️ Generate a strong `JWT_SECRET` (use: `openssl rand -base64 32`)

### Step 4: Deploy
1. Railway will automatically deploy when you push to your main branch
2. Monitor the build logs in Railway dashboard
3. Once deployed, Railway will provide a public URL

### Step 5: Set Up Stripe Webhook (If needed)
1. Get your Railway app URL: `https://your-app-name.railway.app`
2. Go to Stripe Dashboard → Webhooks
3. Add endpoint: `https://your-app-name.railway.app/webhooks/stripe`
4. Select events: `checkout.session.completed`, `payment_intent.succeeded`
5. Copy the webhook secret and update `STRIPE_WEBHOOK_SECRET` in Railway

### Verify Deployment
Check these endpoints:
- Health: `https://your-app.railway.app/health`
- API Docs: `https://your-app.railway.app/api` (if Swagger is enabled)

### Troubleshooting

#### Database Connection Issues
If you see `ECONNREFUSED` errors:
1. Verify `DATABASE_URL` is set in Railway environment variables
2. Check that PostgreSQL service is running
3. Review build logs for connection details

#### Build Failures
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
