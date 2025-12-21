# TradeFlow Extension: Backend & Payment Implementation Guide

This document outlines the complete architectural approach for migrating **TradeFlow** from a Local-Only extension to a Cloud-Synced application with Razorpay Subscriptions.

**Target Stack:**
- **Frontend**: WXT (React + Jotai)
- **Backend**: Firebase Cloud Functions (Node.js)
- **Database**: Cloud Firestore
- **Payments**: Razorpay (Subscriptions)

---

## 1. Database Schema (Firestore)

We use a user-centric schema. Since Firestore is a document-store, we use **Sub-collections** to manage scaling.

### A. Users Collection (`users/{userId}`)
Stores global user profile and subscription state.

```json
// path: /users/uid_123456789
{
  "uid": "uid_123456789",
  "email": "trader@example.com",
  "displayName": "Rahul Kumar",
  "photoURL": "https://lh3.googleusercontent.com/...",
  "createdAt": "2025-12-15T10:00:00Z",
  "lastLoginAt": "2025-12-16T09:30:00Z",

  // 🔐 Subscription State (Critical for UI gating)
  "isPremium": true, 
  "subscription": {
    "status": "active",          // 'active' | 'created' | 'past_due' | 'halted'
    "planId": "plan_NZ12345abc", // Razorpay Plan ID
    "subId": "sub_Kz98765xyz",   // Razorpay Subscription ID
    "currentPeriodEnd": "2026-01-15T10:00:00Z"
  }
}
```

### B. Lists Sub-Collection (`users/{userId}/lists/{listId}`)
Stores the actual symbol lists. Kept separate from the User doc to avoid the 1MB limit.

```json
// path: /users/uid_123456789/lists/list_abc123
{
  "id": "list_abc123",
  "name": "Breakout Stocks",
  "color": "#FF5733",
  "isFavorite": true,
  "isPredefined": false,
  
  // 🕒 Sync Metadata (Important for Conflict Resolution)
  "createdAt": "2025-12-15T10:05:00Z",
  "updatedAt": "2025-12-15T15:30:00Z",

  "symbols": [
    {
      "symbol": "RELIANCE",
      "exchange": "NSE",
      "fullSymbol": "NSE:RELIANCE",
      "addedAt": "2025-12-15T10:05:00Z",
      "notes": "Monitor for 2500 breakout"
    }
  ]
}
```

---

## 2. Subscription Flow Architecture (Razorpay)

Since Chrome Extensions (Manifest V3) cannot easily run external scripts (CSP issues), we use a **Redirect Flow** via a secure "Payment Tab".

### Step 1: Create Plan (One Time)
Go to **Razorpay Dashboard** -> **Subscriptions** -> **Plans** and create a plan.
- **Name**: TradeFlow Pro Monthly
- **Amount**: ₹299
- **Billing Frequency**: Monthly
- Keep note of the **Plan ID** (e.g., `plan_NZ12345abc`).

### Step 2: The Upgrade Trigger (Extension)
In your `UpgradeComponent.tsx`:
1. User clicks "Upgrade Now".
2. Extension captures `userId` from Auth state.
3. Extension calls Firebase Cloud Function `createSubscriptionLink`.

### Step 3: Backend Logic (Cloud Function)
This functions acts as the secure bridge. It uses your **Razorpay Key Secret** (which must NEVER be in the frontend code).

```typescript
// functions/src/index.ts (Conceptual Code)

import * as functions from 'firebase-functions';
import Razorpay from 'razorpay';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

export const createSubscriptionLink = functions.https.onCall(async (data, context) => {
  // 1. Security Check
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'User must be logged in');

  const userId = context.auth.uid;

  // 2. Create Subscription in Razorpay
  const subscription = await razorpay.subscriptions.create({
    plan_id: 'plan_NZ12345abc', // Your Plan ID
    total_count: 120,           // 10 Years (roughly infinite)
    customer_notify: 1, 
    notes: {
      userId: userId,           // 🔑 CRITICAL: This links the payment to your Firebase User
      app: 'TradeFlow Extension'
    }
  });

  // 3. Return the Short URL
  return { 
    paymentUrl: subscription.short_url, 
    subId: subscription.id 
  };
});
```

### Step 4: User Payment
1. Extension receives `paymentUrl`.
2. Extension calls `chrome.tabs.create({ url: paymentUrl })`.
3. User completes payment on the Razorpay hosted page.

### Step 5: Webhook fulfillment (The Lock Key)
Razorpay notifies your server when the payment is actually successful.

**Razorpay Webhook Event**: `subscription.charged`

```typescript
// functions/src/webhook.ts

export const razorpayWebhook = functions.https.onRequest(async (req, res) => {
  // 1. Verify Signature (Security)
  // ... crypto.createHmac ... verify x-razorpay-signature header ...

  const event = req.body;
  
  if (event.event === 'subscription.charged') {
    const payload = event.payload.subscription.entity;
    const userId = payload.notes.userId; // Retrieved from the notes we sent earlier

    // 2. Update Firestore
    await admin.firestore().collection('users').doc(userId).update({
      isPremium: true,
      subscription: {
        status: 'active',
        subId: payload.id,
        currentPeriodEnd: calculateNextDate(payload.current_end)
      }
    });
    
    console.log(`✅ Activated Premium for ${userId}`);
  }

  res.json({ status: 'ok' });
});
```

### Step 6: Instant Sync (Extension)
Because your extension is using the `useFirestoreSync` hook (from Phase 1), it is listening to the `users/{userId}` document.
1. Webhook updates `isPremium: true`.
2. Firestore pushes update to Extension in real-time.
3. Extension UI automatically unlocks "Pro" features.

---

## 3. Implementation Plan Checklist

### Phase 1: Authentication & Sync (Ready)
- [x] Auth Implementation (Google Sign In)
- [ ] Deploy Sync Hook (`atoms/sync.ts`)
- [ ] Update `ListManager` to use Sync Hook

### Phase 2: Backend Setup
- [ ] Initialize Firebase Functions (`firebase init functions`)
- [ ] Set environment variables (`firebase functions:config:set razorpay.key_id="..."`)
- [ ] Deploy `createSubscriptionLink` function

### Phase 3: Payment UI
- [ ] Add "Upgrade to Pro" button in Extension Header
- [ ] Implement `handleUpgrade` function to call Cloud Function
- [ ] Setup Razorpay Webhook in Dashboard to point to your deployed function URL

---

## 4. Security Rules (firestore.rules)
Ensure users can only read/write their own data.

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // User Profiles
    match /users/{userId} {
      // Users can read/write their own profile
      allow read, write: if request.auth != null && request.auth.uid == userId;
      
      // PREVENT users from setting their own 'isPremium' flag
      // (Only the backend Admin SDK can write to restricted fields like isPremium)
      // This requires a more complex rule or separating subscription data to a private sub-collection.
      // For MVP, user write access is usually acceptable if you validate strictly, 
      // but ideally, subscription status should be read-only for the client.
    }

    // Symbol Lists
    match /users/{userId}/lists/{listId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```
