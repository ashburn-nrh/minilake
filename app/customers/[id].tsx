import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
  SafeAreaView,
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
import { AddEngagementModal } from '../../components/AddEngagementModal';

export default function CustomerDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [engagements, setEngagements] = useState<Engagement[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [showEngagementModal, setShowEngagementModal] = useState(false);
  
  // Editable fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [tags, setTags] = useState('');

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
      Alert.alert('Error', 'Failed to load customer data');
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
      Alert.alert('Success', 'Customer updated successfully');
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to update customer');
    }
  };

  const handleAvatarUpload = async () => {
    if (!id) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) {
      try {
        const avatarUrl = await uploadAvatar(id, result.assets[0].uri);
        await updateCustomer(id, { avatar: avatarUrl });
        
        if (customer) {
          setCustomer({ ...customer, avatar: avatarUrl });
        }
        
        Alert.alert('Success', 'Avatar updated successfully');
      } catch (error) {
        console.error(error);
        Alert.alert('Error', 'Failed to upload avatar');
      }
    }
  };

  const handleAttachmentUpload = async () => {
    if (!id) return;

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
        Alert.alert('Success', 'Attachment uploaded successfully');
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to upload attachment');
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
      <View className="bg-white px-4 py-4 border-b border-gray-200 flex-row items-center justify-between">
        <TouchableOpacity onPress={() => router.back()} className="p-2">
          <Ionicons name="arrow-back" size={24} color="#1f2937" />
        </TouchableOpacity>
        
        <Text className="text-xl font-bold text-gray-800">Customer Details</Text>
        
        <TouchableOpacity
          onPress={() => (editMode ? handleSave() : setEditMode(true))}
          className="p-2"
        >
          <Ionicons
            name={editMode ? 'checkmark' : 'pencil'}
            size={24}
            color="#3b82f6"
          />
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1">
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

        {/* Engagements Section */}
        <View className="bg-white m-4 rounded-2xl p-6 shadow-sm">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-xl font-bold text-gray-800">Engagements</Text>
            <TouchableOpacity
              onPress={() => setShowEngagementModal(true)}
              className="bg-blue-500 px-4 py-2 rounded-lg flex-row items-center"
            >
              <Ionicons name="add" size={20} color="white" />
              <Text className="text-white font-semibold ml-1">Add</Text>
            </TouchableOpacity>
          </View>

          {engagements.length > 0 ? (
            engagements.map((engagement) => (
              <EngagementCard key={engagement.id} engagement={engagement} />
            ))
          ) : (
            <Text className="text-gray-400 text-center py-4">
              No engagements yet
            </Text>
          )}
        </View>

        {/* Attachments Section */}
        <View className="bg-white m-4 rounded-2xl p-6 shadow-sm mb-8">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-xl font-bold text-gray-800">Attachments</Text>
            <TouchableOpacity
              onPress={handleAttachmentUpload}
              className="bg-blue-500 px-4 py-2 rounded-lg flex-row items-center"
            >
              <Ionicons name="cloud-upload" size={20} color="white" />
              <Text className="text-white font-semibold ml-1">Upload</Text>
            </TouchableOpacity>
          </View>

          {attachments.length > 0 ? (
            <View className="flex-row flex-wrap gap-3">
              {attachments.map((attachment) => (
                <TouchableOpacity
                  key={attachment.id}
                  className="w-[30%] aspect-square rounded-xl overflow-hidden bg-gray-100"
                >
                  {attachment.type.startsWith('image/') ? (
                    <Image
                      source={{ uri: attachment.url }}
                      className="w-full h-full"
                    />
                  ) : (
                    <View className="w-full h-full items-center justify-center">
                      <Ionicons name="document" size={40} color="#9ca3af" />
                      <Text className="text-xs text-gray-600 mt-2 text-center px-1">
                        {attachment.name}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <Text className="text-gray-400 text-center py-4">
              No attachments yet
            </Text>
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
    </SafeAreaView>
  );
}
