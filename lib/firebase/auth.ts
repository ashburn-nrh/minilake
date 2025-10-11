import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult,
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { Platform } from 'react-native';
import { auth, db } from './config';

export const sendOTP = async (
  phoneNumber: string,
  recaptchaVerifier?: RecaptchaVerifier
): Promise<ConfirmationResult> => {
  try {
    if (Platform.OS === 'web') {
      // Web platform - requires reCAPTCHA
      if (!recaptchaVerifier) {
        throw new Error('RecaptchaVerifier is required for web platform');
      }
      
      const confirmationResult = await signInWithPhoneNumber(
        auth,
        phoneNumber,
        recaptchaVerifier as any
      );
      return confirmationResult;
    } else {
      // Mobile platform - React Native Firebase
      try {
        // For React Native Firebase, signInWithPhoneNumber works differently
        const confirmationResult = await auth.signInWithPhoneNumber(phoneNumber);
        return confirmationResult;
      } catch (rnError: any) {
        console.error('React Native Firebase error:', rnError);
        // Fallback to web SDK if RN Firebase fails
        if (!recaptchaVerifier) {
          throw new Error('Phone authentication failed on mobile platform');
        }
        const confirmationResult = await signInWithPhoneNumber(
          auth,
          phoneNumber,
          recaptchaVerifier as any
        );
        return confirmationResult;
      }
    }
  } catch (error) {
    console.error('Error sending OTP:', error);
    throw error;
  }
};

export const verifyOTP = async (
  confirmationResult: ConfirmationResult,
  code: string
) => {
  try {
    const result = await confirmationResult.confirm(code);
    const user = result.user;

    // Create or update user document in Firestore
    const userRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      await setDoc(userRef, {
        uid: user.uid,
        phoneNumber: user.phoneNumber,
        displayName: null,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
      });
    } else {
      await setDoc(
        userRef,
        {
          lastLogin: new Date().toISOString(),
        },
        { merge: true }
      );
    }

    return user;
  } catch (error) {
    console.error('Error verifying OTP:', error);
    throw error;
  }
};
