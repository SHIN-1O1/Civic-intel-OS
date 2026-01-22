# Portal Setup Guide

This guide explains how to set up and manage portal users in Civic-intel-OS.

## Overview

Civic-intel-OS supports two types of portal access:

1. **Super Admin** - Full access to all features (Dashboard, Tickets, Dispatch, Workforce, Analytics, Audit Logs, Admin)
2. **Department HQ** - Limited access to department-specific views only

## Setting Up Portal Users in Firebase

### Step 1: Create Firebase Auth Users

First, create users in Firebase Authentication:

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Navigate to **Authentication** → **Users**
4. Click **Add user** and create accounts with email/password

### Step 2: Create Portal User Documents

In Firestore, create documents in the `portalUsers` collection:

```
Firestore → portalUsers → [document-id = Firebase Auth UID]
```

#### Super Admin Example
```json
{
  "id": "<firebase-auth-uid>",
  "name": "Super Administrator",
  "role": "super_admin"
}
```

#### Department HQ Examples
```json
{
  "id": "<firebase-auth-uid>",
  "name": "Roads & Infrastructure HQ",
  "role": "department_hq",
  "department": "roads_infrastructure"
}
```

### Available Departments

| Department Key | Display Name |
|---------------|--------------|
| `roads_infrastructure` | Roads & Infrastructure |
| `sanitation` | Sanitation |
| `electrical` | Electrical |
| `parks_gardens` | Parks & Gardens |
| `water_supply` | Water Supply |
| `drainage` | Drainage |

### Complete Setup Script

Run this in your app or Firebase Cloud Functions to seed all portal users:

```typescript
import { doc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const portalUsers = [
  { id: '<super-admin-uid>', name: 'Super Administrator', role: 'super_admin' },
  { id: '<roads-uid>', name: 'Roads & Infrastructure HQ', role: 'department_hq', department: 'roads_infrastructure' },
  { id: '<sanitation-uid>', name: 'Sanitation HQ', role: 'department_hq', department: 'sanitation' },
  { id: '<electrical-uid>', name: 'Electrical HQ', role: 'department_hq', department: 'electrical' },
  { id: '<parks-uid>', name: 'Parks & Gardens HQ', role: 'department_hq', department: 'parks_gardens' },
  { id: '<water-uid>', name: 'Water Supply HQ', role: 'department_hq', department: 'water_supply' },
  { id: '<drainage-uid>', name: 'Drainage HQ', role: 'department_hq', department: 'drainage' },
];

async function seedPortalUsers() {
  for (const user of portalUsers) {
    await setDoc(doc(db, 'portalUsers', user.id), user);
    console.log(`Created: ${user.name}`);
  }
}
```

> **Note**: Replace `<...-uid>` with actual Firebase Auth UIDs

## User Experience

### Super Admin
- Logs in at `/portal-select` or `/login`
- Redirected to main Dashboard (`/`)
- Full sidebar with all navigation items
- Can dispatch tickets to any department

### Department HQ
- Logs in at `/portal-select`
- Redirected to Department Dashboard (`/department/{dept}`)
- Limited sidebar: Department Dashboard, Department Tickets, Teams
- Only sees tickets/teams assigned to their department
- Receives notifications for new ticket assignments

## Notifications

Department HQ users receive real-time notifications when:
- New tickets are assigned to their department
- SLA breaches occur on their tickets
- Tickets are escalated

Notifications appear in the bell icon in the header.
