import { View, Text, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Customer } from '../lib/firebase/customers';

interface CustomerCardProps {
  customer: Customer;
  onPress: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export const CustomerCard = ({ customer, onPress, onEdit, onDelete }: CustomerCardProps) => {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      className="bg-white rounded-2xl p-4 mb-3 shadow-sm border border-gray-100"
    >
      <View className="flex-row items-center">
        {/* Avatar */}
        <View className="mr-4">
          {customer.avatar ? (
            <Image
              source={{ uri: customer.avatar }}
              className="w-14 h-14 rounded-full"
            />
          ) : (
            <View className="w-14 h-14 rounded-full bg-blue-500 items-center justify-center">
              <Text className="text-white font-bold text-lg">
                {getInitials(customer.name)}
              </Text>
            </View>
          )}
        </View>

        {/* Info */}
        <View className="flex-1">
          <Text className="text-lg font-bold text-gray-800 mb-1">
            {customer.name}
          </Text>
          <Text className="text-gray-600 mb-2">{customer.phone}</Text>
          
          {/* Tags */}
          {customer.tags && customer.tags.length > 0 && (
            <View className="flex-row flex-wrap gap-2">
              {customer.tags.map((tag, index) => (
                <View
                  key={index}
                  className="bg-blue-100 px-2 py-1 rounded-full"
                >
                  <Text className="text-blue-700 text-xs font-semibold">
                    {tag}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Last Activity & Menu */}
        <View className="items-end">
          <Text className="text-gray-400 text-xs mb-2">
            {formatDate(customer.lastActivity)}
          </Text>
          
          <View className="flex-row gap-2">
            <TouchableOpacity
              onPress={onEdit}
              className="p-2 bg-blue-50 rounded-full"
            >
              <Ionicons name="pencil" size={16} color="#3b82f6" />
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={onDelete}
              className="p-2 bg-red-50 rounded-full"
            >
              <Ionicons name="trash" size={16} color="#ef4444" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};
