# Civic Intelligence OS (Civic-intel-OS)

A premium, government-grade administrative dashboard and citizen engagement platform designed for real-time city management. Civic Intelligence OS streamlines urban governance through automated ticket assessment, intelligent workforce dispatching, and multi-departmental coordination.

## 🚀 Key Features

### 🏛️ Unified Command Center
- **Dynamic Dispatch Map**: Real-time tracking of all field teams with live status indicators (Available, Busy, Offline).
- **Smart Auto-Assign**: Intelligent algorithm that matches ticket categories to specific departments and available teams with the lowest current workload.
- **Priority Scoring**: AI-driven priority assessment for all incoming complaints to ensure critical issues (Roads, Sanitation, Water) are addressed first.

### 🛡️ Role-Based Access Control (RBAC)
- **Super Admin**: Full oversight of all departments, portal users, and field teams. Capability to manage system-wide settings and audit logs.
- **Department HQ**: Dedicated portals for 6 key departments:
  - Roads & Infrastructure
  - Sanitation
  - Electrical
  - Parks & Gardens
  - Water Supply
  - Drainage
- **Team Management**: Portals allow Department HQs to manage their own team rosters, members, and shift capacities.

### 🤖 AI Integration
- **Gemini-Powered Assessment**: Automatic categorization and severity evaluation of citizen complaints.
- **Automated Summarization**: Concise AI-generated summaries for every reported issue to speed up response times.

## 🛠️ Technology Stack
- **Frontend**: Next.js 16 (App Router), React, TailwindCSS, Lucide Icons.
- **State Management**: React Context API & Hooks.
- **Backend/Database**: Firebase Firestore, Firebase Authentication.
- **Map Services**: Leaflet.js with OpenStreetMap.
- **AI**: Google Gemini Pro.

## 📋 Role Architecture (Latest Update)
The system has been modernized to remove legacy intermediary roles, focusing on a direct Command-to-Execution pipeline:
- **Command**: Super Admin / Department HQ
- **Execution**: Field Teams (Managed by HQ)

## 🔧 Installation & Setup

1. **Clone the Project**:
   ```bash
   git clone -b aeztrix https://github.com/SHIN-1O1/Civic-intel-OS.git
   cd Civic-intel-OS
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env.local` file in the root directory:
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=your_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_domain
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_bucket
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   GEMINI_API_KEY=your_gemini_key
   ```

4. **Run Development Server**:
   ```bash
   npm run dev
   ```

5. **Firestore Rules**:
   Deploy the provided `firestore.rules` for proper security and ticket assignment permissions.

## 📈 Recent Enhancements
- **Cleaned up legacy roles** (`ward_officer`, `dispatcher`).
- **Fixed Ticket Assignment permissions** allowing portal users to manage citizen complaints.
- **Implemented Team Member management** capability for Department HQ.
- **Resolved state serialization issues** in Firestore team creation.

---
*Built for the future of urban governance.*
