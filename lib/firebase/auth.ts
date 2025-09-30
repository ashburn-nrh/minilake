import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult,
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from './config';

export const sendOTP = async (
  phoneNumber: string,
  recaptchaVerifier?: RecaptchaVerifier
): Promise<ConfirmationResult> => {
  try {
    // For web, recaptchaVerifier is required
    // For mobile (iOS/Android), Firebase handles verification automatically
    if (!recaptchaVerifier && typeof window !== 'undefined' && window.document) {
      throw new Error('RecaptchaVerifier is required for web platform');
    }

    const confirmationResult = await signInWithPhoneNumber(
      auth,
      phoneNumber,
      recaptchaVerifier as any
    );
    return confirmationResult;
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
