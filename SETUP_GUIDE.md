# ExpensAI Configuration & Deployment Guide

This guide walks through setting up the Firebase backend, running the two apps locally, and deploying the system.

## 1. Firebase Setup (Backend)

ExpensAI uses Firebase for Authentication, Database (Firestore), and Storage.

### Create Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **Add Project** and name it "ExpensAI"
3. Disable Google Analytics (optional) and click **Create Project**
4. Once created, click the Web icon (`</>`) to add a web app
5. Register the app (name: "ExpensAI Web") and copy the `firebaseConfig` object

### Enable Authentication
1. Go to **Build > Authentication** in the left sidebar
2. Click **Get Started**
3. Select **Google** under Additional Providers
4. Enable it, provide a support email, and click **Save**

### Setup Firestore Database
1. Go to **Build > Firestore Database**
2. Click **Create database**
3. Start in **Test mode** (for development) and select a location
4. *Important:* Update the security rules later using the file in `/firebase/firestore.rules`

### Setup Storage
1. Go to **Build > Storage**
2. Click **Get Started**, start in **Test mode**, and select a location
3. *Important:* Update the security rules later using the file in `/firebase/storage.rules`

---

## 2. Configuration

You must add your Firebase config to the admin dashboard.

1. Create a `.env` file in `/admin-dashboard`:
```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

2. Create a `.env` file in `/mobile-app`:
```env
EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id
```

---

## 3. How to Run Locally

### Mobile App (Employee)
```bash
cd mobile-app
npm install
npx expo start
```
- Download "Expo Go" on your iOS/Android device
- Scan the QR code shown in the terminal

### Admin Dashboard (Manager)
```bash
cd admin-dashboard
npm install
npm run dev
```
- Open `http://localhost:5173` in your browser

## 4. Deployment

### Deploy Admin Dashboard (Vercel)
1. Push your code to GitHub
2. Go to [Vercel](https://vercel.com/) and click **Add New > Project**
3. Import your repository
4. Set the **Root Directory** to `admin-dashboard`
5. Expand **Environment Variables** and add all your `VITE_FIREBASE_*` variables
6. Click **Deploy**

### Build Mobile App (APK for Android)
To build a standalone APK without writing native code:
```bash
cd mobile-app
npm install -g eas-cli
eas login
eas build -p android --profile preview
```
