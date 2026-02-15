# Civic Intelligence OS - Project Requirements

## Table of Contents
1.  [System Prerequisites](#1-system-prerequisites)
2.  [Technology Stack](#2-technology-stack)
3.  [Key Dependencies](#3-key-dependencies)
4.  [Environment Variables](#4-environment-variables)
5.  [Setup Instructions](#5-setup-instructions)
6.  [Project Structure](#6-project-structure-overview)

---

## 1. System Prerequisites
Before running the project, ensure your development environment meets the following requirements:

*   **Node.js**: Version 18.17.0 or later (Recommended: v20 LTS).
*   **Package Manager**: `npm`, `yarn`, or `pnpm`.
*   **Operating System**: Windows, macOS, or Linux.

## 2. Technology Stack

### Core Frameworks
*   **Frontend**: [Next.js 16 (App Router)](https://nextjs.org/)
*   **Language**: [TypeScript](https://www.typescriptlang.org/)
*   **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
*   **State Management & UI Logic**: React 19 (Server Components & Actions)

### Backend & Database
*   **Database**: [Firebase Firestore](https://firebase.google.com/docs/firestore) (NoSQL)
*   **Authentication**: [Firebase Authentication](https://firebase.google.com/docs/auth)
*   **Functions**: Firebase Cloud Functions (optional for advanced logic)

### AI Integration
*   **Google Gemini AI**:
    *   **Frontend**: Gemini 2.5 Flash-Lite (via `@google/generative-ai`)
    *   **Backend**: Vertex AI / Gemini 1.5 Pro

### Maps & Geolocation
*   **Mapping Library**: [Leaflet.js](https://leafletjs.com/)
*   **React Wrapper**: `react-leaflet`
*   **Tile Provider**: OpenStreetMap (OSM)

## 3. Key Dependencies

| Type | Package | Purpose |
| :--- | :--- | :--- |
| **UI Components** | `@radix-ui/*` | Accessible, unstyled primitives for building high-quality design systems. |
| **Icons** | `lucide-react` | Beautiful & consistent icon set. |
| **Forms** | `react-hook-form` | Performant, flexible forms with easy validation. |
| **Validation** | `zod` | TypeScript-first schema declaration and validation library. |
| **Toast Notifications** | `sonner` | An opinionated toast component for React. |
| **Charts** | `recharts` | Redefined chart library meant to deploy with React. |
| **Utilities** | `clsx`, `tailwind-merge` | Utility for constructing `className` strings conditionally. |
| **Dates** | `date-fns` | Modern JavaScript date utility library. |
| **Search** | `cmdk` | Fast, unstyled command menu React component. |

## 4. Environment Variables
Create a `.env.local` file in the root directory and add the following keys:

```env
# Firebase Configuration (Client-Side)
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id

# Google Gemini AI API Key
NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key
```

## 5. Setup Instructions

### 1. Repository Setup
```bash
# Install dependencies
npm install
# or
yarn install
```

### 2. Firebase Setup
1.  Create a project in the [Firebase Console](https://console.firebase.google.com/).
2.  Enable **Authentication** (Email/Password, Phone).
3.  Create a **Firestore Database**.
4.  Copy the web configuration and update your `.env.local` file.
5.  (Optional) Set up Cloud Functions if needed.

### 3. Running the Application
```bash
# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### 4. Code Quality Tools
*   **Linting**: `npm run lint` (ESLint)
*   **Formatting**: Prettier (if configured)

## 6. Project Structure Overview
*   `/src/app`: App Router pages and layouts.
*   `/src/components/ui`: Reusable UI components (buttons, inputs, etc.).
*   `/src/lib`: Utility functions and Firebase configuration.
*   `/public`: Static assets (images, icons).
*   `firestore.rules`: Security rules for Firestore database.
