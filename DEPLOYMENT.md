# Deployment Guide

> ⚡ **First time?** Complete local setup first using **[QUICKSTART.md](QUICKSTART.md)** before deploying!

---

## Deploy to Render

### Prerequisites
- GitHub account with repository
- Render account (free tier available)
- Stripe account with test API keys

### Steps

1. **Push Code to GitHub**
```bash
git init
git add .
git commit -m "Initial commit: NestJS REST API with Stripe"
git remote add origin <your-github-repo-url>
git push -u origin main
```

2. **Create Render Account**
- Go to [render.com](https://render.com)
- Sign up with GitHub

3. **Create PostgreSQL Database**
- Dashboard → New → PostgreSQL
- Name: `nest-api-db`
- Database: `nest_api_db`
- Plan: Free
- Create Database
- **Save the connection details**

4. **Create Web Service**
- Dashboard → New → Web Service
- Connect your GitHub repository
- Configuration:
  - Name: `nest-api`
  - Environment: `Node`
  - Region: Choose closest to you
  - Branch: `main`
  - Build Command: `npm install && npm run build`
  - Start Command: `npm run start:prod`

5. **Set Environment Variables**

Add these in Render Dashboard → Environment:

```
NODE_ENV=production
DATABASE_HOST=<from-render-database>
DATABASE_PORT=<from-render-database>
DATABASE_USERNAME=<from-render-database>
DATABASE_PASSWORD=<from-render-database>
DATABASE_NAME=nest_api_db
JWT_SECRET=<generate-secure-random-string>
JWT_EXPIRES_IN=7d
STRIPE_SECRET_KEY=<your-stripe-test-key>
STRIPE_WEBHOOK_SECRET=<will-add-after-webhook-setup>
PORT=3000
CORS_ORIGINS=https://your-frontend-url.com
```

6. **Deploy**
- Click "Create Web Service"
- Wait for deployment (5-10 minutes)
- Note your service URL: `https://your-app.onrender.com`

7. **Configure Stripe Webhook**
- Go to [Stripe Dashboard](https://dashboard.stripe.com)
- Developers → Webhooks
- Add endpoint: `https://your-app.onrender.com/webhooks/stripe`
- Select events:
  - `checkout.session.completed`
  - `payment_intent.succeeded`
  - `payment_intent.payment_failed`
- Copy the **Signing Secret** (whsec_...)
- Add to Render environment variables as `STRIPE_WEBHOOK_SECRET`
- Redeploy service

8. **Test Deployment**
```bash
# Health check
curl https://your-app.onrender.com/products

# Or use Postman with your deployed URL
```

---

## Deploy to Railway

### Steps

1. **Install Railway CLI**
```bash
npm install -g @railway/cli
```

2. **Login to Railway**
```bash
railway login
```

3. **Initialize Project**
```bash
railway init
```

4. **Add PostgreSQL**
```bash
railway add
# Select PostgreSQL
```

5. **Set Environment Variables**
```bash
railway variables set NODE_ENV=production
railway variables set JWT_SECRET=your-secret-key
railway variables set JWT_EXPIRES_IN=7d
railway variables set STRIPE_SECRET_KEY=sk_test_...
railway variables set STRIPE_WEBHOOK_SECRET=whsec_...
railway variables set PORT=3000
```

6. **Deploy**
```bash
railway up
```

7. **Get Public URL**
```bash
railway domain
```

8. **Configure Stripe Webhook**
- Use the Railway domain URL
- Add webhook endpoint: `https://your-app.railway.app/webhooks/stripe`

---

## Deploy to Heroku

### Steps

1. **Install Heroku CLI**
```bash
# macOS
brew tap heroku/brew && brew install heroku

# Ubuntu
curl https://cli-assets.heroku.com/install.sh | sh
```

2. **Login**
```bash
heroku login
```

3. **Create App**
```bash
heroku create nest-api-app
```

4. **Add PostgreSQL**
```bash
heroku addons:create heroku-postgresql:essential-0
```

5. **Set Environment Variables**
```bash
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=your-secret-key
heroku config:set JWT_EXPIRES_IN=7d
heroku config:set STRIPE_SECRET_KEY=sk_test_...
heroku config:set STRIPE_WEBHOOK_SECRET=whsec_...
```

6. **Deploy**
```bash
git push heroku main
```

7. **Open App**
```bash
heroku open
```

---

## Deploy to DigitalOcean App Platform

### Steps

1. **Go to DigitalOcean**
- Create account at [digitalocean.com](https://digitalocean.com)

2. **Create App**
- Apps → Create App
- Connect GitHub repository
- Select repository and branch

3. **Configure**
- Environment: Node.js
- Build Command: `npm install && npm run build`
- Run Command: `npm run start:prod`

4. **Add Database**
- Add Database Component
- Choose PostgreSQL

5. **Set Environment Variables**
- Add all required environment variables

6. **Deploy**
- Click "Create Resources"

---

## Post-Deployment Checklist

- [ ] Database is accessible and connected
- [ ] Application starts without errors
- [ ] Health endpoint responds: `/products`
- [ ] Can register a user
- [ ] Can login and get JWT
- [ ] Can create products
- [ ] Can create orders
- [ ] Can create Stripe checkout session
- [ ] Stripe webhook endpoint is publicly accessible
- [ ] Webhook signature verification works
- [ ] Payment success updates order status
- [ ] CORS is properly configured

---

## Troubleshooting

### Database Connection Issues
```bash
# Check environment variables
echo $DATABASE_HOST
echo $DATABASE_PORT

# Test connection
psql -h $DATABASE_HOST -p $DATABASE_PORT -U $DATABASE_USERNAME -d $DATABASE_NAME
```

### Application Won't Start
- Check build logs
- Verify all environment variables are set
- Check Node.js version compatibility
- Review application logs

### Webhook Not Working
- Verify webhook URL is publicly accessible
- Check webhook secret is correct
- Review Stripe Dashboard → Webhooks → Events
- Check application logs for webhook errors

### CORS Errors
- Add frontend URL to `CORS_ORIGINS` environment variable
- Restart application after changing environment variables

---

## Environment Variable Checklist

Required for production:

- `NODE_ENV=production`
- `DATABASE_HOST`
- `DATABASE_PORT`
- `DATABASE_USERNAME`
- `DATABASE_PASSWORD`
- `DATABASE_NAME`
- `JWT_SECRET` (strong random string)
- `JWT_EXPIRES_IN`
- `STRIPE_SECRET_KEY` (from Stripe Dashboard)
- `STRIPE_WEBHOOK_SECRET` (from Stripe Webhook settings)
- `PORT` (usually 3000 or provided by platform)
- `CORS_ORIGINS` (frontend URL)

---

## Monitoring

### Render
- Dashboard → Service → Logs
- Dashboard → Service → Metrics

### Railway
```bash
railway logs
```

### Heroku
```bash
heroku logs --tail
```

---

## Scaling

### Free Tier Limitations
- Render: Spins down after inactivity (first request takes longer)
- Railway: Limited credits per month
- Heroku: Dyno sleeps after 30 minutes

### Upgrade Options
- Render: $7/month for always-on service
- Railway: $5/month starting
- Heroku: $7/month hobby tier

---

## Security Checklist

- [ ] Environment variables use secrets, not hardcoded values
- [ ] JWT_SECRET is strong and unique
- [ ] Database has strong password
- [ ] Stripe keys are from test mode for testing
- [ ] Webhook signature verification is enabled
- [ ] CORS origins are restricted to known domains
- [ ] Passwords are hashed with bcrypt
- [ ] Input validation is enabled
- [ ] Error messages don't expose sensitive data

---

## Support

For deployment issues:
- Check platform-specific documentation
- Review application logs
- Verify environment variables
- Test locally first
- Check database connectivity
