# Dev Environment Setup (Low/No-Code)

This guide helps you create a safe development environment so you can work on ThreeDungeons updates without risking the live platform.

---

## What You're Protecting

| Component | Production (Live) | Dev (Safe to Break) |
|-----------|-------------------|---------------------|
| **Supabase** | Your real project with real data | A separate project for testing |
| **Game** | GitHub Pages (what users see) | Your local copy or a dev branch |
| **Dashboard** | GitHub Pages (what leaders see) | Your local copy or a dev branch |
| **Code** | `main` branch | `dev` branch |

---

## Step 1: Create a Dev Supabase Project

**Why:** Your production Supabase holds real resident data. A second project keeps it completely isolated.

**Steps:**

1. Go to [supabase.com](https://supabase.com) and sign in.
2. Click **New Project** (same as you did for production).
3. Name it clearly, e.g. **"ThreeDungeons-Dev"** or **"Residency Game - Dev"**.
4. Choose the same region as production (or any).
5. Set a database password and save it.
6. Click **Create new project** and wait for it to finish.
7. Go to **Project Settings** (gear) → **API**.
8. Copy and save:
   - **Project URL**
   - **anon public** key

**Give both to your developer** so they can point the game and dashboard at the dev project during development.

**Apply the schema to dev:** Your developer will run the migrations (from `supabase/migrations/`) against this dev project. Production stays untouched.

---

## Step 2: Use Git Branches

**Why:** Work on a separate branch so `main` (what deploys to production) only changes when you're ready.

**Steps:**

1. In Cursor (or your editor), open the **Source Control** panel (branch icon on the left).
2. Create a new branch: click the branch name at the bottom-left, then **Create new branch**.
3. Name it `dev` (or `feature/your-feature-name`).
4. Do all your work on this branch. Commit and push to it.
5. When you're ready to go live, your developer will merge `dev` into `main` and deploy.

**Rule of thumb:** Never push directly to `main` if you're unsure. Work on `dev`, then merge when tested.

---

## Step 3: Local Testing (Optional but Recommended)

**Why:** You can test the game and dashboard on your own computer before anything goes to GitHub Pages.

**For the game:**

1. The game is static HTML/JS. You need a simple web server to run it locally.
2. In Cursor, install the **Live Server** extension (if you don't have it): Extensions → search "Live Server" → Install.
3. Right-click `index.html` in the project → **Open with Live Server**.
4. The game opens in your browser at `http://127.0.0.1:5500` (or similar).
5. Your developer will configure the game to use the **dev** Supabase URL when running locally (or from a dev branch).

**For the dashboard:**

1. The dashboard is in a separate repo. Your developer will clone it and run `npm run dev`.
2. It will open at `http://localhost:5173` (or similar).
3. The dashboard will be configured to use the **dev** Supabase project.

---

## Step 4: CORS for Local Dev

Supabase needs to allow your local URLs to talk to it.

**Steps (in your dev Supabase project only):**

1. Go to **Project Settings** → **API**.
2. Find **CORS** or **Allowed Origins**.
3. Add:
   - `http://127.0.0.1:5500` (Live Server default)
   - `http://localhost:5173` (Vite dashboard default)
   - `http://localhost:3000` (if your dev server uses this)
4. Save.

**Important:** Do this only in the **dev** Supabase project. Production CORS should only list your real GitHub Pages URLs.

---

## Summary: Your Workflow

1. **Create dev Supabase project** → Give URL and anon key to developer.
2. **Work on `dev` branch** → All code changes go here first.
3. **Developer applies migrations to dev** → Schema changes tested on dev, not production.
4. **Test locally** → Game and dashboard point at dev Supabase.
5. **When ready for production** → Developer merges `dev` to `main`, runs migrations on production (if any), deploys.

---

## What You Don't Need to Do

- You don't need to install Node.js, npm, or the Supabase CLI unless you want to run things yourself.
- You don't need to understand migrations or RLS—your developer handles that.
- You don't need a separate GitHub repo for dev—branches in the same repo are enough.

---

## Quick Reference for Your Developer

When setting up the dev environment, the developer should:

| Task | Details |
|------|---------|
| Link Supabase CLI to dev project | `supabase link --project-ref DEV_PROJECT_REF` |
| Apply migrations to dev | `supabase db push` (or run SQL manually in dev project) |
| Game plugin config | Use dev Supabase URL and anon key for local/dev builds |
| Dashboard `.env` | `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` pointing to dev |
| CORS | Add localhost origins in dev Supabase only |
