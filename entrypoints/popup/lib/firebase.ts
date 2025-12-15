import { initializeApp, getApps, getApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'

/**
 * Firebase client singleton for the extension popup/content contexts.
 * Uses WXT/Vite env variables (must be prefixed with WXT_ to be exposed).
 */
const firebaseConfig = {
  apiKey: import.meta.env.WXT_FIREBASE_API_KEY,
  authDomain: import.meta.env.WXT_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.WXT_FIREBASE_PROJECT_ID,
  appId: import.meta.env.WXT_FIREBASE_APP_ID,
  messagingSenderId: import.meta.env.WXT_FIREBASE_MESSAGING_SENDER_ID,
  storageBucket: import.meta.env.WXT_FIREBASE_STORAGE_BUCKET,
}

function assertConfig() {
  console.log('firebaseConfig', firebaseConfig)
  const missing = Object.entries(firebaseConfig)
    .filter(([, value]) => !value)
    .map(([key]) => key)

  if (missing.length) {
    throw new Error(`Missing Firebase env vars: ${missing.join(', ')}`)
  }
}

export function getFirebaseApp() {
  assertConfig()
  return getApps().length ? getApp() : initializeApp(firebaseConfig)
}

export function getFirebaseAuth() {
  const app = getFirebaseApp()
  return getAuth(app)
}

export const googleProvider = new GoogleAuthProvider()

