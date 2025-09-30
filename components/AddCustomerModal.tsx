import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { createCustomer, uploadAvatar } from '../lib/firebase/customers';
import { auth } from '../lib/firebase/config';

interface AddCustomerModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type CustomerForm = {
  name: string;
  phone: string;
  email?: string;
  tags: string;
};

export const AddCustomerModal = ({ visible, onClose, onSuccess }: AddCustomerModalProps) => {
  const [loading, setLoading] = useState(false);
  const [avatarUri, setAvatarUri] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CustomerForm>({
    defaultValues: {
      name: '',
      phone: '',
      email: '',
      tags: '',
    },
  });

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) {
      setAvatarUri(result.assets[0].uri);
    }
  };

  const onSubmit = async (data: CustomerForm) => {
    const userId = auth.currentUser?.uid;
    if (!userId) {
      Alert.alert('Error', 'User not authenticated');
      return;
    }

    setLoading(true);
    try {
      const tags = data.tags
        .split(',')
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0);

      const customerId = await createCustomer(userId, {
        name: data.name,
        phone: data.phone,
        email: data.email,
        tags,
      });

      // Upload avatar if selected
      if (avatarUri && customerId) {
        const avatarUrl = await uploadAvatar(customerId, avatarUri);
        // Update customer with avatar URL
        const { updateCustomer } = await import('../lib/firebase/customers');
        await updateCustomer(customerId, { avatar: avatarUrl });
      }

      Alert.alert('Success', 'Customer added successfully');
      reset();
      setAvatarUri(null);
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error(error);
      Alert.alert('Error', error.message || 'Failed to add customer');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    reset();
    setAvatarUri(null);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleClose}
    >
      <View className="flex-1 bg-black/50 justify-end">
        <View className="bg-white rounded-t-3xl p-6 max-h-[90%]">
          {/* Header */}
          <View className="flex-row items-center justify-between mb-6">
            <Text className="text-2xl font-bold text-gray-800">Add Customer</Text>
            <TouchableOpacity onPress={handleClose}>
              <Ionicons name="close" size={28} color="#6b7280" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Avatar Picker */}
            <View className="items-center mb-6">
              <TouchableOpacity
                onPress={pickImage}
                className="w-24 h-24 rounded-full bg-gray-200 items-center justify-center border-2 border-dashed border-gray-400"
              >
                {avatarUri ? (
                  <Image
                    source={{ uri: avatarUri }}
                    className="w-full h-full rounded-full"
                  />
                ) : (
                  <Ionicons name="camera" size={32} color="#9ca3af" />
                )}
              </TouchableOpacity>
              <Text className="text-gray-500 text-sm mt-2">Tap to add photo</Text>
            </View>

            {/* Name */}
            <View className="mb-4">
              <Text className="text-gray-700 font-semibold mb-2">Name *</Text>
              <Controller
                control={control}
                name="name"
                rules={{ required: 'Name is required' }}
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    className="bg-gray-50 border border-gray-300 rounded-xl px-4 py-3"
                    placeholder="John Doe"
                    value={value}
                    onChangeText={onChange}
                  />
                )}
              />
              {errors.name && (
                <Text className="text-red-500 text-sm mt-1">{errors.name.message}</Text>
              )}
            </View>

            {/* Phone */}
            <View className="mb-4">
              <Text className="text-gray-700 font-semibold mb-2">Phone *</Text>
              <Controller
                control={control}
                name="phone"
                rules={{
                  required: 'Phone is required',
                  pattern: {
                    value: /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/,
                    message: 'Invalid phone number',
                  },
                }}
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    className="bg-gray-50 border border-gray-300 rounded-xl px-4 py-3"
                    placeholder="+1 (555) 123-4567"
                    keyboardType="phone-pad"
                    value={value}
                    onChangeText={onChange}
                  />
                )}
              />
              {errors.phone && (
                <Text className="text-red-500 text-sm mt-1">{errors.phone.message}</Text>
              )}
            </View>

            {/* Email */}
            <View className="mb-4">
              <Text className="text-gray-700 font-semibold mb-2">Email</Text>
              <Controller
                control={control}
                name="email"
                rules={{
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Invalid email address',
                  },
                }}
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    className="bg-gray-50 border border-gray-300 rounded-xl px-4 py-3"
                    placeholder="john@example.com"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={value}
                    onChangeText={onChange}
                  />
                )}
              />
              {errors.email && (
                <Text className="text-red-500 text-sm mt-1">{errors.email.message}</Text>
              )}
            </View>

            {/* Tags */}
            <View className="mb-6">
              <Text className="text-gray-700 font-semibold mb-2">Tags</Text>
              <Controller
                control={control}
                name="tags"
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    className="bg-gray-50 border border-gray-300 rounded-xl px-4 py-3"
                    placeholder="VIP, Premium, etc. (comma separated)"
                    value={value}
                    onChangeText={onChange}
                  />
                )}
              />
              <Text className="text-gray-400 text-xs mt-1">
                Separate tags with commas
              </Text>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              className={`rounded-xl py-4 items-center ${
                loading ? 'bg-blue-300' : 'bg-blue-500'
              }`}
              onPress={handleSubmit(onSubmit)}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white font-bold text-lg">Add Customer</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};
