import { View, Text, TouchableOpacity, Image, Platform } from 'react-native';
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

  const formatPhone = (phone: string) => {
    // Format phone number for better readability
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    return phone;
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      className={`
        bg-white rounded-2xl p-4 mb-3 shadow-sm border border-gray-100
        web:hover:shadow-md web:hover:border-gray-200 web:transition-all web:duration-200
        active:scale-[0.98] web:active:scale-100
        ${Platform.OS === 'web' ? 'cursor-pointer' : ''}
      `}
    >
      {/* Mobile Layout */}
      <View className="sm:hidden">
        <View className="flex-row items-center">
          {/* Avatar */}
          <View className="mr-3">
            {customer.avatar ? (
              <Image
                source={{ uri: customer.avatar }}
                className="w-12 h-12 rounded-full"
              />
            ) : (
              <View className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 items-center justify-center shadow-sm">
                <Text className="text-white font-bold text-base">
                  {getInitials(customer.name)}
                </Text>
              </View>
            )}
          </View>

          {/* Info */}
          <View className="flex-1 min-w-0">
            <Text className="text-base font-bold text-gray-800 mb-1" numberOfLines={1}>
              {customer.name}
            </Text>
            <Text className="text-gray-600 text-sm mb-2" numberOfLines={1}>
              {formatPhone(customer.phone)}
            </Text>
            
            {/* Tags - Mobile: Show max 2 tags */}
            {customer.tags && customer.tags.length > 0 && (
              <View className="flex-row flex-wrap gap-1">
                {customer.tags.slice(0, 2).map((tag, index) => (
                  <View
                    key={index}
                    className="bg-blue-100 px-2 py-1 rounded-full"
                  >
                    <Text className="text-blue-700 text-xs font-semibold">
                      {tag}
                    </Text>
                  </View>
                ))}
                {customer.tags.length > 2 && (
                  <View className="bg-gray-100 px-2 py-1 rounded-full">
                    <Text className="text-gray-600 text-xs font-semibold">
                      +{customer.tags.length - 2}
                    </Text>
                  </View>
                )}
              </View>
            )}
          </View>

          {/* Actions */}
          <View className="items-end ml-2">
            <Text className="text-gray-400 text-xs mb-3">
              {formatDate(customer.lastActivity)}
            </Text>
            
            <View className="flex-row gap-1">
              <TouchableOpacity
                onPress={(e) => {
                  e.stopPropagation();
                  onEdit();
                }}
                className="p-2 bg-blue-50 rounded-full"
              >
                <Ionicons name="pencil" size={14} color="#3b82f6" />
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                className="p-2 bg-red-50 rounded-full"
              >
                <Ionicons name="trash" size={14} color="#ef4444" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>

      {/* Desktop/Tablet Layout */}
      <View className="hidden sm:flex">
        <View className="flex-row items-center">
          {/* Avatar */}
          <View className="mr-3">
            {customer.avatar ? (
              <Image
                source={{ uri: customer.avatar }}
                className="w-16 h-16 rounded-full"
              />
            ) : (
              <View className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 items-center justify-center shadow-sm">
                <Text className="text-white font-bold text-xl">
                  {getInitials(customer.name)}
                </Text>
              </View>
            )}
          </View>

          {/* Info */}
          <View className="flex-1 min-w-0">
            <Text className="text-xl font-bold text-gray-800 mb-1">
              {customer.name}
            </Text>
            <Text className="text-gray-600 mb-3">
              {formatPhone(customer.phone)}
            </Text>
            
            {/* Tags - Desktop: Show all tags */}
            {customer.tags && customer.tags.length > 0 && (
              <View className="flex-row flex-wrap gap-2">
                {customer.tags.map((tag, index) => (
                  <View
                    key={index}
                    className="bg-blue-100 px-3 py-1 rounded-full"
                  >
                    <Text className="text-blue-700 text-sm font-semibold">
                      {tag}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Last Activity & Actions */}
          <View className="items-end">
            <Text className="text-gray-400 text-sm mb-4">
              {formatDate(customer.lastActivity)}
            </Text>
            
            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={(e) => {
                  e.stopPropagation();
                  onEdit();
                }}
                className="p-3 bg-blue-50 rounded-full web:hover:bg-blue-100 web:transition-colors"
              >
                <Ionicons name="pencil" size={18} color="#3b82f6" />
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                className="p-3 bg-red-50 rounded-full web:hover:bg-red-100 web:transition-colors"
              >
                <Ionicons name="trash" size={18} color="#ef4444" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};
