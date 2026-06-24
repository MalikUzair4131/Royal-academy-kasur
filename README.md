# Royal Academy Kasur – ERP System (Next.js)

## Tech Stack
- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS + CSS Variables
- **UI**: shadcn/ui components
- **Auth**: JWT (stored in localStorage)
- **API**: Axios with auto token refresh
- **Charts**: Recharts
- **Notifications**: Sonner

## Getting Started

### 1. Install dependencies
```bash
npm install
```

### 2. Set environment variable
Create a `.env.local` file:
```
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

### 3. Run development server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Deploying to Vercel

1. Push this project to GitHub
2. Go to [vercel.com](https://vercel.com) → New Project → Import from GitHub
3. In **Environment Variables**, add:
   - `NEXT_PUBLIC_API_URL` = your backend URL (e.g. `https://royal-academy-api.onrender.com/api`)
4. Click **Deploy** ✅

## Project Structure
```
app/
  (auth)/login/         → Login page (no sidebar)
  (dashboard)/          → All protected pages (with sidebar)
    dashboard/
    students/
    teachers/
    courses/
    batches/
    fees/
    salary/
    attendance/
    reports/
    settings/
    users/
components/
  auth/                 → Login component
  layout/               → Sidebar + header layout
  pages/                → All page components
  ui/                   → shadcn/ui components
contexts/               → AuthContext
services/               → API service (axios)
lib/                    → Utilities
```

## Demo Accounts
| Role | Email | Password |
|------|-------|----------|
| Super Admin | superadmin@royalacademy.com | Admin@2024! |
| Branch Admin | admin@royalacademy.com | Admin@2024! |
| Teacher | teacher@royalacademy.com | Teacher@2024! |
| Student | student@royalacademy.com | Student@2024! |
