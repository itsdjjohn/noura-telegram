# NOURA Telegram Beta

NOURA is a mobile-first nutrition and performance companion designed to run as a Telegram Mini App.

## Beta v0.1

Current features:

- Telegram Mini App ready layout
- Telegram first-name detection when launched inside Telegram
- Onboarding and nutrition goal selection
- Estimated calorie and macro targets
- Daily dashboard
- Meal logging
- Protein, carbs and fat tracking
- Water tracking
- Meal history and deletion
- Simple healthy recipe ideas
- Editable calorie/protein targets
- LocalStorage persistence (no database required for personal beta)
- WHOOP server integration placeholder

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Deploy on Vercel

Import the GitHub repository into Vercel and deploy with the default Next.js settings.

## Telegram Mini App

1. Create or use a bot with `@BotFather`.
2. Deploy this project to Vercel and copy the HTTPS deployment URL.
3. In BotFather, configure a Mini App / menu button for your bot using that URL.
4. Open the bot in Telegram and launch NOURA.

The app loads Telegram's Web App SDK in `app/layout.tsx` and calls `ready()` + `expand()` on startup.

## Data storage in this beta

Nutrition data is stored in browser `localStorage` under:

`noura-beta-v01`

This is intentionally database-free for the personal beta. Clearing Telegram/browser website data or switching devices can remove or isolate the saved data.

## WHOOP next phase

Create a WHOOP developer application and configure these values in Vercel (never commit real credentials):

```env
WHOOP_CLIENT_ID=
WHOOP_CLIENT_SECRET=
WHOOP_REDIRECT_URI=
```

A starter endpoint is available at:

`/api/whoop/status`

Next implementation steps:

- `/api/whoop/connect`
- `/api/whoop/callback`
- secure token storage strategy for the personal beta
- Recovery
- Sleep
- HRV / resting heart rate
- Strain / cycles
- Workouts
- Telegram notifications based on nutrition + WHOOP data

## Important

The calorie/macro estimator in v0.1 is a convenience starting point, not medical advice. Targets can be edited manually from Profile.
