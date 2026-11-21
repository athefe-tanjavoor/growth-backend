# Growthanalys Centralized Backend API (v2.0)

Production REST API for Growthanalys platform built with Node.js 22, Express, and TypeScript.
Designed for single-click deployment via **Coolify** / Docker.

---

## Deployment via Coolify

1. **Create Application in Coolify:**
   * Source: Git Repository
   * Build Pack: **Dockerfile** (uses multi-stage build at repository root)
   * Port: `5000`
2. **Environment Variables:**
   ```env
   NODE_ENV=production
   PORT=5000
   API_PREFIX=/api/v1
   MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/growthanalys_admin
   JWT_SECRET=<strong-random-secret-min-32-chars>
   JWT_REFRESH_SECRET=<strong-random-secret-min-32-chars>
   CORS_ORIGINS=https://growthanalys.com,https://admin.growthanalys.com
   R2_ACCOUNT_ID=<cloudflare-account-id>
   R2_ACCESS_KEY_ID=<cloudflare-access-key-id>
   R2_SECRET_ACCESS_KEY=<cloudflare-secret-access-key>
   R2_BUCKET_NAME=growthanalys-media
   R2_PUBLIC_URL=https://media.growthanalys.com
   ```
3. **Healthcheck Endpoint:**
   `http://localhost:5000/api/v1/health`

---

## Local Development

```bash
npm install
npm run dev
```

Server runs on `http://localhost:5000/api/v1`.
