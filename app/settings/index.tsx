import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { signOut } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../../lib/firebase/config';
import { showAlert, showMessage } from '../../lib/utils/alert';

interface UserProfile {
  uid: string;
  phoneNumber: string;
  displayName?: string;
  createdAt: string;
  lastLogin: string;
}

export default function SettingsScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        router.replace('/login');
        return;
      }

      const userRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userRef);

      if (userDoc.exists()) {
        const data = userDoc.data() as UserProfile;
        setProfile(data);
        setDisplayName(data.displayName || '');
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      showMessage('Error', 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDisplayName = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      setSaving(true);
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        displayName: displayName.trim() || null,
      });

      setProfile((prev) => (prev ? { ...prev, displayName: displayName.trim() } : null));
      setIsEditing(false);
      showMessage('Success', 'Display name updated successfully');
    } catch (error) {
      console.error('Error updating display name:', error);
      showMessage('Error', 'Failed to update display name');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    showAlert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          try {
            await signOut(auth);
            router.replace('/login');
          } catch (error) {
            console.error('Logout error:', error);
            showMessage('Error', 'Failed to sign out. Please try again.');
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 items-center justify-center">
        <ActivityIndicator size="large" color="#3b82f6" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView>
        {/* Header */}
        <View className="bg-white px-4 py-4 border-b border-gray-200">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center">
              <TouchableOpacity
                onPress={() => router.back()}
                className="mr-3 p-2 -ml-2"
              >
                <Ionicons name="arrow-back" size={24} color="#374151" />
              </TouchableOpacity>
              <Text className="text-2xl font-bold text-gray-800">Settings</Text>
            </View>
          </View>
        </View>

        {/* Profile Section */}
        <View className="bg-white mt-4 mx-4 rounded-2xl p-6 shadow-sm">
          <View className="items-center mb-6">
            <View className="w-24 h-24 rounded-full bg-blue-100 items-center justify-center mb-3">
              <Ionicons name="person" size={48} color="#3b82f6" />
            </View>
            <Text className="text-lg font-semibold text-gray-800">
              {profile?.displayName || 'User'}
            </Text>
          </View>

          {/* Phone Number */}
          <View className="mb-6">
            <Text className="text-sm font-semibold text-gray-600 mb-2">
              Phone Number
            </Text>
            <View className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 flex-row items-center">
              <Ionicons name="call-outline" size={20} color="#6b7280" />
              <Text className="ml-3 text-base text-gray-800">
                {profile?.phoneNumber || 'Not available'}
              </Text>
            </View>
          </View>

          {/* Display Name */}
          <View className="mb-6">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-sm font-semibold text-gray-600">
                Display Name (Optional)
              </Text>
              {!isEditing && (
                <TouchableOpacity
                  onPress={() => setIsEditing(true)}
                  className="flex-row items-center"
                >
                  <Ionicons name="pencil" size={16} color="#3b82f6" />
                  <Text className="text-blue-500 ml-1 font-semibold">Edit</Text>
                </TouchableOpacity>
              )}
            </View>

            {isEditing ? (
              <View>
                <TextInput
                  className="bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 text-base"
                  placeholder="Enter your display name"
                  value={displayName}
                  onChangeText={setDisplayName}
                  autoFocus
                />
                <View className="flex-row mt-3 space-x-2">
                  <TouchableOpacity
                    onPress={() => {
                      setDisplayName(profile?.displayName || '');
                      setIsEditing(false);
                    }}
                    className="flex-1 bg-gray-200 rounded-xl py-3 items-center mr-2"
                    disabled={saving}
                  >
                    <Text className="text-gray-700 font-semibold">Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleSaveDisplayName}
                    className="flex-1 bg-blue-500 rounded-xl py-3 items-center"
                    disabled={saving}
                  >
                    {saving ? (
                      <ActivityIndicator color="white" />
                    ) : (
                      <Text className="text-white font-semibold">Save</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 flex-row items-center">
                <Ionicons name="person-outline" size={20} color="#6b7280" />
                <Text className="ml-3 text-base text-gray-800">
                  {profile?.displayName || 'Not set'}
                </Text>
              </View>
            )}
          </View>

          {/* Account Info */}
          <View className="border-t border-gray-200 pt-4">
            <Text className="text-xs text-gray-500 mb-1">Account Created</Text>
            <Text className="text-sm text-gray-700">
              {profile?.createdAt
                ? new Date(profile.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })
                : 'Unknown'}
            </Text>
          </View>
        </View>

        {/* Sign Out Button */}
        <View className="mx-4 mt-6 mb-8">
          <TouchableOpacity
            onPress={handleLogout}
            className="bg-red-500 rounded-xl py-4 flex-row items-center justify-center shadow-sm"
          >
            <Ionicons name="log-out-outline" size={24} color="white" />
            <Text className="text-white font-bold text-lg ml-2">Sign Out</Text>
          </TouchableOpacity>
        </View>

        {/* App Info */}
        <View className="items-center pb-8">
          <Text className="text-gray-400 text-xs">Version 1.0.0</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
