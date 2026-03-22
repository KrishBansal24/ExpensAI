# ExpensAI Admin Dashboard

Production-oriented admin and manager console for controlling employee wallet budgets, reviewing UPI transactions, and monitoring expense behavior in real time with Firebase.

## Features

- Firebase authentication with Email/Password and Google login
- Role-based route protection with admin-first access
- Real-time employee management from users collection
- Wallet allocation and top-up actions synced instantly to mobile app
- Real-time transaction monitoring with advanced filters
- Approve and reject workflow with automatic wallet refund on rejection
- GPS location visibility with direct map links
- Analytics for category spend, employee spend, and monthly trends
- CSV export of filtered transactions
- Toast notifications, loading states, and clear error handling
- Responsive layout with light and dark mode

## Folder Structure

```text
src/
  components/
    MetricCard.jsx
    ProtectedRoute.jsx
    Sidebar.jsx
    TopNav.jsx
  context/
    AdminDataContext.jsx
    AuthContext.jsx
    ThemeContext.jsx
  pages/
    Analytics.jsx
    Dashboard.jsx
    Employees.jsx
    Login.jsx
    Transactions.jsx
  utils/
    index.js
    smartFeatures.js
  App.jsx
  firebase.js
  index.css
  main.jsx
```

## Firebase Data Model

### users

Expected fields per employee/admin profile:

- uid
- name
- email
- role: employee | manager | admin
- walletAssigned
- walletBalance
- walletSpent
- period
- active
- updatedAt

### transactions

Expected fields:

- userId
- userName
- amount
- category
- paymentMode (UPI)
- status: pending | approved | rejected
- timestamp
- location: { lat, lng }
- reviewedBy
- reviewedAt

## Data Flow

1. Admin allocates budget in Employees page.
2. users document updates walletAssigned and walletBalance.
3. Mobile app listens to users/{uid} and reflects new wallet values instantly.
4. Employee submits UPI transaction from mobile.
5. transaction document is created in transactions collection and appears in admin Transactions page via onSnapshot.
6. Admin approves or rejects transaction.
7. Transaction status updates in Firestore and reflects in mobile transaction list instantly.
8. If rejected, wallet balance is refunded automatically in the same Firestore transaction.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Configure environment variables in .env:

```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...

# Optional: comma-separated allowlist for first-time admin bootstrap
VITE_ADMIN_EMAILS=admin@company.com,finance.lead@company.com

# Optional: if true, manager role is allowed in admin routes
VITE_ALLOW_MANAGER_ROLE=false
```

3. Run development server:

```bash
npm run dev
```

4. Quality check:

```bash
npm run lint
```

## Firestore Rules

Use the repository file at ../firebase/firestore.rules and deploy it:

```bash
firebase deploy --only firestore:rules
```

## Practical Notes

- Add a users profile document for each authenticated employee uid.
- Admin panel does not create Firebase Auth users; it manages Firestore profile and wallet records.
- For Google login to work, enable Google provider in Firebase Authentication.
- For production, add Cloud Functions for strict policy checks and audit logging.
