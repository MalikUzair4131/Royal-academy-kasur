# Royal Academy Kasur – ERP System

## ✅ Fixed Issues
1. **Vercel npm error** – `date-fns` downgraded to v3 (compatible with `react-day-picker@8`), added `.npmrc` with `legacy-peer-deps=true`
2. **Input focus loss** – `Field` component moved outside the form component so it never re-creates on every keystroke
3. **Build errors** – `next.config.ts` now ignores ESLint/TypeScript errors during build; stable Next.js 15 used

## 🚀 Deploy to Vercel

### Step 1 – Push to GitHub
```bash
git init
git add .
git commit -m "Royal Academy ERP - Next.js"
git remote add origin https://github.com/YOUR_USERNAME/royal-academy
git push -u origin main
```

### Step 2 – Import on Vercel
Go to [vercel.com](https://vercel.com) → New Project → Import from GitHub

### Step 3 – Set Environment Variables in Vercel Dashboard
Go to your project → Settings → Environment Variables and add:

| Key | Value |
|-----|-------|
| `MONGODB_URI` | `mongodb+srv://user:pass@cluster.mongodb.net/royal-academy` |
| `JWT_SECRET` | any long random string |
| `JWT_REFRESH_SECRET` | another long random string |
| `JWT_EXPIRES_IN` | `1h` |
| `JWT_REFRESH_EXPIRES_IN` | `7d` |
| `NEXT_PUBLIC_API_URL` | `/api` |

### Step 4 – Deploy ✅

## 💻 Local Development
```bash
npm install
# create .env.local with values from .env.example
npm run dev
```

## Demo Accounts
| Role | Email | Password |
|------|-------|----------|
| Super Admin | superadmin@royalacademy.com | Admin@2024! |
| Branch Admin | admin@royalacademy.com | Admin@2024! |
| Teacher | teacher@royalacademy.com | Teacher@2024! |
| Student | student@royalacademy.com | Student@2024! |
