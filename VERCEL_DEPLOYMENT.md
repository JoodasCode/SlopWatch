# 🚀 SlopWatch Analytics - Vercel Deployment Guide

## Overview

This guide will help you deploy your private SlopWatch analytics dashboard to Vercel with:
- Real-time NPM download tracking
- Secure API endpoints
- Private dashboard with authentication
- Professional analytics interface

## Prerequisites

- Vercel account
- GitHub repository with your SlopWatch code
- Node.js 18+ locally

## Step 1: Environment Variables

Set up these environment variables in your Vercel dashboard:

### Required Variables

```bash
# Analytics API Secret (generate a random string)
ANALYTICS_SECRET=your-super-secret-key-here

# Admin Token for dashboard access (generate a random string)
ADMIN_TOKEN=your-admin-token-here
```

### How to Generate Secure Tokens

```bash
# Generate analytics secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate admin token
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"
```

## Step 2: Vercel Deployment

### Option A: Deploy via Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy from your project directory
vercel

# Set environment variables
vercel env add ANALYTICS_SECRET
vercel env add ADMIN_TOKEN

# Deploy again to apply environment variables
vercel --prod
```

### Option B: Deploy via GitHub Integration

1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard:
   - Go to Project Settings → Environment Variables
   - Add `ANALYTICS_SECRET` and `ADMIN_TOKEN`
3. Trigger a new deployment

## Step 3: Update Your MCP Server

Update your MCP server to send analytics to your Vercel deployment:

```bash
# Set environment variables for your MCP server
export ANALYTICS_API_URL="https://your-vercel-domain.vercel.app/api/analytics"
export ANALYTICS_SECRET="your-super-secret-key-here"
export ANALYTICS_ENABLED="true"
```

## Step 4: Access Your Dashboard

1. Go to `https://your-vercel-domain.vercel.app/dashboard`
2. Enter your admin token
3. View your real-time analytics!

## Features You'll Get

### 🔐 **Private & Secure**
- Token-based authentication
- Only you can access the dashboard
- Secure API endpoints

### 📊 **Real-time Analytics**
- Live NPM download tracking
- User engagement metrics
- Claim/verification statistics
- Success rate monitoring

### 🎯 **Professional Interface**
- Beautiful, responsive design
- Real-time data updates
- Trend analysis
- Mobile-friendly

### 📈 **Data Sources**
- NPM API integration for download stats
- MCP server usage analytics
- Real-time verification results
- Rules setup tracking

## API Endpoints

Your deployment will have these endpoints:

- `GET /api/analytics` - Get analytics data (requires admin token)
- `POST /api/analytics` - Receive analytics events (requires secret)
- `GET /dashboard` - Private analytics dashboard
- `GET /` - Public landing page

## Customization

### Update Your Domain

Replace `your-vercel-domain.vercel.app` with your actual Vercel domain in:
- `src/analytics.js` (line 8)
- This deployment guide
- Your MCP server environment variables

### Customize the Dashboard

Edit `public/dashboard.html` to:
- Change branding/colors
- Add custom metrics
- Modify the authentication flow
- Add additional charts

### Add Database Storage

For persistent analytics storage, you can:
- Add Vercel Postgres integration
- Use Supabase for real-time data
- Implement Redis for caching

## Security Best Practices

1. **Keep tokens secret** - Never commit them to git
2. **Use strong tokens** - Generate random 32+ character strings
3. **Rotate tokens regularly** - Update them monthly
4. **Monitor access logs** - Check Vercel function logs
5. **Use HTTPS only** - Vercel provides this automatically

## Troubleshooting

### Dashboard Won't Load
- Check admin token is correct
- Verify environment variables are set
- Check Vercel function logs

### No Analytics Data
- Verify MCP server has correct API URL
- Check analytics secret matches
- Ensure MCP server is sending events

### NPM Data Not Updating
- Check NPM API rate limits
- Verify package name is correct
- Check network connectivity

## Monitoring

Monitor your deployment:
- Vercel dashboard for function logs
- NPM download trends
- Dashboard access patterns
- Error rates and performance

## Next Steps

1. **Deploy to Vercel** ✅
2. **Test the dashboard** ✅
3. **Update MCP server** ✅
4. **Monitor analytics** ✅
5. **Share with team** (optional)

Your private SlopWatch analytics dashboard is now ready! 🎉 