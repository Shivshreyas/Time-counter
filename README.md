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

### Deploy Frontend on Vercel

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Import your repository
4. Set environment variables:
   - `VITE_API_URL=https://your-backend-url.com/api`
5. Deploy

### Deploy Backend on Render.com

1. Go to [render.com](https://render.com)
2. Create new **Web Service**
3. Connect your GitHub repository
4. Set environment variables:
   - `GOOGLE_SERVICE_ACCOUNT_EMAIL`
   - `GOOGLE_PRIVATE_KEY`
   - `GOOGLE_SHEET_ID`
5. Build command: `npm install`
6. Start command: `npm start`
7. Deploy

### Update Frontend After Backend Deployment
Once backend is deployed, update `frontend/.env`:
```
VITE_API_URL=https://your-backend-url.com/api
```

Then redeploy frontend to Vercel.

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
