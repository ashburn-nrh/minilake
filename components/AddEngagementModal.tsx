import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { Ionicons } from '@expo/vector-icons';
import { addEngagement } from '../lib/firebase/customers';

interface AddEngagementModalProps {
  visible: boolean;
  customerId: string;
  onClose: () => void;
  onSuccess: () => void;
}

type EngagementForm = {
  title: string;
  status: 'open' | 'in_progress' | 'won' | 'lost';
};

const statusOptions: Array<{ value: EngagementForm['status']; label: string }> = [
  { value: 'open', label: 'Open' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'won', label: 'Won' },
  { value: 'lost', label: 'Lost' },
];

export const AddEngagementModal = ({
  visible,
  customerId,
  onClose,
  onSuccess,
}: AddEngagementModalProps) => {
  const [loading, setLoading] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<EngagementForm>({
    defaultValues: {
      title: '',
      status: 'open',
    },
  });

  const selectedStatus = watch('status');

  const onSubmit = async (data: EngagementForm) => {
    setLoading(true);
    try {
      await addEngagement(customerId, {
        title: data.title,
        status: data.status,
      });

      Alert.alert('Success', 'Engagement added successfully');
      reset();
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error(error);
      Alert.alert('Error', error.message || 'Failed to add engagement');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    reset();
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
        <View className="bg-white rounded-t-3xl p-6">
          {/* Header */}
          <View className="flex-row items-center justify-between mb-6">
            <Text className="text-2xl font-bold text-gray-800">
              Add Engagement
            </Text>
            <TouchableOpacity onPress={handleClose}>
              <Ionicons name="close" size={28} color="#6b7280" />
            </TouchableOpacity>
          </View>

          {/* Title */}
          <View className="mb-4">
            <Text className="text-gray-700 font-semibold mb-2">Title *</Text>
            <Controller
              control={control}
              name="title"
              rules={{ required: 'Title is required' }}
              render={({ field: { onChange, value } }) => (
                <TextInput
                  className="bg-gray-50 border border-gray-300 rounded-xl px-4 py-3"
                  placeholder="e.g., Initial consultation"
                  value={value}
                  onChangeText={onChange}
                />
              )}
            />
            {errors.title && (
              <Text className="text-red-500 text-sm mt-1">
                {errors.title.message}
              </Text>
            )}
          </View>

          {/* Status */}
          <View className="mb-6">
            <Text className="text-gray-700 font-semibold mb-2">Status *</Text>
            <Controller
              control={control}
              name="status"
              render={({ field: { onChange, value } }) => (
                <View className="flex-row flex-wrap gap-2">
                  {statusOptions.map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      onPress={() => onChange(option.value)}
                      className={`px-4 py-3 rounded-xl border-2 ${
                        value === option.value
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-300 bg-white'
                      }`}
                    >
                      <Text
                        className={`font-semibold ${
                          value === option.value
                            ? 'text-blue-700'
                            : 'text-gray-700'
                        }`}
                      >
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            />
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
              <Text className="text-white font-bold text-lg">
                Add Engagement
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};
