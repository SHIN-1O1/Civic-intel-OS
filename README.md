<div align="center">
  <h1>Civic Intelligence OS</h1>
  <h3>The Future of Urban Governance & City Management</h3>
  
  <p>
    <img src="https://img.shields.io/badge/Next.js-16.1-black?style=for-the-badge&logo=next.js" alt="Next.js" />
    <img src="https://img.shields.io/badge/Firebase-Auth%20%26%20Firestore-flame?style=for-the-badge&logo=firebase" alt="Firebase" />
    <img src="https://img.shields.io/badge/Google_Gemini-Pro-4285F4?style=for-the-badge&logo=google-bard" alt="Gemini AI" />
    <img src="https://img.shields.io/badge/Tailwind_CSS-4.0-38B2AC?style=for-the-badge&logo=tailwind-css" alt="Tailwind CSS" />
  </p>

  <p>
    <strong>Civic-intel-OS</strong> is a government-grade administrative dashboard designed to streamline city operations. 
    It leverages the power of the <strong>Google Cloud Ecosystem</strong> to deliver real-time automated assessment, intelligent workforce dispatching, and secure multi-departmental coordination.
  </p>
</div>

<hr />

## 🚀 Key Features

<table>
  <tr>
    <td width="50%">
      <h3 align="center">🏛️ Unified Command Center</h3>
      <ul>
        <li><strong>Dynamic Dispatch Map</strong>: Real-time tracking of field teams with live status (Available, Busy, Offline).</li>
        <li><strong>Smart Auto-Assign</strong>: Algorithm matching tickets to departments and teams with the lowest workload.</li>
        <li><strong>Priority Scoring</strong>: AI-driven assessment ensuring critical issues (Roads, Water) are addressed first.</li>
      </ul>
    </td>
    <td width="50%">
      <h3 align="center">🛡️ Role-Based Access (RBAC)</h3>
      <ul>
        <li><strong>Super Admin</strong>: Global oversight, system settings, and audit logs.</li>
        <li><strong>Department HQ</strong>: Dedicated portals for 6 key departments (Roads, Sanitation, Electrical, etc.).</li>
        <li><strong>Team Management</strong>: HQ-managed rosters and shift capacities.</li>
      </ul>
    </td>
  </tr>
</table>

## ⚡ Powered by Google Cloud & AI

This platform is built on a robust foundation of Google technologies to ensure scalability, security, and intelligence.

###  Firebase Ecosystem
The backbone of our secure, real-time infrastructure.

| Service | Usage & Implementation |
|:---|:---|
| **Firebase Authentication** | **Identity Platform**: Handles secure login for Admins, HQs, and Field Teams. <br> **Custom Claims**: Usage of custom claims to strictly enforce our RBAC (Role-Based Access Control) system, distinguishing between `super_admin` and `department_hq`. |
| **Cloud Firestore** | **NoSQL Database**: Stores tickets, user profiles, and audit logs with millisecond latency. <br> **Real-time Listeners**: Powers the "Live Dispatch Map" and dashboard counters, pushing updates instantly to all connected clients without page reloads. <br> **Security Rules**: Complex `firestore.rules` ensure that Department HQs only access data relevant to their specific jurisdiction. |

### 🤖 Google Gemini AI Integration
We utilize **Gemini Pro** via the Generative AI SDK to transform raw citizen reports into actionable data.

-   **Intelligent Triage**: Gemini analyzes incoming complaint text and images to automatically determine the correct **Department** (e.g., assigning a "broken pipe" to Water Supply).
-   **Severity Assessment**: The AI evaluates the urgency of a report on a scale of 1-10, flagging high-risk issues (like "live wire detected") for immediate attention.
-   **Smart Summarization**: Converts lengthy, unstructured citizen complaints into concise, one-line summaries for quick dispatcher review.

---

## 🛠️ Complete Technology Stack

| Feature | Tech Choices |
|:---|:---|
| **Frontend** | `Next.js 16 (App Router)` • `React 19` • `TailwindCSS 4` • `Lucide Icons` |
| **State** | `React Context API` • `Hooks` |
| **Backend** | `Firebase Firestore` (NoSQL) • `Firebase Authentication` • `Firebase Admin SDK` |
| **Maps** | `Leaflet.js` • `OpenStreetMap` |
| **AI Engine** | `Google Gemini Pro` (@google/generative-ai) |

## 📋 Architecture

The system uses a direct **Command-to-Execution** pipeline, removing legacy intermediaries for efficiency.

```mermaid
graph LR
    A[Super Admin / Dept HQ] -->|Dispatches Ticket (Firestore)| B[Field Team]
    B -->|Updates Status (Real-time)| A
    C[Citizen] -->|Reports Issue| D[Gemini AI Processor]
    D -->|Categorizes & Assigns| A
```

## 🔧 Installation & Setup

1.  **Clone the Repository**
    ```bash
    git clone -b aeztrix https://github.com/SHIN-1O1/Civic-intel-OS.git
    cd Civic-intel-OS
    ```

2.  **Install Dependencies**
    ```bash
    npm install
    ```

3.  **Environment Configuration**
    Create a `.env.local` file with your **Firebase** and **Gemini** credentials:
    ```env
    # Firebase Client SDK
    NEXT_PUBLIC_FIREBASE_API_KEY=your_key
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_domain
    NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_id
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_bucket
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
    NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

    # Firebase Admin SDK (Server-Side)
    FIREBASE_PROJECT_ID=your_project_id
    FIREBASE_CLIENT_EMAIL=your_client_email
    FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."

    # Google AI
    GEMINI_API_KEY=your_gemini_key
    ```

4.  **Launch**
    ```bash
    npm run dev
    ```

---

<div align="center">
  <p>Built for the next generation of smart cities.</p>
</div>
