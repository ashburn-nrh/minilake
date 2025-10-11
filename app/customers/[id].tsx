import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Image,
  SafeAreaView,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import {
  Customer,
  Engagement,
  Attachment,
  getCustomer,
  updateCustomer,
  getEngagements,
  getAttachments,
  uploadAvatar,
  uploadAttachment,
} from '../../lib/firebase/customers';
import { EngagementCard } from '../../components/EngagementCard';
import { EngagementCardEditable } from '../../components/EngagementCardEditable';
import { AddEngagementModal } from '../../components/AddEngagementModal';
import { ManageOwnersModal } from '../../components/ManageOwnersModal';
import { showMessage } from '../../lib/utils/alert';
import { useAuth } from '../../hooks/useAuth';

export default function CustomerDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [engagements, setEngagements] = useState<Engagement[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [showEngagementModal, setShowEngagementModal] = useState(false);
  const [showOwnersModal, setShowOwnersModal] = useState(false);
  
  // Editable fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [tags, setTags] = useState('');
  
  const { width } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';
  const isLargeScreen = width >= 1024;
  const isMediumScreen = width >= 768;

  useEffect(() => {
    loadCustomerData();
  }, [id]);

  const loadCustomerData = async () => {
    if (!id) return;
    
    setLoading(true);
    try {
      const [customerData, engagementsData, attachmentsData] = await Promise.all([
        getCustomer(id),
        getEngagements(id),
        getAttachments(id),
      ]);

      if (customerData) {
        setCustomer(customerData);
        setName(customerData.name);
        setPhone(customerData.phone);
        setEmail(customerData.email || '');
        setTags(customerData.tags?.join(', ') || '');
      }
      
      setEngagements(engagementsData);
      setAttachments(attachmentsData);
    } catch (error) {
      console.error(error);
      showMessage('Error', 'Failed to load customer data');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!id || !customer) return;

    try {
      const tagsArray = tags
        .split(',')
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0);

      await updateCustomer(id, {
        name,
        phone,
        email,
        tags: tagsArray,
      });

      setCustomer({
        ...customer,
        name,
        phone,
        email,
        tags: tagsArray,
      });

      setEditMode(false);
      showMessage('Success', 'Customer updated successfully');
    } catch (error) {
      console.error(error);
      showMessage('Error', 'Failed to update customer');
    }
  };

  const handleAvatarUpload = async () => {
    if (!id) return;

    // Check authentication
    if (!user) {
      showMessage('Authentication Required', 'Please sign in to upload images');
      return;
    }

    try {
      // Request permissions first
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        showMessage('Permission Required', 'Please grant permission to access your photo library');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7, // Slightly higher quality
        exif: false, // Remove EXIF data for privacy
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        
        console.log('Image picker result:', {
          uri: asset.uri,
          type: asset.type,
          fileSize: asset.fileSize,
          width: asset.width,
          height: asset.height
        });
        
        // Validate file size before upload
        if (asset.fileSize && asset.fileSize > 5 * 1024 * 1024) {
          showMessage('Error', 'Image size too large. Please choose an image smaller than 5MB.');
          return;
        }

        setLoading(true);
        
        try {
          console.log('Starting avatar upload process...');
          const avatarUrl = await uploadAvatar(id, asset.uri);
          
          console.log('Updating customer with new avatar URL...');
          await updateCustomer(id, { avatar: avatarUrl });
          
          if (customer) {
            setCustomer({ ...customer, avatar: avatarUrl });
          }
          
          showMessage('Success', 'Avatar updated successfully');
        } catch (uploadError: any) {
          console.error('Avatar upload error:', uploadError);
          showMessage('Upload Failed', uploadError.message || 'Failed to upload avatar. Please try again.');
        }
      }
    } catch (error: any) {
      console.error('Image picker error:', error);
      showMessage('Error', 'Failed to open image picker. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAttachmentUpload = async () => {
    if (!id) return;

    // Check authentication
    if (!user) {
      showMessage('Authentication Required', 'Please sign in to upload files');
      return;
    }

    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'application/pdf'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const file = result.assets[0];
        const url = await uploadAttachment(
          id,
          file.uri,
          file.name,
          file.mimeType || 'application/octet-stream'
        );
        
        await loadCustomerData();
        showMessage('Success', 'Attachment uploaded successfully');
      }
    } catch (error) {
      console.error(error);
      showMessage('Error', 'Failed to upload attachment');
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  if (!customer) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <Text className="text-gray-500">Customer not found</Text>
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-4 py-4 border-b border-gray-200 flex-row items-center justify-between shadow-sm">
        <TouchableOpacity 
          onPress={() => router.back()} 
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <Ionicons name="arrow-back" size={24} color="#1f2937" />
        </TouchableOpacity>
        
        <Text className="text-xl font-bold text-gray-800">Customer Details</Text>
        
        <TouchableOpacity
          onPress={() => (editMode ? handleSave() : setEditMode(true))}
          className="p-2 hover:bg-blue-50 rounded-lg transition-colors"
        >
          <Ionicons
            name={editMode ? 'checkmark' : 'pencil'}
            size={24}
            color="#3b82f6"
          />
        </TouchableOpacity>
      </View>

      <ScrollView 
        className="flex-1"
        contentContainerStyle={{
          maxWidth: isLargeScreen ? 1200 : '100%',
          width: '100%',
          alignSelf: 'center',
        }}
      >
        {/* Profile Card */}
        <View className="bg-white m-4 rounded-2xl p-6 shadow-sm">
          {/* Avatar */}
          <View className="items-center mb-6">
            <TouchableOpacity
              onPress={handleAvatarUpload}
              className="relative"
            >
              {customer.avatar ? (
                <Image
                  source={{ uri: customer.avatar }}
                  className="w-24 h-24 rounded-full"
                />
              ) : (
                <View className="w-24 h-24 rounded-full bg-blue-500 items-center justify-center">
                  <Text className="text-white font-bold text-3xl">
                    {getInitials(customer.name)}
                  </Text>
                </View>
              )}
              <View className="absolute bottom-0 right-0 bg-blue-500 rounded-full p-2">
                <Ionicons name="camera" size={16} color="white" />
              </View>
            </TouchableOpacity>
          </View>

          {/* Editable Fields */}
          <View className="space-y-4">
            {/* Name */}
            <View>
              <Text className="text-gray-600 text-sm mb-1">Name</Text>
              {editMode ? (
                <TextInput
                  className="bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-base"
                  value={name}
                  onChangeText={setName}
                />
              ) : (
                <Text className="text-gray-800 text-lg font-semibold">
                  {customer.name}
                </Text>
              )}
            </View>

            {/* Phone */}
            <View>
              <Text className="text-gray-600 text-sm mb-1">Phone</Text>
              {editMode ? (
                <TextInput
                  className="bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-base"
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                />
              ) : (
                <Text className="text-gray-800 text-base">{customer.phone}</Text>
              )}
            </View>

            {/* Email */}
            <View>
              <Text className="text-gray-600 text-sm mb-1">Email</Text>
              {editMode ? (
                <TextInput
                  className="bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-base"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              ) : (
                <Text className="text-gray-800 text-base">
                  {customer.email || 'Not provided'}
                </Text>
              )}
            </View>

            {/* Tags */}
            <View>
              <Text className="text-gray-600 text-sm mb-1">Tags</Text>
              {editMode ? (
                <TextInput
                  className="bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-base"
                  value={tags}
                  onChangeText={setTags}
                  placeholder="VIP, Premium (comma separated)"
                />
              ) : (
                <View className="flex-row flex-wrap gap-2">
                  {customer.tags && customer.tags.length > 0 ? (
                    customer.tags.map((tag, index) => (
                      <View
                        key={index}
                        className="bg-blue-100 px-3 py-1 rounded-full"
                      >
                        <Text className="text-blue-700 text-sm font-semibold">
                          {tag}
                        </Text>
                      </View>
                    ))
                  ) : (
                    <Text className="text-gray-400">No tags</Text>
                  )}
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Owners Section */}
        <View className="bg-white m-4 rounded-2xl p-6 shadow-sm border border-gray-100">
          <View className="flex-row items-center justify-between mb-4">
            <View className="flex-1">
              <Text className="text-xl font-bold text-gray-800">Owners</Text>
              <Text className="text-gray-500 text-sm mt-1">
                Manage who can access this customer
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => setShowOwnersModal(true)}
              className="bg-gradient-to-r from-blue-500 to-blue-600 px-5 py-3 rounded-xl flex-row items-center shadow-md hover:shadow-lg transition-all"
            >
              <Ionicons name="people" size={20} color="grey" />
              <Text className="text-gray-600 font-semibold ml-2">Manage</Text>
            </TouchableOpacity>
          </View>

          <View className="flex-row items-center bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-100">
            <View className="w-12 h-12 bg-blue-500 rounded-full items-center justify-center mr-3">
              <Ionicons name="people" size={24} color="white" />
            </View>
            <View>
              <Text className="text-gray-800 font-bold text-lg">
                {customer.ownerIds?.length || 1}
              </Text>
              <Text className="text-gray-600 text-sm">
                {(customer.ownerIds?.length || 1) === 1 ? 'Owner' : 'Owners'} assigned
              </Text>
            </View>
          </View>
        </View>

        {/* Engagements Section */}
        <View className="bg-white m-4 rounded-2xl p-6 shadow-sm border border-gray-100">
          <View className="flex-row items-center justify-between mb-4">
            <View className="flex-1">
              <Text className="text-xl font-bold text-gray-800">Engagements</Text>
              <Text className="text-gray-500 text-sm mt-1">
                Track deals and opportunities
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => setShowEngagementModal(true)}
              className="bg-gradient-to-r from-green-500 to-green-600 px-5 py-3 rounded-xl flex-row items-center shadow-md hover:shadow-lg transition-all"
            >
              <Ionicons name="add" size={20} color="grey" />
              <Text className="text-gray-600 font-semibold ml-1">Add</Text>
            </TouchableOpacity>
          </View>

          {engagements.length > 0 ? (
            <View className="space-y-2">
              {engagements.map((engagement) => (
                <EngagementCardEditable
                  key={engagement.id}
                  engagement={engagement}
                  customerId={id || ''}
                  onUpdate={loadCustomerData}
                />
              ))}
            </View>
          ) : (
            <View className="py-12 items-center bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
              <Ionicons name="briefcase-outline" size={48} color="#d1d5db" />
              <Text className="text-gray-400 text-center mt-3 font-medium">
                No engagements yet
              </Text>
              <Text className="text-gray-400 text-center text-sm mt-1">
                Tap the Add button to create your first engagement
              </Text>
            </View>
          )}
        </View>

        {/* Attachments Section */}
        <View className="bg-white m-4 rounded-2xl p-6 shadow-sm mb-8 border border-gray-100">
          <View className="flex-row items-center justify-between mb-4">
            <View className="flex-1">
              <Text className="text-xl font-bold text-gray-800">Attachments</Text>
              <Text className="text-gray-500 text-sm mt-1">
                Documents and images
              </Text>
            </View>
            <TouchableOpacity
              onPress={handleAttachmentUpload}
              className="bg-gradient-to-r from-purple-500 to-purple-600 px-5 py-3 rounded-xl flex-row items-center shadow-md hover:shadow-lg transition-all"
            >
              <Ionicons name="cloud-upload" size={20} color="grey" />
              <Text className="text-gray-600 font-semibold ml-1">Upload</Text>
            </TouchableOpacity>
          </View>

          {attachments.length > 0 ? (
            <View 
              className="flex-row flex-wrap gap-3"
              style={{
                justifyContent: isLargeScreen ? 'flex-start' : 'space-between',
              }}
            >
              {attachments.map((attachment) => (
                <TouchableOpacity
                  key={attachment.id}
                  className="rounded-xl overflow-hidden bg-gray-100 shadow-sm hover:shadow-md transition-shadow border border-gray-200"
                  style={{
                    width: isLargeScreen ? '23%' : isMediumScreen ? '30%' : '48%',
                    aspectRatio: 1,
                  }}
                >
                  {attachment.type.startsWith('image/') ? (
                    <Image
                      source={{ uri: attachment.url }}
                      className="w-full h-full"
                      resizeMode="cover"
                    />
                  ) : (
                    <View className="w-full h-full items-center justify-center p-2">
                      <View className="w-16 h-16 bg-blue-100 rounded-full items-center justify-center mb-2">
                        <Ionicons name="document" size={32} color="#3b82f6" />
                      </View>
                      <Text className="text-xs text-gray-600 text-center font-medium" numberOfLines={2}>
                        {attachment.name}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View className="py-12 items-center bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
              <Ionicons name="cloud-upload-outline" size={48} color="#d1d5db" />
              <Text className="text-gray-400 text-center mt-3 font-medium">
                No attachments yet
              </Text>
              <Text className="text-gray-400 text-center text-sm mt-1">
                Upload documents or images to get started
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Add Engagement Modal */}
      <AddEngagementModal
        visible={showEngagementModal}
        customerId={id || ''}
        onClose={() => setShowEngagementModal(false)}
        onSuccess={loadCustomerData}
      />

      {/* Manage Owners Modal */}
      <ManageOwnersModal
        visible={showOwnersModal}
        customerId={id || ''}
        customerName={customer?.name || ''}
        currentOwnerIds={customer?.ownerIds || []}
        onClose={() => setShowOwnersModal(false)}
        onUpdate={loadCustomerData}
      />
    </SafeAreaView>
  );
}
