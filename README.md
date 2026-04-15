# GFL BGMI League MVP (Next.js + TypeScript)

Production-style, mobile-first esports MVP for **GFL (Gand Faad League)**.

## Included
- Home page with hype hero, countdown switch logic, highlights, featured captains, announcements, AI host panel.
- Auth scaffolding (signup/login/forgot) with mock local auth state and email verification indicator.
- Player dashboard + profile editor.
- Tournament overview + schedule + FAQ.
- Draft auction engine (mode A) with state transitions and captain turn flow.
- Admin controls scaffold.
- Backend-ready TypeScript models and SQL schema suggestions.

## Time Logic (IST)
- Website Launch: `2026-04-15T18:00:00+05:30`
- Tournament Start: `2026-04-18T21:00:00+05:30`

The countdown automatically transitions:
`website_launch -> tournament_start -> live`.

## Run
```bash
npm install
npm run dev
```

## Deploy to Vercel
1. Push this repository to GitHub.
2. Import the repository in Vercel.
3. Keep default framework as **Next.js** (or use `vercel.json` in this repo).
4. Add environment variables from `.env.example` if needed.
5. Deploy.

Recommended production settings:
- Node.js runtime: default Vercel runtime for Next.js 14.
- Build command: `npm run build`
- Install command: `npm install`
- Health check endpoint after deploy: `/api/health`

### Timezone-critical note
The countdown uses hardcoded IST timestamps for the current season:
- Launch: **April 15, 2026 at 6:00 PM IST** (`2026-04-15T18:00:00+05:30`)
- Tournament start: **April 18, 2026 at 9:00 PM IST** (`2026-04-18T21:00:00+05:30`)

This guarantees consistent countdown behavior regardless of deploy region.

## Architecture Notes
- Components are grouped by domain (`home`, `auction`, `auth`, `profile`, `tournament`, `layout`).
- `lib/services` contains business logic (countdown, auction state machine, auth utilities).
- `lib/data/mock.ts` provides realistic BGMI demo seeds.
- `lib/data/schema.sql` provides backend DB starter schema.

## Backend Upgrade Path
1. Replace `lib/services/auth.ts` with Supabase Auth/Firebase Auth.
2. Store auction runtime in realtime DB table + subscriptions.
3. Add server actions for admin mutations and announcements.
4. Connect AI Host panel to LLM API endpoint for live commentary.
