# Pixel Art Challenge

<p align="center">
  <img src="https://img.shields.io/badge/React_Native-0.74+-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React Native" />
  <img src="https://img.shields.io/badge/Expo-51.0+-000000?style=for-the-badge&logo=expo&logoColor=white" alt="Expo" />
  <img src="https://img.shields.io/badge/TypeScript-5.0+-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black" alt="Firebase" />
</p>

A React Native mobile application where users create pixel art based on an active challenge theme and compete through community voting.

> [!NOTE]
> 🚧 **Project Status:** Currently under active development.

---

## 🛠 Tech Stack

| Domain | Technology |
| :--- | :--- |
| **Framework** | React Native (Expo) |
| **Language** | TypeScript |
| **Navigation** | Expo Router |
| **Backend / DB** | Firebase Firestore & Authentication |
| **Serverless Architecture** | Firebase Cloud Functions |

---

## 🚀 Getting Started

### Prerequisites

Ensure you have Node.js and npm installed on your local machine.

### Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone [https://github.com/begumaLakus/pixel-art-challenge.git](https://github.com/begumaLakus/pixel-art-challenge.git)
   cd pixel-art-challenge

   Install dependencies:

Bash
npm install
Configure Environment Variables:
Create a .env file in the root directory:  

Kod snippet'i
EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id
[!IMPORTANT]
Do NOT commit .env files or private credentials to public version control.

Run the Application:

Bash
npx expo start
📐 Technical Architecture & Decisions
🎨 Pixel Editor Grid
Default resolution is 16×16.

Supports 32×32 canvas size for detailed pixel drawing.

⏱️ Autonomous Challenge Lifecycle
System maintains one active challenge with a defined theme and expiration timestamp.

Firebase Cloud Functions trigger scheduled cron jobs to handle expired challenges, select winners based on votes, and automatically spawn the next themed challenge.

🗳️ Community Voting
Users participate in real-time voting on active submissions.

Voting constraints and anti-abuse mechanics are managed on the backend.

📜 License
Distributed under the MIT License. Developed as part of a React Native software engineering task.
