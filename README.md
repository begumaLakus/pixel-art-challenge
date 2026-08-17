# Pixel Art Challenge

<div align="center">

![React Native](https://img.shields.io/badge/React_Native-0.74+-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Expo](https://img.shields.io/badge/Expo-51.0+-000020?style=for-the-badge&logo=expo&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)

<p align="center">
  A React Native mobile application where users create pixel art based on an active challenge theme and compete through community voting.
</p>

</div>

> [!NOTE]
> 🚧 **Project Status:** Currently under active development.

---

## 📱 Screenshots

<div align="center">
  <table>
    <tr>
      <td align="center" width="33%">
        <b>Challenge Arena</b><br/><br/>
        <img src="./assets/screenshots/challenge-screen.png" alt="Challenge Screen" width="100%"/>
        <br/><em>Theme, timer & user actions</em>
      </td>
      <td align="center" width="33%">
        <b>Pixel Editor</b><br/><br/>
        <img src="./assets/screenshots/editor-screen.png" alt="Pixel Editor" width="100%"/>
        <br/><em>Dynamic grid & color palette</em>
      </td>
      <td align="center" width="33%">
        <b>Community Gallery</b><br/><br/>
        <img src="./assets/screenshots/submissions-screen.png" alt="Submissions Screen" width="100%"/>
        <br/><em>Artwork feed & live voting</em>
      </td>
    </tr>
  </table>
</div>

---

## 🛠 Tech Stack

| Domain | Technology |
|---|---|
| **Framework** | React Native (Expo SDK 51+) |
| **Language** | TypeScript |
| **Navigation** | Expo Router |
| **Backend / DB** | Firebase Firestore & Authentication |
| **Serverless Architecture** | Firebase Cloud Functions |

---

## 🚀 Getting Started

### Prerequisites

Ensure the following are installed on your local development machine:

- **Node.js** (v18 or higher recommended)
- **npm** or **yarn** / **pnpm**
- **Expo Go** app on your physical mobile device or an iOS/Android Simulator

---

### Installation & Setup

#### 1. Clone the repository

```bash
git clone https://github.com/begumaLakus/pixel-art-challenge.git
cd pixel-art-challenge
```

#### 2. Install dependencies

```bash
npm install
```

#### 3. Configure Firebase environment variables

Create a `.env` file in the root directory:

```env
EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id
```

> [!WARNING]
> Never commit `.env` files or private credentials to public version control.

#### 4. Start the application

```bash
npx expo start
```

Use the printed QR code with **Expo Go** (Android/iOS) or press `a` for Android Emulator / `i` for iOS Simulator.

---

## 📐 Technical Architecture & Decisions

### 🎨 1. Pixel Editor Grid (16×16 & 32×32)
- **Default Resolution:** 16×16 pixels.
- **Detailed Mode:** 32×32 pixels option.
- **Why?** A 16×16 grid strikes the optimal balance between accessible interaction on touchscreens and preserving retro pixel aesthetics. The optional 32×32 mode offers higher fidelity for advanced compositions without altering the core drawing mechanics.

---

### ⏱️ 2. Autonomous Challenge Lifecycle
- The application relies on an always-active challenge cycle comprising: `Theme`, `Start Time`, `Expiration Time`, and associated `Submissions & Votes`.
- **Firebase Cloud Functions** handle scheduled cron triggers:
  1. Detect expiration of the active challenge.
  2. Aggregate and tally user votes.
  3. Crown and persist the winner to the archive.
  4. Automatically select the next theme and seed a new active challenge.
- **Why?** Eliminates dependency on manual administrator interventions and client-side lifecycle triggers. Server-side scheduling ensures seamless, 24/7 autonomous rounds regardless of user concurrency.

---

### 🗳️ 3. Authoritative Backend Voting
- Users browse submissions and cast votes for entries in real time.
- Voting constraints and deduplication rules are strictly validated on the backend via Firebase Cloud Functions and Firestore Security Rules.
- **Why?** Client-side validation is inherently vulnerable to tampering. Centralizing vote integrity on the backend provides a single source of truth for vote limits, validation, and anti-abuse prevention.

---

### 🏆 4. Challenge Completion & Winner Selection
- Upon expiration, active challenge entries freeze automatically.
- Server-side functions determine the winner and update the leaderboard atomically before instantiating the subsequent challenge.
- **Why?** Guarantees atomicity and data consistency across all user sessions without race conditions.

---

## 🔄 Challenge Flow

```text
┌───────────────────────────────────────────────┐
│              Active Challenge                 │
│         (Live Theme & Countdown)              │
└──────────────────────┬────────────────────────┘
                       │
                       ▼
┌───────────────────────────────────────────────┐
│            Users Create Pixel Art             │
│            (16x16 / 32x32 Canvas)             │
└──────────────────────┬────────────────────────┘
                       │
                       ▼
┌───────────────────────────────────────────────┐
│          Submissions Enter Gallery            │
│         (Real-time Firestore Sync)            │
└──────────────────────┬────────────────────────┘
                       │
                       ▼
┌───────────────────────────────────────────────┐
│               Community Voting                │
│         (Server-Validated Votes)              │
└──────────────────────┬────────────────────────┘
                       │
                       ▼
┌───────────────────────────────────────────────┐
│              Challenge Expires                │
│       (Trigger Cloud Function Schedule)       │
└──────────────────────┬────────────────────────┘
                       │
                       ▼
┌───────────────────────────────────────────────┐
│              Winner Determined                │
│         (Vote Tally & Result Stored)          │
└──────────────────────┬────────────────────────┘
                       │
                       ▼
┌───────────────────────────────────────────────┐
│             New Challenge Created             │
│          (Cycle Repeats Continuously)         │
└──────────────────────┬────────────────────────┘
                       │
                       └────────► [ Active Challenge ]
```

---

## 🔥 Firebase Architecture

```text
├── React Native Client (Expo)
│   ├── Interactive Pixel Editor & Canvas
│   ├── Real-time Firestore Listeners (Live Feed)
│   └── Optimistic UI Updates & Navigation
│
├── Cloud Firestore
│   ├── /challenges (Active & Historical metadata)
│   ├── /submissions (Artwork pixel data & metadata)
│   └── /votes (User-vote relations & tallies)
│
└── Firebase Cloud Functions
    ├── Scheduled Challenge Expiration & Transition
    ├── Winner Calculation & Ledger Write
    └── Server-side Vote Validation
```

---

## 📁 Project Structure

```text
pixel-art-challenge/
├── app/                  # Expo Router file-based screens & navigation
│   ├── (tabs)/           # Tab-based main navigation routes
│   └── _layout.tsx       # Root layout & context providers
├── components/           # Reusable UI & canvas components
│   ├── editor/           # Pixel canvas, palette & tools
│   └── gallery/          # Submission cards & voting buttons
├── constants/            # Theme colors, palette presets & typography
├── hooks/                # Custom React hooks (auth, canvas, timers)
├── functions/            # Firebase Cloud Functions (backend logic)
├── assets/               # Local media, icons & screenshots
│   └── screenshots/      # README application previews
├── .env                  # Local Firebase environment variables (ignored)
└── package.json          # Project dependencies & scripts
```

---

## 🔐 Environment & Security

- **Public Client Variables:** Variables prefixed with `EXPO_PUBLIC_` are bundled securely for client-side Firebase initialization.
- **Rule Enforcement:** Direct database mutations are protected by Firestore Security Rules.
- **Sensitive Operations:** Round transitions and tally computations run exclusively in trusted Cloud Function environments.

---

## 📜 License

Distributed under the **MIT License**. Developed as part of a React Native software engineering task.
