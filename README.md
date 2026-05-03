# Time Tracker - Setup & Deployment Guide

A mobile-friendly time tracking app that logs your in/out times to Google Sheets.

## Features
- ✅ Clock in/out tracking
- 📊 Daily summary (hours worked, sessions)
- 📈 Weekly summary with average hours
- 📝 Full history view with edit/delete
- 📱 Mobile-responsive design
- 👥 Multi-user support

## Tech Stack
- **Frontend:** React + Vite
- **Backend:** Node.js + Express
- **Database:** Google Sheets

## Local Setup

### 1. Prerequisites
- Node.js 16+
- npm or yarn
- Google account (for Sheets integration)

### 2. Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Frontend runs on `http://localhost:5173`

### 3. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

Backend runs on `http://localhost:5000`

## Google Sheets Integration (Optional)

The app works without Google Sheets, but to enable automatic logging:

### Step 1: Create a Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project
3. Enable the Google Sheets API

### Step 2: Create a Service Account
1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **Service Account**
3. Fill in the details and create
4. Go to the service account page → **Keys** → **Add Key** → **Create new JSON key**
5. Download the JSON file

### Step 3: Copy Credentials
From the JSON file, copy:
- `client_email` → `GOOGLE_SERVICE_ACCOUNT_EMAIL`
- `private_key` → `GOOGLE_PRIVATE_KEY` (keep the \n characters)

### Step 4: Create Google Sheet
1. Create a new Google Sheet
2. Share it with the service account email
3. Get the Sheet ID from the URL (the long string in the URL path)
4. Add this to `GOOGLE_SHEET_ID` in `.env`

### Step 5: Format the Sheet
Add these headers in the first row:
- A: Name
- B: Action
- C: Timestamp
- D: Date

## Deployment

### Quick Deploy Summary
1. **Backend** → Render.com (free tier available)
2. **Frontend** → Vercel (free tier available)

### Step-by-Step Deployment

#### 1. Deploy Backend on Render.com

1. Go to [render.com](https://render.com) and sign up
2. Click **"New Web Service"**
3. Connect your GitHub repo (Time-counter)
4. Configure:
   - **Name:** `time-tracker-backend`
   - **Root Directory:** `backend`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
5. Add **Environment Variables:**
   ```
   PORT=3001
   GOOGLE_SERVICE_ACCOUNT_EMAIL=your-email@project.iam.gserviceaccount.com
   GOOGLE_PRIVATE_KEY=your-private-key
   GOOGLE_SHEET_ID=your-sheet-id
   ```
6. Click **"Create Web Service"** and wait for deploy (~2-3 min)
7. Copy the backend URL (e.g., `https://time-tracker-backend.onrender.com`)

#### 2. Deploy Frontend on Vercel

1. Go to [vercel.com](https://vercel.com) and sign up with GitHub
2. Click **"Import Project"** and select your Time-counter repo
3. Configure:
   - **Framework Preset:** Vite
   - **Root Directory:** `frontend`
4. Add **Environment Variable:**
   ```
   VITE_API_URL=https://time-tracker-backend.onrender.com/api
   (Replace with your actual backend URL from Step 1)
   ```
5. Click **"Deploy"** and wait for deploy (~1-2 min)
6. Your frontend is now live! 🎉

#### 3. Alternative Backend Deployment Options

**Option A: Railway.app** (easiest, generous free tier)
- Sign up at [railway.app](https://railway.app)
- Connect GitHub repo
- Set environment variables
- Deploy

**Option B: Heroku** (now paid, but still an option)
- Sign up at [heroku.com](https://heroku.com)
- Use Heroku CLI or connect GitHub
- Deploy

### Important Notes

- **Google Sheets is optional** - app works without it (data in memory)
- **Free tier limits:**
  - Render.com: Spins down after 15 min of inactivity (free tier)
  - Vercel: No time limits on free tier
  - Railway.app: $5 free credits per month
- **For production:** Consider upgrading to paid tiers for always-on backend

### Troubleshooting Deployment

**"Backend not connecting" error:**
- Verify `VITE_API_URL` matches your backend URL
- Check backend logs on Render/Railway dashboard
- Ensure backend is running (not spun down)

**"CORS errors":**
- Already configured in backend (CORS enabled for all origins)
- If issues persist, check backend is accessible from browser

**Data not persisting:**
- Set up Google Sheets integration (optional)
- Without it, data resets when backend restarts

## Usage

1. Go to your deployed app
2. Enter your name and email
3. Click "Clock In" to start tracking
4. Click "Clock Out" when you leave
5. View daily/weekly summaries and history

## Troubleshooting

**"Google Sheets not configured" warning:**
- This is normal if you haven't set up Google Sheets
- The app still works and stores data in memory

**Data not syncing to Google Sheets:**
- Check if service account email is shared in the Sheet
- Verify credentials in backend `.env`
- Check backend logs for errors

**CORS errors:**
- Ensure backend is running
- Check `VITE_API_URL` in frontend `.env`

## File Structure
```
time-tracker/
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── App.css
│   │   └── main.jsx
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── backend/
│   ├── server.js
│   └── package.json
└── README.md
```
