<div align="center">

# 👾 Pixel Art Challenge

**A new theme every day, a pixel canvas, and community voting.**

A mobile app where players draw pixel art for the daily theme, the community votes, and the most-voted drawing becomes the champion when time runs out.

[![Expo](https://img.shields.io/badge/Expo-SDK_57-000020?style=for-the-badge&logo=expo&logoColor=white)](https://expo.dev/)
[![React Native](https://img.shields.io/badge/React_Native-0.86-20232a?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactnative.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-6-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Firebase](https://img.shields.io/badge/Firebase-Auth_·_Firestore_·_Functions-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)](https://firebase.google.com/)

</div>

<div align="center">
  <img src="./docs/screenshots/arena.png" alt="Arena: today's theme and countdown" width="24%"/>
  <img src="./docs/screenshots/editor.png" alt="Editor: palette, fill, eyedropper, mirror" width="24%"/>
  <img src="./docs/screenshots/champions.png" alt="Champions: past challenges" width="24%"/>
  <img src="./docs/screenshots/profile.png" alt="Profile: stats and badges" width="24%"/>
</div>

---

## Features

**Core requirements**
1. Email and password sign-up / sign-in (the session survives app restarts).
2. A cell-by-cell drawing editor: color palette, drag-to-paint, 16×16 and 32×32 canvases.
3. There is always exactly one active challenge (theme + end time); drawings are submitted to it.
4. Browse other players' submissions and vote.
5. When time is up, the most-voted drawing is declared the winner on the server.
6. Past challenges and their winners are listed on the "Champions" screen.

**Extras**
- **Time-lapse:** every drawing's steps are recorded and replayed pixel by pixel in the gallery.
- **Daily palette:** each challenge is drawn with 6-7 colors (a creative constraint).
- **Editor tools:** pencil, eraser, fill, eyedropper, mirror symmetry, undo / redo.
- **AI jury:** each drawing gets a short, friendly comment from Gemini (generated on the server; the key never reaches the client).
- **AI theme generation:** new daily themes are generated with Gemini and fall back to a fixed list if the call fails.
- **Streaks and badges:** consecutive-participation streaks, plus first entry / 3- and 7-day streak / champion / popular badges.
- **Share card:** a drawing is rendered into a story-sized (1080×1920) image and shared.
- **Notifications:** push for new themes and wins, plus a local reminder two hours before a challenge ends.
- **Moderation (App Store 1.2):** report drawings, block users, delete account.

---

## Quick start

```bash
git clone https://github.com/begumaLakus/pixel-art-challenge.git
cd pixel-art-challenge
npm install
cp .env.example .env   # fill in your Firebase values
npm start              # Expo dev server on port 8083
```

Open the app with **Expo Go** (SDK 57) by scanning the QR code, or press `w` for the web build.

### Environment variables (`.env`)

| Variable | Description |
|---|---|
| `EXPO_PUBLIC_FIREBASE_*` | Firebase web app settings (API key, auth domain, project id, storage bucket, sender id, app id) |
| `EXPO_PUBLIC_SUPPORT_EMAIL`, `EXPO_PUBLIC_PRIVACY_URL`, `EXPO_PUBLIC_TERMS_URL` | Support and legal links shown on the profile screen (hidden when empty) |
| `EXPO_PUBLIC_EMULATOR_HOST` | Emulator mode only: your computer's LAN IP, for physical devices |

`.env` is not committed. The Gemini key is **not** used in the client; it lives in Secret Manager for Cloud Functions:

```bash
firebase functions:secrets:set GEMINI_API_KEY
```

### Local development (without touching the live project)

Runs against the Auth and Firestore emulators with sample data (requires Java 21+):

```bash
npm run emulators        # terminal 1
npm run seed             # sample challenges, drawings and a test user (see scripts/seed-emulator.mjs)
npm run start:emulator   # terminal 2, points the app at the emulators (add -- --web for the browser)
```

### Deployment

```bash
firebase deploy --only firestore:rules,firestore:indexes
firebase deploy --only functions     # builds first (predeploy)
```

---

## Technical decisions

**Grid size.** A drawing is stored as a flat color array (`pixels[]`, length = size²). 16×16 is comfortable for touch, 32×32 is for detail. The server rules restrict the size to 16/32 and the array length to size². Saved drawings are rendered by merging same-colored cells within a row (fewer views, smooth lists).

**Voting constraint.** A user gets **one vote per challenge**; the vote document is `votes/{challengeId}_{uid}` (voting for another drawing moves the vote, tapping the same one again removes it). The constraints are enforced in **Firestore security rules**, not the client: no voting for your own drawing, the drawing must belong to the same challenge, and no voting once the challenge has ended. `voteCount` cannot be written by clients; a Cloud Function recounts the `votes` collection from scratch (triggers run "at least once", so a recount is idempotent where an incremental counter would not be).

**One submission per challenge.** The submission document id is `submissions/{challengeId}_{uid}` and the rules require it, so duplicate submissions are impossible on the server too.

**Challenge lifecycle.** `manageChallenges` runs every minute: it completes expired challenges, picks the winner, and starts the next challenge (theme + palette from Gemini or a fixed list). There is always an active challenge (a gap of about one minute at most). Time checks use server time (`request.time`); the client clock is never trusted.

**Winner.** Votes are counted directly from the `votes` collection, and **ties go to the earliest submission**. Leftover votes for deleted drawings are ignored.

**Security.** The rules live in `firestore.rules` and are tested against the real emulator in `tests/rules` (each rule was verified by removing it and confirming a test fails).

---

## Tests

```bash
npm test               # client unit tests
npm run test:functions # Cloud Functions tests
npm run test:rules     # Firestore rules (emulator, requires Java 21+)
npm run typecheck && npm run lint
```

## Project structure

```
app/                  Expo Router routes (tabs: Arena, Gallery, Champions, Profile; editor; auth)
src/components/ui/    Design-system components (StickerBox, StickerButton, PixelArt, ...)
src/theme/            Color, spacing and font tokens, plus pixel sprites
src/features/         auth · challenges · editor · submission · voting · archive
                      profile · moderation · notifications · share
functions/            Cloud Functions (challenge loop, vote counting, AI, push, account deletion)
firestore.rules       Security rules
tests/rules/          Rules tests
scripts/              Emulator seeding and helper scripts
```

## Design

A cream background, thick black outlines and hard (blur-free) offset shadows, with a single accent color that changes with the daily theme. Headings use Space Grotesk and labels use Silkscreen (a pixel font). The app uses its own pixel-art mascot and sprites instead of emoji.
