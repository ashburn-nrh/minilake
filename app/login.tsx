import { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { RecaptchaVerifier, ConfirmationResult } from 'firebase/auth';
import { sendOTP, verifyOTP } from '../lib/firebase/auth';
import { auth } from '../lib/firebase/config';
import {
  registerForPushNotificationsAsync,
  savePushToken,
} from '../setup/notifications';
import { showAlert, showMessage } from '../lib/utils/alert';

type LoginForm = {
  phoneNumber: string;
  otp: string;
};

export default function LoginScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const recaptchaVerifier = useRef<RecaptchaVerifier | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<LoginForm>({
    defaultValues: {
      phoneNumber: '',
      otp: '',
    },
  });

  useEffect(() => {
    // Initialize reCAPTCHA verifier (for web)
    if (Platform.OS === 'web' && !recaptchaVerifier.current) {
      recaptchaVerifier.current = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
      });
    }
  }, []);

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const onSendOTP = async (data: LoginForm) => {
    if (cooldown > 0) return;

    // Check if running on native mobile (iOS/Android)
    if (Platform.OS !== 'web') {
      showMessage(
        'Mobile Not Supported Yet',
        'Phone authentication on iOS/Android requires @react-native-firebase packages. Please test on web browser for now.\n\nPress "w" in the terminal to open in web browser.'
      );
      return;
    }

    setLoading(true);
    try {
      // Format phone number (remove spaces, dashes, parentheses)
      let formattedPhone = data.phoneNumber.trim().replace(/[\s\-\(\)]/g, '');
      
      // Add country code if not present
      if (!formattedPhone.startsWith('+')) {
        formattedPhone = '+1' + formattedPhone; // Default to US (+1)
      }

      // Validate format
      if (formattedPhone.length < 12) {
        showMessage('Invalid Phone', 'Please enter a valid phone number with country code (e.g., +1 5551234567)');
        setLoading(false);
        return;
      }

      // For web, use RecaptchaVerifier
      const verifier = recaptchaVerifier.current || new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
      });

      const result = await sendOTP(formattedPhone, verifier);
      setConfirmationResult(result);
      setOtpSent(true);
      setCooldown(60);
      showMessage('Success', `OTP sent to ${formattedPhone}`);
    } catch (error: any) {
      console.error(error);
      let errorMessage = 'Failed to send OTP';
      
      if (error.code === 'auth/invalid-phone-number') {
        errorMessage = 'Invalid phone number format. Use: +1 5551234567';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many attempts. Please try again later.';
      } else if (error.code === 'auth/missing-app-credential') {
        errorMessage = 'Phone authentication is not properly configured. Please check Firebase Console.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      showMessage('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const onVerifyOTP = async (data: LoginForm) => {
    if (!confirmationResult) {
      showMessage('Error', 'Please request OTP first');
      return;
    }

    setLoading(true);
    try {
      const user = await verifyOTP(confirmationResult, data.otp);
      
      // Register for push notifications
      try {
        const pushToken = await registerForPushNotificationsAsync();
        if (pushToken && user.uid) {
          await savePushToken(user.uid, pushToken);
        }
      } catch (notifError) {
        console.log('Push notification registration failed:', notifError);
        // Don't block login if notifications fail
      }
      
      router.replace('/customers');
    } catch (error: any) {
      console.error(error);
      showMessage('Error', error.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const onResendOTP = () => {
    if (cooldown === 0) {
      handleSubmit(onSendOTP)();
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-gradient-to-br from-blue-50 to-indigo-100"
    >
      <View className="flex-1 justify-center px-6">
        <View className="bg-white rounded-3xl shadow-2xl p-8">
          {/* Header */}
          <View className="items-center mb-8">
            <View className="w-20 h-20 bg-blue-500 rounded-full items-center justify-center mb-4">
              <Text className="text-white text-3xl font-bold">📱</Text>
            </View>
            <Text className="text-3xl font-bold text-gray-800 mb-2">Welcome</Text>
            <Text className="text-gray-500 text-center">
              {otpSent ? 'Enter the OTP sent to your phone' : 'Sign in with your phone number'}
            </Text>
          </View>

          {/* Phone Number Input */}
          {!otpSent && (
            <View className="mb-6">
              <Text className="text-gray-700 font-semibold mb-2">Phone Number</Text>
              <Controller
                control={control}
                name="phoneNumber"
                rules={{
                  required: 'Phone number is required',
                  minLength: {
                    value: 10,
                    message: 'Phone number must be at least 10 digits',
                  },
                }}
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    className="bg-gray-50 border border-gray-300 rounded-xl px-4 py-4 text-lg"
                    placeholder="+1 5551234567 or 5551234567"
                    keyboardType="phone-pad"
                    value={value}
                    onChangeText={onChange}
                    editable={!loading}
                  />
                )}
              />
              {errors.phoneNumber && (
                <Text className="text-red-500 text-sm mt-1">{errors.phoneNumber.message}</Text>
              )}
            </View>
          )}

          {/* OTP Input */}
          {otpSent && (
            <View className="mb-6">
              <Text className="text-gray-700 font-semibold mb-2">OTP Code</Text>
              <Controller
                control={control}
                name="otp"
                rules={{
                  required: 'OTP is required',
                  minLength: {
                    value: 6,
                    message: 'OTP must be 6 digits',
                  },
                }}
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    className="bg-gray-50 border border-gray-300 rounded-xl px-4 py-4 text-lg text-center tracking-widest"
                    placeholder="000000"
                    keyboardType="number-pad"
                    maxLength={6}
                    value={value}
                    onChangeText={onChange}
                    editable={!loading}
                  />
                )}
              />
              {errors.otp && (
                <Text className="text-red-500 text-sm mt-1">{errors.otp.message}</Text>
              )}
            </View>
          )}

          {/* Submit Button */}
          <TouchableOpacity
            className={`rounded-xl py-4 items-center ${
              loading ? 'bg-blue-300' : 'bg-blue-500'
            }`}
            onPress={handleSubmit(otpSent ? onVerifyOTP : onSendOTP)}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white font-bold text-lg">
                {otpSent ? 'Verify OTP' : 'Send OTP'}
              </Text>
            )}
          </TouchableOpacity>

          {/* Resend OTP */}
          {otpSent && (
            <View className="mt-4 items-center">
              <TouchableOpacity
                onPress={onResendOTP}
                disabled={cooldown > 0 || loading}
              >
                <Text
                  className={`${
                    cooldown > 0 ? 'text-gray-400' : 'text-blue-500'
                  } font-semibold`}
                >
                  {cooldown > 0 ? `Resend OTP in ${cooldown}s` : 'Resend OTP'}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Back Button */}
          {otpSent && (
            <TouchableOpacity
              className="mt-4 items-center"
              onPress={() => setOtpSent(false)}
              disabled={loading}
            >
              <Text className="text-gray-600">Change phone number</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* reCAPTCHA container */}
        <View id="recaptcha-container" />
      </View>
    </KeyboardAvoidingView>
  );
}
