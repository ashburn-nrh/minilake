import { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { Ionicons } from '@expo/vector-icons';
import { RecaptchaVerifier, ConfirmationResult, signInAnonymously } from 'firebase/auth';
import { sendOTP, verifyOTP } from '../lib/firebase/auth';
import { auth } from '../lib/firebase/config';
import {
  registerForPushNotificationsAsync,
  savePushToken,
} from '../setup/notifications';
import { showAlert, showMessage } from '../lib/utils/alert';
import * as Device from 'expo-device';

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

    setLoading(true);
    try {
      // Format phone number (remove spaces, dashes, parentheses)
      let formattedPhone = data.phoneNumber.trim().replace(/[\s\-\(\)]/g, '');
      
      // Add country code if not present
      if (!formattedPhone.startsWith('+')) {
        formattedPhone = '+91' + formattedPhone; // Default to IND (+91)
      }

      // Validate format
      if (formattedPhone.length < 12) {
        showMessage('Invalid Phone', 'Please enter a valid phone number with country code (e.g., +1 5551234567)');
        setLoading(false);
        return;
      }

      // Platform-specific OTP sending
      let result;
      if (Platform.OS === 'web') {
        // For web, use RecaptchaVerifier
        const verifier = recaptchaVerifier.current || new RecaptchaVerifier(auth, 'recaptcha-container', {
          size: 'invisible',
        });
        result = await sendOTP(formattedPhone, verifier);
      } else {
        // For mobile, React Native Firebase handles verification
        result = await sendOTP(formattedPhone);
      }
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

  // DEV MODE: Skip login for iOS simulator
  const handleDevModeLogin = async () => {
    setLoading(true);
    try {
      // Sign in anonymously for testing
      await signInAnonymously(auth);
      showMessage('Dev Mode', 'Logged in as test user (simulator only)');
      router.replace('/customers');
    } catch (error: any) {
      console.error('Dev login error:', error);
      showMessage('Error', 'Failed to login in dev mode');
    } finally {
      setLoading(false);
    }
  };

  // Show dev mode for simulators/emulators or when phone auth might not work
  // Useful for testing without needing real phone numbers
  const isSimulator = Platform.OS !== 'web' && !Device.isDevice;
  
  const { width } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';
  const isLargeScreen = width >= 1024;
  const isMediumScreen = width >= 768;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1"
      style={{ backgroundColor: '#f0f9ff' }}
    >
      <ScrollView 
        contentContainerStyle={{ 
          flexGrow: 1,
          justifyContent: 'center',
          alignItems: 'center',
          padding: isWeb ? 24 : 16,
        }}
      >
        {/* Background Decorations */}
        <View className="absolute top-0 left-0 w-full h-full">
          <View className="absolute top-10 left-10 w-32 h-32 bg-blue-200 rounded-full opacity-20" />
          <View className="absolute bottom-20 right-10 w-40 h-40 bg-indigo-200 rounded-full opacity-20" />
          <View className="absolute top-1/3 right-20 w-24 h-24 bg-purple-200 rounded-full opacity-20" />
        </View>

        {/* Main Card */}
        <View 
          className="bg-white rounded-3xl shadow-2xl w-full"
          style={{
            maxWidth: isLargeScreen ? 500 : isMediumScreen ? 450 : '100%',
            padding: isWeb ? 48 : 32,
          }}
        >
          {/* Header */}
          <View className="items-center mb-8">
            <View className="w-24 h-24 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl items-center justify-center mb-6 shadow-lg">
              <Ionicons name="lock-closed" size={40} color="white" />
            </View>
            <Text className="text-4xl font-bold text-gray-800 mb-2">
              {otpSent ? 'Verify OTP' : 'Welcome Back'}
            </Text>
            <Text className="text-gray-500 text-center text-base">
              {otpSent 
                ? 'Enter the 6-digit code sent to your phone' 
                : 'Sign in securely with your phone number'}
            </Text>
          </View>

          {/* Phone Number Input */}
          {!otpSent && (
            <View className="mb-6">
              <View className="flex-row items-center mb-3">
                <Ionicons name="call" size={20} color="#3b82f6" />
                <Text className="text-gray-700 font-semibold ml-2 text-base">Phone Number</Text>
              </View>
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
                  <View className="relative">
                    <View className="absolute left-4 top-4 z-10">
                      <Ionicons name="phone-portrait" size={20} color="#9ca3af" />
                    </View>
                    <TextInput
                      className="bg-gray-50 border-2 border-gray-200 rounded-xl pl-12 pr-4 py-4 text-lg hover:border-blue-300 transition-colors"
                      placeholder="+91 123456789"
                      placeholderTextColor="#9ca3af"
                      keyboardType="phone-pad"
                      value={value}
                      onChangeText={onChange}
                      editable={!loading}
                    />
                  </View>
                )}
              />
              {errors.phoneNumber && (
                <View className="flex-row items-center mt-2">
                  <Ionicons name="alert-circle" size={16} color="#ef4444" />
                  <Text className="text-red-500 text-sm ml-1">{errors.phoneNumber.message}</Text>
                </View>
              )}
              <Text className="text-gray-400 text-xs mt-2">
                💡 Include country code (e.g., +91 for India)
              </Text>
            </View>
          )}

          {/* OTP Input */}
          {otpSent && (
            <View className=" mb-6">
              <View className="flex-row items-center mb-3">
                <Ionicons name="shield-checkmark" size={20} color="#3b82f6" />
                <Text className="text-gray-700 font-semibold ml-2 text-base">Verification Code</Text>
              </View>
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
                  <View className="relative">
                    <View className="absolute left-1/2 -ml-3 top-4 z-10">
                      <Ionicons name="keypad" size={20} color="#9ca3af" />
                    </View>
                    <TextInput
                      className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl px-4 py-5 text-2xl text-center tracking-[0.5em] font-bold hover:border-blue-400 transition-colors"
                      placeholder="● ● ● ● ● ●"
                      placeholderTextColor="#d1d5db"
                      keyboardType="number-pad"
                      maxLength={6}
                      value={value}
                      onChangeText={onChange}
                      editable={!loading}
                    />
                  </View>
                )}
              />
              {errors.otp && (
                <View className="flex-row items-center mt-2">
                  <Ionicons name="alert-circle" size={16} color="#ef4444" />
                  <Text className="text-red-500 text-sm ml-1">{errors.otp.message}</Text>
                </View>
              )}
            </View>
          )}

          {/* Submit Button */}
          <TouchableOpacity
            className={`rounded-xl py-5 items-center shadow-lg ${
              loading ? 'bg-gray-400' : 'bg-gradient-to-r from-blue-500 to-indigo-600'
            }`}
            onPress={handleSubmit(otpSent ? onVerifyOTP : onSendOTP)}
            disabled={loading}
            style={{
              shadowColor: '#3b82f6',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 8,
            }}
          >
            {loading ? (
              <View className="flex-row items-center">
                <ActivityIndicator color="white" />
                <Text className="text-white font-semibold text-lg ml-2">Processing...</Text>
              </View>
            ) : (
              <View className="bg-blue-500 flex-row items-center px-6 py-3 rounded-xl">
                <Ionicons 
                  name={otpSent ? 'checkmark-circle' : 'send'} 
                  size={24} 
                  color="white" 
                />
                <Text className="text-white font-bold text-lg ml-2">
                  {otpSent ? 'Verify & Sign In' : 'Send Verification Code'}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Resend OTP */}
          {otpSent && (
            <View className="mt-6 items-center">
              <TouchableOpacity
                onPress={onResendOTP}
                disabled={cooldown > 0 || loading}
                className="flex-row items-center px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Ionicons 
                  name="refresh" 
                  size={18} 
                  color={cooldown > 0 ? '#9ca3af' : '#3b82f6'} 
                />
                <Text
                  className={`ml-2 font-semibold ${
                    cooldown > 0 ? 'text-gray-400' : 'text-blue-500'
                  }`}
                >
                  {cooldown > 0 ? `Resend code in ${cooldown}s` : 'Resend verification code'}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Back Button */}
          {otpSent && (
            <TouchableOpacity
              className="mt-3 items-center flex-row justify-center px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
              onPress={() => setOtpSent(false)}
              disabled={loading}
            >
              <Ionicons name="arrow-back" size={18} color="#6b7280" />
              <Text className="text-gray-600 ml-2 font-medium">Change phone number</Text>
            </TouchableOpacity>
          )}

          {/* DEV MODE: Simulator Bypass */}
          {isSimulator && (
            <View className="mt-8 pt-6 border-t-2 border-dashed border-gray-200">
              <View className="flex-row items-center justify-center mb-3">
                <Ionicons name="flask" size={16} color="#f59e0b" />
                <Text className="text-center text-gray-500 text-xs ml-1 font-semibold uppercase tracking-wide">
                  Development Mode
                </Text>
              </View>
              <TouchableOpacity
                className="bg-gradient-to-r from-orange-500 to-amber-600 rounded-xl py-4 items-center shadow-md hover:shadow-lg transition-all"
                onPress={handleDevModeLogin}
                disabled={loading}
              >
                <View className="flex-row items-center">
                  <Ionicons name="rocket" size={20} color="white" />
                  <Text className="text-white font-bold ml-2">
                    Skip Login (Testing)
                  </Text>
                </View>
              </TouchableOpacity>
              <Text className="text-center text-gray-400 text-xs mt-3">
                ⚠️ For simulator/emulator or when phone auth fails
              </Text>
            </View>
          )}

          {/* Features */}
          {!otpSent && (
            <View className="mt-8 pt-6 border-t border-gray-100">
              <Text className="text-center text-gray-400 text-xs font-semibold mb-3 uppercase tracking-wide">
                Secure & Fast
              </Text>
              <View className="flex-row justify-around">
                <View className="items-center flex-1">
                  <View className="w-10 h-10 bg-green-100 rounded-full items-center justify-center mb-2">
                    <Ionicons name="shield-checkmark" size={20} color="#10b981" />
                  </View>
                  <Text className="text-gray-600 text-xs text-center">Secure</Text>
                </View>
                <View className="items-center flex-1">
                  <View className="w-10 h-10 bg-blue-100 rounded-full items-center justify-center mb-2">
                    <Ionicons name="flash" size={20} color="#3b82f6" />
                  </View>
                  <Text className="text-gray-600 text-xs text-center">Fast</Text>
                </View>
                <View className="items-center flex-1">
                  <View className="w-10 h-10 bg-purple-100 rounded-full items-center justify-center mb-2">
                    <Ionicons name="lock-closed" size={20} color="#8b5cf6" />
                  </View>
                  <Text className="text-gray-600 text-xs text-center">Private</Text>
                </View>
              </View>
            </View>
          )}
        </View>

        {/* Footer */}
        <Text className="text-center text-gray-400 text-xs mt-6">
          By signing in, you agree to our Terms & Privacy Policy
        </Text>

        {/* reCAPTCHA container */}
        <View id="recaptcha-container" />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
