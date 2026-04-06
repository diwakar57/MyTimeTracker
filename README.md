# MyTimeTracker

A time-tracking web app built with Next.js 14, TypeScript, Tailwind CSS, and Firebase.

## Setup

### 1. Firebase configuration

This app requires a Firebase project. Create one at [console.firebase.google.com](https://console.firebase.google.com/), then enable **Authentication** (Google sign-in) and **Firestore**.

Copy the web app credentials from **Project Settings → Your apps → Web app**.

### 2. Local development

```bash
cp .env.local.example .env.local
```

Fill in `.env.local` with your Firebase values:

```
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
```

Then run the dev server:

```bash
npm install
npm run dev
```

### 3. Vercel deployment

Add the same `NEXT_PUBLIC_FIREBASE_*` variables in your Vercel project under **Settings → Environment Variables** before deploying. Without them the app will display a configuration error screen.

## Build

```bash
npm run build
```