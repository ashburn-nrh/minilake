import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  ScrollView,
  ActivityIndicator,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db, auth } from '../lib/firebase/config';
import { addCustomerOwner, removeCustomerOwner, assignCustomerToPhoneOwner } from '../lib/firebase/customers';
import { showMessage, showAlert } from '../lib/utils/alert';

interface ManageOwnersModalProps {
  visible: boolean;
  customerId: string;
  customerName: string;
  currentOwnerIds: string[];
  onClose: () => void;
  onUpdate: () => void;
}

interface User {
  id: string;
  email?: string;
  phoneNumber?: string;
  displayName?: string;
}

export const ManageOwnersModal = ({
  visible,
  customerId,
  customerName,
  currentOwnerIds,
  onClose,
  onUpdate,
}: ManageOwnersModalProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [owners, setOwners] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (visible) {
      loadOwners();
    }
  }, [visible, currentOwnerIds]);

  const loadOwners = async () => {
    setLoading(true);
    try {
      const ownersList: User[] = [];
      
      for (const ownerId of currentOwnerIds) {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('__name__', '==', ownerId));
        const snapshot = await getDocs(q);
        
        snapshot.forEach((doc) => {
          ownersList.push({
            id: doc.id,
            email: doc.data().email,
            phoneNumber: doc.data().phoneNumber,
            displayName: doc.data().displayName,
          });
        });
      }
      
      setOwners(ownersList);
    } catch (error) {
      console.error('Error loading owners:', error);
      showMessage('Error', 'Failed to load owners');
    } finally {
      setLoading(false);
    }
  };

  const searchUsers = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('phoneNumber', '>=', searchQuery), where('phoneNumber', '<=', searchQuery + '\uf8ff'));
      const snapshot = await getDocs(q);
      
      const results: User[] = [];
      snapshot.forEach((doc) => {
        // Exclude already added owners
        if (!currentOwnerIds.includes(doc.id)) {
          results.push({
            id: doc.id,
            email: doc.data().email,
            phoneNumber: doc.data().phoneNumber,
            displayName: doc.data().displayName,
          });
        }
      });
      
      setSearchResults(results);
    } catch (error) {
      console.error('Error searching users:', error);
      showMessage('Error', 'Failed to search users');
    } finally {
      setSearching(false);
    }
  };

  const handleAddOwner = async (userId: string) => {
    const currentUserId = auth.currentUser?.uid;
    if (!currentUserId) {
      showMessage('Error', 'Not authenticated');
      return;
    }

    try {
      await addCustomerOwner(customerId, userId, currentUserId);
      showMessage('Success', 'Owner added successfully');
      setSearchQuery('');
      setSearchResults([]);
      onUpdate();
    } catch (error: any) {
      console.error('Error adding owner:', error);
      showMessage('Error', error.message || 'Failed to add owner');
    }
  };

  const handleAddOwnerByPhone = async () => {
    if (!searchQuery.trim()) {
      showMessage('Error', 'Please enter a phone number');
      return;
    }

    const currentUserId = auth.currentUser?.uid;
    if (!currentUserId) {
      showMessage('Error', 'Not authenticated');
      return;
    }

    try {
      await assignCustomerToPhoneOwner(customerId, searchQuery.trim(), currentUserId);
      showMessage('Success', 'Owner added successfully');
      setSearchQuery('');
      setSearchResults([]);
      onUpdate();
    } catch (error: any) {
      console.error('Error adding owner by phone:', error);
      showMessage('Error', error.message || 'Failed to add owner');
    }
  };

  const handleRemoveOwner = (userId: string, userName: string) => {
    if (currentOwnerIds.length === 1) {
      showMessage('Error', 'Cannot remove the last owner');
      return;
    }

    showAlert(
      'Remove Owner',
      `Are you sure you want to remove ${userName} as an owner?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeCustomerOwner(customerId, userId);
              showMessage('Success', 'Owner removed successfully');
              onUpdate();
            } catch (error: any) {
              console.error('Error removing owner:', error);
              showMessage('Error', error.message || 'Failed to remove owner');
            }
          },
        },
      ]
    );
  };

  const getUserDisplayName = (user: User) => {
    return user.displayName || user.phoneNumber || user.email || 'Unknown User';
  };

  const { width } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';
  const isLargeScreen = width >= 768;

  return (
    <Modal
      visible={visible}
      animationType={isWeb ? 'fade' : 'slide'}
      transparent
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/50 items-center justify-center p-4">
        <View 
          className="bg-white rounded-3xl p-6 w-full shadow-2xl"
          style={{
            maxWidth: isLargeScreen ? 600 : undefined,
            maxHeight: '90%',
          }}
        >
          {/* Header */}
          <View className="flex-row items-center justify-between mb-6">
            <View className="flex-1">
              <Text className="text-2xl font-bold text-gray-800">
                Manage Owners
              </Text>
              <Text className="text-gray-600 text-sm mt-1">
                Customer: <Text className="font-semibold">{customerName}</Text>
              </Text>
            </View>
            <TouchableOpacity 
              onPress={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <Ionicons name="close" size={28} color="#6b7280" />
            </TouchableOpacity>
          </View>

          <ScrollView 
            showsVerticalScrollIndicator={false}
            className="flex-1"
          >
            {/* Search Section */}
            <View className="mb-6">
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-gray-700 font-semibold text-lg">
                  Add New Owner
                </Text>
                <View className="bg-blue-100 px-3 py-1 rounded-full">
                  <Text className="text-blue-700 text-xs font-semibold">
                    Search by phone
                  </Text>
                </View>
              </View>
              
              <View className="flex-row items-center bg-gray-50 border-2 border-gray-200 rounded-xl px-4 py-3 mb-3 hover:border-blue-300 transition-colors">
                <Ionicons name="search" size={20} color="#9ca3af" />
                <TextInput
                  className="flex-1 ml-2 text-base outline-none"
                  placeholder="Enter phone number..."
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  onSubmitEditing={searchUsers}
                  autoCapitalize="none"
                  keyboardType="phone-pad"
                />
                {searching ? (
                  <ActivityIndicator size="small" color="#3b82f6" />
                ) : (
                  <View className="flex-row gap-2">
                    <TouchableOpacity 
                      onPress={searchUsers}
                      className="bg-blue-500 p-2 rounded-lg hover:bg-blue-600 transition-colors"
                    >
                      <Ionicons name="search" size={18} color="white" />
                    </TouchableOpacity>
                    <TouchableOpacity 
                      onPress={handleAddOwnerByPhone}
                      className="bg-green-500 p-2 rounded-lg hover:bg-green-600 transition-colors"
                    >
                      <Ionicons name="add" size={18} color="white" />
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              <Text className="text-gray-400 text-xs mb-4">
                🔍 Search to find existing users or ➕ Add directly by phone number
              </Text>

              {/* Search Results */}
              {searchResults.length > 0 && (
                <View className="bg-gradient-to-b from-blue-50 to-white rounded-xl p-3 mb-4 border border-blue-100">
                  <Text className="text-gray-600 text-xs font-semibold mb-2 uppercase tracking-wide">
                    Search Results ({searchResults.length})
                  </Text>
                  {searchResults.map((user) => (
                    <View
                      key={user.id}
                      className="flex-row items-center justify-between p-4 bg-white rounded-xl mb-2 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
                    >
                      <View className="flex-1 mr-3">
                        <View className="flex-row items-center mb-1">
                          <View className="w-8 h-8 bg-blue-500 rounded-full items-center justify-center mr-2">
                            <Text className="text-white font-bold text-sm">
                              {getUserDisplayName(user).charAt(0).toUpperCase()}
                            </Text>
                          </View>
                          <Text className="text-gray-800 font-semibold flex-1">
                            {getUserDisplayName(user)}
                          </Text>
                        </View>
                        <Text className="text-gray-500 text-sm ml-10">
                          {user.phoneNumber || user.email}
                        </Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => handleAddOwner(user.id)}
                        className="bg-blue-500 px-5 py-2.5 rounded-lg hover:bg-blue-600 transition-colors shadow-sm"
                      >
                        <Text className="text-white font-semibold">Add</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* Current Owners */}
            <View>
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-gray-700 font-semibold text-lg">
                  Current Owners
                </Text>
                <View className="bg-green-100 px-3 py-1 rounded-full">
                  <Text className="text-green-700 text-xs font-semibold">
                    {owners.length} {owners.length === 1 ? 'Owner' : 'Owners'}
                  </Text>
                </View>
              </View>
              
              {loading ? (
                <View className="py-12 items-center">
                  <ActivityIndicator size="large" color="#3b82f6" />
                  <Text className="text-gray-500 mt-3">Loading owners...</Text>
                </View>
              ) : owners.length > 0 ? (
                <View className="space-y-2">
                  {owners.map((owner, index) => (
                    <View
                      key={owner.id}
                      className="flex-row items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-white rounded-xl border border-gray-200 hover:border-gray-300 transition-all shadow-sm"
                    >
                      <View className="flex-1 flex-row items-center">
                        <View className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full items-center justify-center mr-3 shadow-md">
                          <Text className="text-white font-bold">
                            {getUserDisplayName(owner).charAt(0).toUpperCase()}
                          </Text>
                        </View>
                        <View className="flex-1">
                          <View className="flex-row items-center">
                            <Text className="text-gray-800 font-semibold">
                              {getUserDisplayName(owner)}
                            </Text>
                            {index === 0 && (
                              <View className="ml-2 bg-yellow-100 px-2 py-0.5 rounded">
                                <Text className="text-yellow-700 text-xs font-semibold">
                                  Creator
                                </Text>
                              </View>
                            )}
                          </View>
                          <Text className="text-gray-500 text-sm mt-0.5">
                            {owner.phoneNumber || owner.email}
                          </Text>
                        </View>
                      </View>
                      {owners.length > 1 && (
                        <TouchableOpacity
                          onPress={() =>
                            handleRemoveOwner(owner.id, getUserDisplayName(owner))
                          }
                          className="p-2.5 bg-red-50 rounded-lg hover:bg-red-100 transition-colors ml-2"
                        >
                          <Ionicons name="trash-outline" size={20} color="#ef4444" />
                        </TouchableOpacity>
                      )}
                    </View>
                  ))}
                </View>
              ) : (
                <View className="py-12 items-center bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                  <Ionicons name="people-outline" size={48} color="#d1d5db" />
                  <Text className="text-gray-400 text-center mt-3 font-medium">
                    No owners found
                  </Text>
                </View>
              )}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};
