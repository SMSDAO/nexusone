# NEXUS ONE: AI Workspace

NEXUS ONE is a modern, responsive, and interactive AI workspace application. It integrates AI-powered agent interaction, a customizable command interface (Conduit Bar), real-time process monitoring, file management, and advanced workspace snapshotting features.

## Features
- **Persona Interface**: Switch between customized AI persona operators directly from the command bar.
- **Conduit Command Bar**: Advanced input channel with quick actions for clearing cache, restarting agents, and capturing system snapshots.
- **Workspace Snapshots**: Instantly serialize your working state (files, processes, logs) to JSON. Save backups directly to your profile vault or download them for offline storage.
- **Real-Time Telemetry**: Real-time mock monitoring of processes, audit logs, and file changes.
- **Firebase Authentication & Firestore**: User profile management and data persistence via Google Firebase.
- **Animations & Styling**: Powered by Tailwind CSS and Motion/React for fluid and responsive designs.

## Installation

1. **Clone the repository** (if applicable):
   ```bash
   git clone <repository-url>
   cd <project-directory>
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env` file in the root directory (refer to `.env.example` if available). 
   You will need to provide your Firebase configuration keys and optionally a Gemini API key.
   ```env
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```

4. **Run the Development Server**:
   ```bash
   npm run dev
   ```
   The application will be available at `http://localhost:3000`.

## Basic Usage

1. **Sign In**: Launch the app and authenticate via the Firebase-powered login interface.
2. **Execute Commands**: Use the Conduit Bar at the bottom of the screen to input commands or use quick actions (like "Clear Cache" or "Restart Agent").
3. **Manage Snapshots**: Click the camera icon in the Conduit Bar to open the Snapshot Deck. From here, you can save the current workspace state to your Profile Vault, download it as a JSON file, or copy it to your clipboard.
4. **Monitor Processes**: View the live terminal feed and process monitors to see how the system is reacting to your commands.

## Architecture

- **Frontend**: React (v18+) with Vite, written in TypeScript.
- **Styling**: Tailwind CSS for responsive and customizable visual design.
- **Animations**: `motion/react` for complex layout transitions.
- **Icons**: `lucide-react`
- **Backend / Database**: Firebase (Authentication and Firestore).
