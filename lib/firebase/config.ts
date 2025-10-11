import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { Platform } from 'react-native';

// TODO: Replace with your Firebase config
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase app
const app = initializeApp(firebaseConfig);

// Platform-specific Firebase initialization
let auth: any;
let db: any;
let storage: any;

if (Platform.OS === 'web') {
  // Web Firebase SDK
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
} else {
  // React Native Firebase for iOS/Android
  try {
    const rnAuth = require('@react-native-firebase/auth').default;
    const rnFirestore = require('@react-native-firebase/firestore').default;
    const rnStorage = require('@react-native-firebase/storage').default;
    
    auth = rnAuth();
    db = rnFirestore();
    storage = rnStorage();
  } catch (error) {
    console.warn('React Native Firebase not available, falling back to web SDK');
    // Fallback to web SDK if RN Firebase is not available
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
  }
}

export { auth, db, storage };
