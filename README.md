<div align="center">
  <h1>Civic Intelligence OS</h1>
  <h3>The Future of Urban Governance & Citizen Engagement</h3>
  
  <p>
    <img src="https://img.shields.io/badge/Next.js-16.1-black?style=for-the-badge&logo=next.js" alt="Next.js" />
    <img src="https://img.shields.io/badge/Firebase-Auth%20%26%20Firestore-flame?style=for-the-badge&logo=firebase" alt="Firebase" />
    <img src="https://img.shields.io/badge/Google_Gemini-Pro-4285F4?style=for-the-badge&logo=google-bard" alt="Gemini AI" />
    <img src="https://img.shields.io/badge/Leaflet-Maps-green?style=for-the-badge&logo=leaflet" alt="Leaflet" />
    <img src="https://img.shields.io/badge/Tailwind_CSS-4.0-38B2AC?style=for-the-badge&logo=tailwind-css" alt="Tailwind CSS" />
  </p>

  <p>
    <strong>Civic Intelligence OS</strong> is a comprehensive ecosystem connecting citizens directly to city administration.
    It combines a citizen-facing <strong>Grievance Portal</strong> for smart complaint filing with a government-grade <strong>Administrative Dashboard</strong> for real-time dispatch and management.
  </p>
</div>

<hr />

## 🌍 The Ecosystem

The platform consists of two powerful, interconnected applications working in sync:

<table>
  <tr>
    <td width="50%" valign="top">
      <h3 align="center">📱 Civic Connect (Citizen Portal)</h3>
      <p align="center"><em>"Empowering citizens to report instantly."</em></p>
      <ul>
        <li><strong>Smart Chatbot Filing</strong>: AI-guided interface that interviews citizens to capture precise complaint details.</li>
        <li><strong>Interactive Map Picker</strong>: Pinpoint exact locations using OpenStreetMap & Leaflet integration.</li>
        <li><strong>Real-Time Updates</strong>: Track status changes from "Pending" to "Resolved" instantly.</li>
        <li><strong>Profile Management</strong>: Store citizen details for one-click reporting.</li>
      </ul>
    </td>
    <td width="50%" valign="top">
      <h3 align="center">🏛️ Civic Intel OS (Admin HQ)</h3>
      <p align="center"><em>"Streamlining city operations & dispatch."</em></p>
      <ul>
        <li><strong>Unified Command Center</strong>: Live dispatch map tracking field teams.</li>
        <li><strong>Smart Auto-Assign</strong>: Algorithms match tickets to the nearest available team.</li>
        <li><strong>Priority Scoring</strong>: AI assessment of severity (e.g., Live Wire = Critical).</li>
        <li><strong>Role-Based Access</strong>: Dedicated portals for Roads, Sanitation, Police, etc.</li>
      </ul>
    </td>
  </tr>
</table>

---

## ⚡ Powered by Google Cloud & AI

Our infrastructure leverages the full power of the Google Cloud ecosystem for security, scale, and intelligence.

### 🤖 Google Gemini AI Integration
We utilize **Gemini Pro & Flash-Lite** to power the intelligence across both apps:

*   **Citizen Side:**
    *   **Validity Check:** Filters out spam or vague complaints (e.g., "fix road" -> "Please specify location").
    *   **Sentiment & Severity:** Analyzes text/images to estimate urgency before it even reaches a human.
    *   **Smart Summarizer:** Compresses long descriptions into concise headers.

*   **Admin Side:**
    *   **Intelligent Triage:** Auto-categorizes incoming reports to the correct department.
    *   **Workforce Dispatch:** Suggests optimal team allocation based on skill and proximity.

### 🔥 Firebase Ecosystem
*   **Authentication:** Secure Identity Platform for Citizens (Email/Phone) and Officials (RBAC).
*   **Firestore (NoSQL):** Real-time database syncing data between the Citizen App and Admin Dashboard instantaneously.

---

## 🛠️ Complete Technology Stack

| Feature | Citizen Portal (Frontend) | Admin Dashboard (Intel OS) | Backend & Infrastructure |
|:---|:---|:---|:---|
| **Framework** | Vanilla JS / HTML5 | Next.js 16 (App Router) | Firebase Admin SDK |
| **Styling** | Custom CSS3 | Tailwind CSS 4 | - |
| **Maps** | Leaflet.js / OSM | Leaflet React | Google Maps Platform (Optional) |
| **AI Engine** | Gemini 2.5 Flash-Lite | Gemini 1.5 Pro | Vertex AI |
| **Database** | Firebase Firestore | Firebase Firestore | Firestore Triggers |

---

## 📋 Architecture

```mermaid
graph LR
    User[Citizen] -->|Files Complaint via Chat| Client[Utterance/Image]
    Client -->|Verifies Validity| Gemini[Gemini AI]
    Gemini -->|Returns Summary & Severity| Client
    Client -->|Saves Ticket| DB[(Firebase Firestore)]
    
    DB -->|Real-time Sync| Admin[Admin Dashboard]
    Admin -->|Auto-Assigns| Team[Field Team]
    Team -->|Updates Status| DB
    DB -->|Push Notification| User
