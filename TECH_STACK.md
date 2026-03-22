# Technical Architecture & Stack

## System Overview

ExpensAI is built as a highly decoupled full-stack system using Firebase as a central Backend-as-a-Service (BaaS).

```mermaid
graph TD
    A[Mobile App - React Native] <-->|Auth, Read/Write| D[(Firebase Firestore & Auth)]
    B[Admin Web - React.js] <-->|Auth, Read/Write| D
    C[Web Demo - React.js] <-->|Auth, Read/Write| D
    
    A -->|Upload Receipts| E[Firebase Storage]
    C -->|Upload Receipts| E
```

## Tech Stack Choices & Rationale

### 1. Frontend Frameworks
- **React Native (Expo)**: Chosen for the mobile app to ensure a purely native feel on both iOS and Android while utilizing a single JavaScript codebase. Expo accelerates development by removing the need for Android Studio/Xcode configuration.
- **React.js (Vite)**: Chosen for the Admin Dashboard and Web Demo. Vite provides instantaneous hot-module replacement (HMR) during development. React allows us to share business logic, custom hooks, and utility functions easily across the mobile and web codebases.

### 2. Backend (Firebase)
Firebase was selected as the backend over a traditional Node.js/Express + PostgreSQL stack for several critical reasons:
- **Real-time Sync**: Firestore provides out-of-the-box WebSocket connections. When a manager approves an expense on the web dashboard, the mobile app UI updates instantly without requiring a refresh or long-polling.
- **Integrated Auth**: Firebase Authentication handles complex OAuth flows (Google Sign-In) natively on both mobile and web seamlessly.
- **Developer Velocity**: Removes the need to write CRUD boilerplate APIs, allowing focus on UI/UX for an ideathon.

### 3. State Management
- **Context API + Custom Hooks**: Used for global state (User session, Theme preference). 
- *Why not Redux?* Firestore handles real-time data caching client-side automatically. Using Redux would duplicate data unnecessarily. Context is sufficient for UI state.

### 4. Styling
- **Web**: Vanilla CSS with CSS Custom Properties (`var(--color)`) for highly performant and easy theme switching (Dark Mode).
- **Mobile**: `StyleSheet` API with a centralized Theme constant file for dark/light mode integration.

## Data Flow & Structure

### Firestore Schema

**`users` collection**
```json
{
  "id": "abc123xyz",
  "name": "Jyoti Sharma",
  "email": "jyoti@acmecorp.com",
  "role": "employee", 
  "department": "Engineering"
}
```

**`expenses` collection**
```json
{
  "id": "exp_789xyz",
  "userId": "abc123xyz",
  "userName": "Jyoti Sharma",
  "amount": 850,
  "vendor": "Starbucks",
  "category": "food",
  "date": "2026-03-22",
  "status": "pending", 
  "receiptUrl": "https://firebasestorage...",
  "createdAt": "Timestamp"
}
```

## Scalability
- **Database**: Firestore scales horizontally automatically. It relies on indexes for queries, meaning querying 10 expenses takes the same time as querying 10 million expenses.
- **Hosting**: Vercel/Netlify provides global CDN distribution for the web apps.
- **Storage**: Firebase Storage uses Google Cloud Storage infrastructure.
