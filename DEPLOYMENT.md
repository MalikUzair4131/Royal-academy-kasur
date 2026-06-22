# 🏫 Royal Academy ERP — Deployment Guide

## Architecture Overview

```
Frontend (React)          Backend (Node.js/Express)      Database
Netlify                   Render.com (free tier)         MongoDB Atlas (free)
     │                          │                              │
     └──── HTTPS API calls ─────►──── mongoose ──────────────►┘
```

> **Answer to your question:** YES — frontend and backend are **separate folders** deployed to **different platforms**. They communicate over HTTPS via REST API.

---

## 📁 Folder Structure

```
royal-academy-erp/
├── frontend/          ← Deploy to Netlify
│   ├── src/
│   ├── netlify.toml
│   └── package.json
└── backend/           ← Deploy to Render.com
    ├── src/
    ├── render.yaml
    └── package.json
```

---

## 🗄️ Step 1 — MongoDB Atlas (Database)

1. Go to **https://cloud.mongodb.com** → Sign up free
2. Create a **Free M0 Cluster** (512MB free forever)
3. **Database Access** → Add user: `royalacademy` / strong password
4. **Network Access** → Add IP: `0.0.0.0/0` (allow all — required for Render)
5. **Connect** → Drivers → Copy connection string:
   ```
   mongodb+srv://royalacademy:<password>@cluster0.xxxxx.mongodb.net/royal_academy_erp?retryWrites=true&w=majority
   ```
6. Save this — you'll need it in Step 2.

---

## 🖥️ Step 2 — Backend on Render.com

1. Push your code to GitHub (both folders in one repo is fine)
2. Go to **https://render.com** → New → Web Service
3. Connect your GitHub repo
4. Set **Root Directory**: `backend`
5. Set **Build Command**: `npm install`
6. Set **Start Command**: `node src/server.js`
7. Set these **Environment Variables**:

   | Key | Value |
   |-----|-------|
   | `NODE_ENV` | `production` |
   | `MONGODB_URI` | your Atlas URI from Step 1 |
   | `JWT_ACCESS_SECRET` | any random 32+ char string |
   | `JWT_REFRESH_SECRET` | any different random 32+ char string |
   | `JWT_ACCESS_EXPIRE` | `15m` |
   | `JWT_REFRESH_EXPIRE` | `7d` |
   | `FRONTEND_URL` | `https://your-app.netlify.app` *(fill after Step 3)* |

8. Deploy! Render gives you a URL like `https://royal-academy-erp.onrender.com`
9. Test: visit `https://royal-academy-erp.onrender.com/health` → should return JSON ✅

### Seed Initial Data
```bash
# On your local machine with the correct MONGODB_URI set:
cd backend
cp .env.example .env   # fill in your values
npm install
npm run seed
```
This creates all demo accounts. Credentials printed in terminal.

---

## 🌐 Step 3 — Frontend on Netlify

1. Go to **https://netlify.com** → Add new site → Import from Git
2. Select your repo, set **Base Directory**: `frontend`
3. Set **Build Command**: `npm run build`
4. Set **Publish Directory**: `frontend/dist`
5. Add **Environment Variable**:
   | Key | Value |
   |-----|-------|
   | `VITE_API_URL` | `https://royal-academy-erp.onrender.com/api` |
6. Deploy! Netlify gives you `https://your-app.netlify.app`
7. Go back to Render → update `FRONTEND_URL` to your Netlify URL → Redeploy

---

## 🔑 Demo Login Credentials (after seeding)

| Role | Email | Password |
|------|-------|----------|
| Owner | owner@royalacademy.com | Owner@2024! |
| Super Admin | superadmin@royalacademy.com | Admin@2024! |
| Branch Admin | admin@royalacademy.com | Admin@2024! |
| Teacher | teacher@royalacademy.com | Teacher@2024! |
| Student | student@royalacademy.com | Student@2024! |
| Parent | parent@royalacademy.com | Parent@2024! |

---

## 🔧 Local Development

```bash
# Terminal 1 — Backend
cd backend
cp .env.example .env   # fill MONGODB_URI + JWT secrets
npm install
npm run dev            # runs on http://localhost:5000

# Terminal 2 — Frontend
cd frontend
npm install
npm run dev            # runs on http://localhost:5173 (auto-proxies /api to :5000)
```

---

## 🚨 Common Issues & Fixes

| Problem | Fix |
|---------|-----|
| `CORS error` | Set `FRONTEND_URL` correctly in Render env vars, redeploy |
| `Network Access` error on MongoDB | Set `0.0.0.0/0` in Atlas Network Access |
| Render free tier sleeps after 15min | First request takes ~30s to wake up. Upgrade or use UptimeRobot to ping it |
| Login works but 401 on next request | Check `VITE_API_URL` has no trailing slash |
| Build fails on Netlify | Make sure `VITE_API_URL` env var is set before build |

---

## 📱 What's Separate vs What's Together

```
Netlify (Frontend)           Render (Backend)
─────────────────────        ──────────────────────────
React UI                     Express REST API
Auth UI / Login page         JWT authentication
Dashboard, Forms, Tables     MongoDB CRUD operations
Role-based UI rendering      Role-based access control
Charts, Reports UI           Report aggregation
                             PDF generation (future)
                             Email notifications (future)
```

The two **never need to be on the same server**. The frontend just calls `VITE_API_URL/auth/login`, etc. They are completely independent deployments.
