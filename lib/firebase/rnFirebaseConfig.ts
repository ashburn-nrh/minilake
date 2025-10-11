// React Native Firebase configuration
// This file is used when the app runs on iOS/Android

export const rnFirebaseConfig = {
  // These values should match your Firebase project
  // They will be automatically configured when you add
  // google-services.json (Android) and GoogleService-Info.plist (iOS)
  
  // For development, you can use the same project as web
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  
  // Note: React Native Firebase gets most config from native files
  // google-services.json (Android) and GoogleService-Info.plist (iOS)
};

export default rnFirebaseConfig;
